import { AgendaPage } from "../pages/AgendaPage";

/**
 * M05 - Estado vacío de la agenda.
 *
 * Cubre la rama de ListaReservas que muestra "No hay reservas para este período"
 * y la recuperación al volver a un período con datos. Todos los specs existentes
 * asumen reservas en el período visible.
 *
 * Cada cambio de período dispara un POST /api/visualizacion: la espera explícita
 * con cy.wait evita leer el DOM anterior mientras la respuesta está en vuelo.
 */

describe("AgendaYA - Estado vacío de la agenda (M05)", () => {
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

  /** Navega un período y espera a que la agenda termine de recargar. */
  function navegar(target: "toolbar-prev" | "toolbar-next") {
    cy.get(`[data-cy="${target}"]`).click();
    cy.wait("@cargar");
    cy.get(agendaPage.loading).should("not.exist");
    return agendaPage;
  }

  /** Avanza el toolbar hasta que la agenda vuelva a mostrar reservas. */
  function navegarHastaReservas(intentos = 6): void {
    cy.get("body").then(($body) => {
      if ($body.find(agendaPage.reservaItem).length > 0) return;
      if (intentos <= 0) {
        throw new Error("No se encontraron reservas al avanzar en el calendario");
      }
      navegar("toolbar-next");
      navegarHastaReservas(intentos - 1);
    });
  }

  it("debería mostrar 'No hay reservas para este período' en un mes sin reservas", () => {
    // Arrange: pasar a la vista de lista (la rama vacía vive en ListaReservas)
    agendaPage.switchToLista();
    cy.wait("@cargar");
    cy.get(agendaPage.loading).should("not.exist");

    // Act: retroceder 3 meses; el seed solo crea reservas futuras, por lo que
    // cualquier mes anterior al actual queda sin reservas
    navegar("toolbar-prev");
    navegar("toolbar-prev");
    navegar("toolbar-prev");

    // Assert: estado vacío visible y sin indicador de carga
    cy.get(agendaPage.noReservas)
      .should("be.visible")
      .and("contain", "No hay reservas para este período");
    cy.get(agendaPage.loading).should("not.exist");

    // Act: avanzar hasta recuperar un período con reservas
    navegarHastaReservas();

    // Assert: la lista vuelve a mostrar reservas y el estado vacío desaparece
    agendaPage.shouldHaveReservas();
    cy.get(agendaPage.noReservas).should("not.exist");
  });
});
