import { AgendaPage } from "../pages/AgendaPage";
import { DetalleReservaPage } from "../pages/DetalleReservaPage";
import { ReagendarModalPage } from "../pages/ReagendarModalPage";

/**
 * US_010 - Confirmar cambios (M05-RF01)
 *
 * CP-US010-001 (positivo): reagendar a un horario libre -> estado "Confirmada"
 *   y mensaje de éxito visible para el administrador.
 * CP-US010-002 (negativo): reagendar a un horario ya ocupado -> rechazo con
 *   mensaje explícito, sin modificar la reserva original.
 *
 * Notas de diseño:
 *  - La interfaz solo ofrece horarios libres, por lo que el solapamiento del
 *    CP-US010-002 no es alcanzable de forma directa desde el modal: se valida a
 *    nivel API (donde el servicio re-verifica la disponibilidad al confirmar) y,
 *    a nivel UI, se reproduce la condición de carrera real.
 *  - El día y el turno se calculan consultando la MISMA API que consume la UI
 *    (/api/disponibilidad), para no depender de fechas fijas ni del día de la semana.
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

describe("US_010 - Confirmar cambios (M05-RF01)", () => {
  const agendaPage = new AgendaPage();
  const detallePage = new DetalleReservaPage();
  const reagendarPage = new ReagendarModalPage();

  /**
   * La suite E2E muta datos (cancelar / confirmar / reagendar) y no restaura el estado,
   * por lo que un test puede quedarse sin datos según el orden y la fecha de ejecución.
   * Cada caso siembra la base y recarga la agenda, así ambos quedan independientes entre
   * sí y del resto de los specs: sus precondiciones siempre son una reserva en estado
   * PendienteDeConfirmacion y una reserva Confirmada de la misma agenda.
   */
  beforeEach(() => {
    cy.task("seedDatabase", null, { timeout: 150000 });
    agendaPage.visit();
  });

  // El caso de carrera crea una reserva extra por el link público (M04). Se restaura el
  // seed al terminar el spec para no dejar datos sueltos a los specs que corren después.
  after(() => {
    cy.task("seedDatabase", null, { timeout: 150000 });
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

  /**
   * Variante de buscarDiaConTurnos que, además del día (DD/MM/AAAA), devuelve el ISO del
   * primer turno ofrecido. Se usa para reproducir la condición de carrera: ocupar ese turno
   * por el link público antes de que el administrador confirme.
   */
  function buscarDiaYTurno(
    tipoEventoId: number,
    year: number,
    monthIndex: number,
    mesesMaximos = 3
  ): Cypress.Chainable<{ dia: string; slotIso: string }> {
    const intentar = (
      restantes: number,
      y: number,
      m: number
    ): Cypress.Chainable<{ dia: string; slotIso: string }> => {
      const { desde, hasta } = rangoDeMes(y, m);

      return cy
        .request("POST", "/api/disponibilidad", {
          tipoEventoId,
          fechaDesde: desde.toISOString(),
          fechaHasta: hasta.toISOString(),
        })
        .then((res) => {
          const dia = res.body.data.find((d: { slots: unknown[] }) => d.slots.length > 0) as
            { fecha: string; slots: { inicio: string }[] } | undefined;
          if (dia) {
            return cy.wrap({ dia: fechaKey(dia.fecha), slotIso: dia.slots[0].inicio });
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

  it("CP-US010-001: debería confirmar el cambio hacia un horario libre y mostrar el mensaje de éxito", () => {
    primerAdministradorId().then((administradorId) => {
      // Arrange: debe existir una reserva en estado PendienteDeConfirmacion
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
          const tipoEventoId = detalle.body.data.tipoEvento.id as number;
          const fechaReserva = new Date(detalle.body.data.fechaHoraInicio as string);

          // El seed ya crea un registro de historial por reserva: se guarda el total
          // previo para poder verificar que el reagendar agregue uno NUEVO.
          cy.task("getHistorial", reservaId).as("historialInicial");

          // Act: abrir el detalle de la reserva y el modal de reagendar
          asegurarReservaVisible(reservaId);
          agendaPage.clickReservaById(reservaId);
          detallePage.waitForModal();
          detallePage.clickReagendar();
          reagendarPage.waitForModal();

          // Precondición del CP: debe existir un horario libre en el mes visible
          buscarDiaConTurnos(
            tipoEventoId,
            fechaReserva.getFullYear(),
            fechaReserva.getMonth()
          ).then((dia) => {
            cy.intercept("POST", "**/api/reservas/reagendar").as("reagendar");

            reagendarPage.selectDay(dia);
            reagendarPage.selectFirstSlot();
            reagendarPage.clickConfirmar();
            reagendarPage.shouldShowConfirmacionConTurno();
            reagendarPage.confirmarCambio();

            // Assert: respuesta exitosa, mensaje de éxito visible y modal cerrado
            cy.wait("@reagendar").then(({ response }) => {
              expect(response?.statusCode).to.eq(200);
              expect(response?.body.data.mensaje).to.eq("¡La reserva se re-agendó con éxito!");
              const nuevaFechaHora = response?.body.data.reserva.fechaHoraInicio;

              reagendarPage.shouldShowExito("re-agendó con éxito");
              reagendarPage.shouldBeClosed();

              // Assert: la reserva queda Confirmada con la nueva fecha y hora
              cy.request(`/api/reservas/${reservaId}`).then((actualizada) => {
                expect(actualizada.body.data.estado.nombre).to.eq("Confirmada");
                expect(actualizada.body.data.fechaHoraInicio).to.eq(nuevaFechaHora);
              });

              // Assert: se creó un NUEVO registro de historial, con estado Confirmada y
              // marca de tiempo. Se consulta la base porque la API no expone el historial.
              cy.get("@historialInicial").then((previo) => {
                const totalPrevio = (previo as unknown[]).length;
                cy.task("getHistorial", reservaId).then((historial) => {
                  const registros = historial as Array<{ estado: string; fechaCambio: string }>;
                  expect(registros).to.have.length(totalPrevio + 1);
                  const nuevoRegistro = registros[registros.length - 1];
                  expect(nuevoRegistro.estado).to.eq("Confirmada");
                  expect(Number.isNaN(new Date(nuevoRegistro.fechaCambio).getTime())).to.eq(false);
                });
              });
            });
          });
        });
      });
    });
  });

  it("CP-US010-002: debería rechazar el cambio hacia un horario ocupado manteniendo la reserva original", () => {
    primerAdministradorId().then((administradorId) => {
      reservasDelAdmin(administradorId).then((res) => {
        const reservas = res.body.reservas as Array<{ id: number; estado: string }>;
        const pendiente = reservas.find((r) => r.estado === "PendienteDeConfirmacion");
        const ocupada = reservas.find((r) => r.estado === "Confirmada");

        if (!pendiente || !ocupada) {
          throw new Error(
            "Se requiere una reserva PendienteDeConfirmacion y una Confirmada del mismo administrador"
          );
        }
        const reservaId = pendiente.id;
        const reservaOcupadaId = ocupada.id;

        cy.request(`/api/reservas/${reservaId}`).then((detallePendiente) => {
          const fechaOriginal = detallePendiente.body.data.fechaHoraInicio;

          cy.request(`/api/reservas/${reservaOcupadaId}`).then((detalleOcupada) => {
            const inicioOcupado = detalleOcupada.body.data.fechaHoraInicio;

            // Act: intentar mover la reserva pendiente al horario ya ocupado
            cy.request({
              method: "POST",
              url: "/api/reservas/reagendar",
              body: { reservaId, nuevaFechaHoraInicio: inicioOcupado },
              failOnStatusCode: false,
            }).then((respuesta) => {
              // Assert: se rechaza con un mensaje de error explícito
              expect(respuesta.status).to.eq(400);
              expect(respuesta.body.error).to.eq("El nuevo horario elegido ya está ocupado");

              // Assert: conserva fecha/hora y estado originales (no libera el turno anterior)
              cy.request(`/api/reservas/${reservaId}`).then((detalleFinal) => {
                expect(detalleFinal.body.data.fechaHoraInicio).to.eq(fechaOriginal);
                expect(detalleFinal.body.data.estado.nombre).to.eq("PendienteDeConfirmacion");
              });

              // Assert: la reserva obstáculo permanece intacta
              cy.request(`/api/reservas/${reservaOcupadaId}`).then((detalleObstaculo) => {
                expect(detalleObstaculo.body.data.fechaHoraInicio).to.eq(inicioOcupado);
                expect(detalleObstaculo.body.data.estado.nombre).to.eq("Confirmada");
              });
            });
          });
        });
      });
    });
  });

  /**
   * CP-US010-002 verificado a nivel interfaz mediante la condición de carrera REAL.
   * El modal solo ofrece horarios libres, así que el solapamiento no puede elegirse
   * directamente desde la UI. Se reproduce el escenario de producción: mientras el
   * administrador tiene la disponibilidad cargada, otro usuario ocupa ese turno por
   * el link público (M04); al confirmar, el backend revalida, rechaza con 400 y la
   * interfaz muestra el error.
   */
  it("CP-US010-002 (UI): debería mostrar el mensaje de error al confirmar un cambio no disponible", () => {
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
          const tipoEventoId = detalle.body.data.tipoEvento.id as number;
          const fechaReserva = new Date(detalle.body.data.fechaHoraInicio as string);
          const fechaOriginal = detalle.body.data.fechaHoraInicio as string;
          const estadoOriginal = detalle.body.data.estado.nombre as string;

          // Arrange: abrir el detalle y el modal de reagendar (el modal carga turnos libres)
          asegurarReservaVisible(reservaId);
          agendaPage.clickReservaById(reservaId);
          detallePage.waitForModal();
          detallePage.clickReagendar();
          reagendarPage.waitForModal();

          buscarDiaYTurno(tipoEventoId, fechaReserva.getFullYear(), fechaReserva.getMonth()).then(
            ({ dia, slotIso }) => {
              // Arrange (carrera): otro usuario ocupa ese turno por el link público antes de confirmar
              cy.request("POST", "/api/reservas", {
                tipoEventoId,
                fechaHoraInicio: slotIso,
                nombreInvitado: "Invitado Carrera",
                emailInvitado: "invitado.carrera@test.com",
              })
                .its("status")
                .should("eq", 201);

              // Act: el administrador, con la disponibilidad ya desactualizada, confirma ese turno
              reagendarPage.selectDay(dia);
              reagendarPage.selectFirstSlot();
              reagendarPage.clickConfirmar();
              reagendarPage.shouldShowConfirmacionConTurno();
              reagendarPage.confirmarCambio();

              // Assert: el backend rechaza y el mensaje queda visible para el administrador
              reagendarPage.shouldShowError("El nuevo horario elegido ya está ocupado");

              // Assert: la reserva conserva su fecha/hora y su estado originales
              cy.request(`/api/reservas/${reservaId}`).then((actualizada) => {
                expect(actualizada.body.data.fechaHoraInicio).to.eq(fechaOriginal);
                expect(actualizada.body.data.estado.nombre).to.eq(estadoOriginal);
              });
            }
          );
        });
      });
    });
  });
});
