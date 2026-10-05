import { AgendaPage } from "../pages/AgendaPage";

/**
 * M05 - Alternancia entre vista semanal y mensual del calendario.
 *
 * Cubre toggle-semana / toggle-mes, el título del toolbar (rango semanal o mes),
 * la navegación semanal y la renderización de reservas en la grilla semanal.
 * visualizacion-agenda.cy.js solo cubre calendario/lista.
 *
 * Cada cambio de período dispara un POST /api/visualizacion: la espera explícita
 * con cy.wait evita leer el DOM anterior mientras la respuesta está en vuelo.
 */

// "Oct 28 - 3, 2026", "Oct 28 - Nov 3, 2026" o "Oct 28, 2026 - Nov 3, 2027".
const TITULO_SEMANA =
  /^[A-Z][a-z]{2} \d{1,2}(, \d{4})? - ([A-Z][a-z]{2} )?\d{1,2}(, \d{4})?, \d{4}$/;
// "Oct 2026"
const TITULO_MES = /^[A-Z][a-z]{2} \d{4}$/;

describe("AgendaYA - Vista semanal y mensual (M05)", () => {
  const agendaPage = new AgendaPage();

  beforeEach(() => {
    cy.task("seedDatabase", null, { timeout: 150000 });
    cy.intercept("POST", "**/api/visualizacion").as("cargar");
    agendaPage.visit();
    // Drena la carga inicial de la agenda para que las esperas siguientes
    // correspondan a las navegaciones del propio test.
    cy.wait("@cargar");
    cy.get(agendaPage.loading).should("not.exist");
  });

  /** Navega una semana/mes y espera a que la agenda termine de recargar. */
  function navegar(target: "toolbar-prev" | "toolbar-next") {
    cy.get(`[data-cy="${target}"]`).click();
    cy.wait("@cargar");
    cy.get(agendaPage.loading).should("not.exist");
    return agendaPage;
  }

  /** Cambia de subvista (semanal/mensual) y espera a que la agenda recargue. */
  function cambiarSubVista(subvista: "semanal" | "mensual") {
    if (subvista === "semanal") agendaPage.switchToSemanal();
    else agendaPage.switchToMensual();
    cy.wait("@cargar");
    cy.get(agendaPage.loading).should("not.exist");
    return agendaPage;
  }

  /** /agenda carga el primer administrador (la API lo devuelve ordenado por nombre). */
  function primerAdministradorId(): Cypress.Chainable<number> {
    return cy
      .request("/api/administradores")
      .then((res) => res.body.administradores[0].id as number);
  }

  /** Reservas del primer administrador ordenadas de más antigua a más reciente. */
  function primerReservaId(): Cypress.Chainable<number> {
    return primerAdministradorId().then((administradorId) => {
      const desde = new Date();
      desde.setFullYear(desde.getFullYear() - 1);
      const hasta = new Date();
      hasta.setFullYear(hasta.getFullYear() + 1);

      return cy
        .request("POST", "/api/visualizacion", {
          administradorId,
          fechaDesde: desde.toISOString(),
          fechaHasta: hasta.toISOString(),
          modoVista: "lista",
          pagina: 1,
          porPagina: 100,
        })
        .then((res) => {
          const reservas = res.body.reservas as Array<{ id: number }>;
          if (reservas.length === 0) {
            throw new Error("El seed no creó ninguna reserva para el primer administrador");
          }
          return reservas[0].id;
        });
    });
  }

  /** Avanza el calendario semanal hasta que la reserva quede renderizada. */
  function asegurarReservaVisible(reservaId: number, intentos = 6): void {
    cy.get("body").then(($body) => {
      const item = `[data-cy="reserva-item"][data-reserva-id="${reservaId}"]`;
      if ($body.find(item).length > 0) return;
      if (intentos <= 0) {
        throw new Error(`La reserva ${reservaId} no se renderizó en la grilla semanal`);
      }
      navegar("toolbar-next");
      asegurarReservaVisible(reservaId, intentos - 1);
    });
  }

  /** Avanza la vista mensual hasta encontrar reservas renderizadas. */
  function asegurarReservasMensuales(intentos = 3): void {
    cy.get("body").then(($body) => {
      if ($body.find(agendaPage.reservaItem).length > 0) return;
      if (intentos <= 0) {
        throw new Error("No se encontraron reservas en la vista mensual");
      }
      navegar("toolbar-next");
      asegurarReservasMensuales(intentos - 1);
    });
  }

  it("debería mostrar la semana con su título, navegar semanas y volver a la vista mensual", () => {
    // Act: cambiar a vista semanal
    cambiarSubVista("semanal");

    // Assert: el título muestra el rango de la semana actual
    cy.get('[data-cy="toolbar-title"]')
      .invoke("text")
      .should("match", TITULO_SEMANA)
      .as("tituloSemana");

    // Act: avanzar una semana y volver a la original
    navegar("toolbar-next");
    cy.get('[data-cy="toolbar-title"]').invoke("text").should("match", TITULO_SEMANA);
    navegar("toolbar-prev");

    // Assert: volvió a la semana original (el título es determinístico por fecha)
    cy.get("@tituloSemana").then((tituloSemana) => {
      cy.get('[data-cy="toolbar-title"]').invoke("text").should("eq", tituloSemana);
    });

    // Assert: las reservas se renderizan en la grilla semanal
    primerReservaId().then((reservaId) => {
      asegurarReservaVisible(reservaId);
      cy.get(`[data-cy="reserva-item"][data-reserva-id="${reservaId}"]`).should("exist");
    });

    // Act: volver a la vista mensual
    cambiarSubVista("mensual");

    // Assert: el título vuelve a formato mes y la grilla muestra reservas
    cy.get('[data-cy="toolbar-title"]').invoke("text").should("match", TITULO_MES);
    asegurarReservasMensuales();
    agendaPage.shouldHaveReservas();
  });
});
