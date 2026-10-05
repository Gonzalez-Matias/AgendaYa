import { AgendaPage } from "../pages/AgendaPage";
import { DetalleReservaPage } from "../pages/DetalleReservaPage";
import { ReagendarModalPage } from "../pages/ReagendarModalPage";

/**
 * US_010 - Reagendar: cancelar en los dos pasos de confirmación sin mutar la reserva.
 *
 * CP1: desde el diálogo de doble verificación, "Cancelar" debe volver al modal
 *      principal sin disparar ningún POST a /api/reservas.
 * CP2: desde el pie del modal, "Cancelar" debe cerrar el reagendamiento dejando
 *      la reserva con su fecha y estado originales.
 *
 * Complementa confirmar-cambios.cy.ts (camino feliz y carrera API), que no cubre
 * los caminos de cancelación del modal.
 */

// El servicio de disponibilidad rechaza rangos mayores a 30 días.
const RANGO_MAX_DIAS = 29;

function fechaKey(iso: string): string {
  const d = new Date(iso);
  const dia = String(d.getDate()).padStart(2, "0");
  const mes = String(d.getMonth() + 1).padStart(2, "0");
  return `${dia}/${mes}/${d.getFullYear()}`;
}

/** Mismo criterio de rango que usa el modal de reagendar para el mes visible. */
function rangoDeMes(year: number, monthIndex: number) {
  const desde = new Date(year, monthIndex, 1, 0, 0, 0, 0);
  const finDeMes = new Date(year, monthIndex + 1, 0, 23, 59, 59, 999);
  const maxHasta = new Date(desde);
  maxHasta.setDate(desde.getDate() + RANGO_MAX_DIAS);
  maxHasta.setHours(23, 59, 59, 999);
  const hasta = finDeMes.getTime() < maxHasta.getTime() ? finDeMes : maxHasta;
  return { desde, hasta };
}

