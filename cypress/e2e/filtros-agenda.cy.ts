import { AgendaPage } from "../pages/AgendaPage";

/**
 * M05 - Filtro de reservas por estado.
 *
 * Cubre la barra de filtros de la agenda: al elegir un estado, el cliente lo
 * envía a `/api/visualizacion` y la vista muestra únicamente ese estado.
 */
describe("AgendaYA - Filtro de reservas por estado (M05)", () => {
  const agendaPage = new AgendaPage();

  beforeEach(() => {
    cy.task("seedDatabase", null, { timeout: 150000 });
    cy.intercept("POST", "**/api/visualizacion").as("cargar");
    agendaPage.visit();
    cy.wait("@cargar");
    cy.get(agendaPage.loading).should("not.exist");
  });

  it("debería enviar el estado elegido a la API y marcar el filtro activo", () => {
    cy.get('[data-cy="filtro-estado"]').select("Confirmada");
    cy.wait("@cargar").then((interception) => {
      expect(interception.request.body.filtros.estado).to.eq("Confirmada");
    });

    cy.get(agendaPage.loading).should("not.exist");
    cy.get('[data-cy="filtro-activo"]').should("be.visible");
  });

  it("debería mostrar solo reservas del estado elegido", () => {
    cy.get('[data-cy="filtro-estado"]').select("Confirmada");
    cy.wait("@cargar");
    cy.get(agendaPage.loading).should("not.exist");

    cy.get(agendaPage.reservaItem).each(($item) => {
      expect($item.attr("data-cy-estado")).to.eq("Confirmada");
    });
  });
});