describe("US_010 - Reagendar: cancelar sin confirmar el cambio", () => {
  const agendaPage = new AgendaPage();
  const detallePage = new DetalleReservaPage();
  const reagendarPage = new ReagendarModalPage();

  /**
   * La suite E2E muta datos y no restaura el estado, por lo que cada caso siembra
   * la base y recarga la agenda para no depender del orden de ejecución.
   */
  beforeEach(() => {
    cy.task("seedDatabase", null, { timeout: 150000 });
    cy.intercept("POST", "**/api/visualizacion").as("cargar");
    agendaPage.visit();
    // Drena la carga inicial de la agenda para que las esperas siguientes
    // correspondan a las navegaciones del propio test.
    cy.wait("@cargar");
    cy.get(agendaPage.loading).should("not.exist");
  });

  /** /agenda carga el primer administrador (la API lo devuelve ordenado por nombre). */
  function primerAdministradorId(): Cypress.Chainable<number> {
    return cy
      .request("/api/administradores")
      .then((res) => res.body.administradores[0].id as number);
  }

  function reservasDelAdmin(administradorId: number) {
    const desde = new Date();
    desde.setFullYear(desde.getFullYear() - 1);
    const hasta = new Date();
    hasta.setFullYear(hasta.getFullYear() + 1);

    return cy.request("POST", "/api/visualizacion", {
      administradorId,
      fechaDesde: desde.toISOString(),
      fechaHasta: hasta.toISOString(),
      modoVista: "lista",
      pagina: 1,
      porPagina: 100,
    });
  }

  /** Avanza el calendario principal hasta que la reserva quede renderizada. */
  function asegurarReservaVisible(reservaId: number, intentos = 3): void {
    cy.get("body").then(($body) => {
      const item = `[data-cy="reserva-item"][data-reserva-id="${reservaId}"]`;
      if ($body.find(item).length > 0) return;
      if (intentos <= 0) {
        throw new Error(`La reserva ${reservaId} no se renderizó en la agenda`);
      }
      cy.get('[data-cy="toolbar-next"]').click();
      cy.wait("@cargar");
      cy.get('[data-cy="loading"]').should("not.exist");
      asegurarReservaVisible(reservaId, intentos - 1);
    });
  }

  /**
   * Busca el primer día con turnos libres consultando la API de disponibilidad y,
   * si el mes visible no tiene turnos, avanza el mini-calendario mes a mes.
   */
  function buscarDiaConTurnos(
    tipoEventoId: number,
    year: number,
    monthIndex: number,
    mesesMaximos = 3
  ): Cypress.Chainable<string> {
    const intentar = (restantes: number, y: number, m: number): Cypress.Chainable<string> => {
      const { desde, hasta } = rangoDeMes(y, m);

      return cy
        .request("POST", "/api/disponibilidad", {
          tipoEventoId,
          fechaDesde: desde.toISOString(),
          fechaHasta: hasta.toISOString(),
        })
        .then((res) => {
          const dia = res.body.data.find((d: { slots: unknown[] }) => d.slots.length > 0);
          if (dia) {
            return cy.wrap(fechaKey(dia.fecha));
          }
          if (restantes <= 0) {
            throw new Error("No se encontró ningún día con turnos libres");
          }
          reagendarPage.nextMonth();
          const siguiente = new Date(y, m + 1, 1);
          return intentar(restantes - 1, siguiente.getFullYear(), siguiente.getMonth());
        });
    };

    return intentar(mesesMaximos, year, monthIndex);
  }

  /** Abre el modal de reagendar sobre la primera reserva pendiente del primer administrador. */
  function abrirReagendar(): Cypress.Chainable<{ reservaId: number; tipoEventoId: number }> {
    return primerAdministradorId().then((administradorId) => {
      return reservasDelAdmin(administradorId).then((res) => {
        const pendiente = res.body.reservas.find(
          (r: { id: number; estado: string }) => r.estado === "PendienteDeConfirmacion"
        );
        if (!pendiente) {
          throw new Error("No hay ninguna reserva en estado PendienteDeConfirmacion");
        }
        const reservaId = pendiente.id as number;

        return cy.request(`/api/reservas/${reservaId}`).then((detalle) => {
          expect(detalle.status).to.eq(200);
          const tipoEventoId = detalle.body.data.tipoEvento.id as number;

          asegurarReservaVisible(reservaId);
          agendaPage.clickReservaById(reservaId);
          detallePage.waitForModal();
          detallePage.clickReagendar();
          reagendarPage.waitForModal();

          return cy.wrap({ reservaId, tipoEventoId });
        });
      });
    });
  }

  it("CP1: debería volver al modal sin disparar POST al cancelar el diálogo de confirmación", () => {
    cy.intercept("POST", "**/api/reservas/**").as("mutaciones");

    abrirReagendar().then(({ tipoEventoId }) => {
      // El mes visible del mini-calendario determina qué días se ofertan.
      cy.get(reagendarPage.dias)
        .first()
        .invoke("attr", "data-dia")
        .then((fechaDia) => {
          const [, mes, anio] = String(fechaDia).split("/");
          buscarDiaConTurnos(tipoEventoId, Number(anio), Number(mes) - 1).then((dia) => {
            reagendarPage.selectDay(dia);
            reagendarPage.selectFirstSlot();
            reagendarPage.clickConfirmar();
            reagendarPage.shouldShowConfirmacion();

            // Act: cancelar desde el diálogo de doble verificación
            reagendarPage.cancelarConfirmacion();

            // Assert: el diálogo desaparece, el modal sigue abierto y no hubo mutaciones
            cy.get(reagendarPage.confirmacion).should("not.exist");
            cy.get(reagendarPage.modal).should("be.visible");
            cy.get("@mutaciones.all").should("have.length", 0);
          });
        });
    });
  });

  it("CP2: debería cerrar el reagendamiento sin mutar la reserva al cancelar desde el modal", () => {
    cy.intercept("POST", "**/api/reservas/**").as("mutaciones");

    primerAdministradorId().then((administradorId) => {
      reservasDelAdmin(administradorId).then((res) => {
        const pendiente = res.body.reservas.find(
          (r: { id: number; estado: string }) => r.estado === "PendienteDeConfirmacion"
        );
        if (!pendiente) {
          throw new Error("No hay ninguna reserva en estado PendienteDeConfirmacion");
        }
        const reservaId = pendiente.id as number;

        cy.request(`/api/reservas/${reservaId}`).then((detalle) => {
          expect(detalle.status).to.eq(200);
          const fechaOriginal = detalle.body.data.fechaHoraInicio;
          const estadoOriginal = detalle.body.data.estado.nombre;

          asegurarReservaVisible(reservaId);
          agendaPage.clickReservaById(reservaId);
          detallePage.waitForModal();
          detallePage.clickReagendar();
          reagendarPage.waitForModal();

          // Act: cancelar el reagendamiento desde el pie del modal
          reagendarPage.cancelar();

          // Assert: el modal de reagendar se cierra y el detalle sigue abierto
          reagendarPage.shouldBeClosed();
          detallePage.waitForModal();

          // Assert: no se disparó ninguna mutación y la reserva conserva fecha y estado
          cy.get("@mutaciones.all").should("have.length", 0);
          cy.request(`/api/reservas/${reservaId}`).then((actualizada) => {
            expect(actualizada.body.data.fechaHoraInicio).to.eq(fechaOriginal);
            expect(actualizada.body.data.estado.nombre).to.eq(estadoOriginal);
          });
        });
      });
    });
  });
});
