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
    cy.clearCookies();
    cy.task("seedDatabase", null, { timeout: 150000 });
    cy.intercept("POST", "**/api/visualizacion").as("cargar");
    agendaPage.visit();
    cy.wait("@cargar");
    cy.get(agendaPage.loading).should("not.exist");
  });

  function filtrarPorEstado(valor: string) {
    cy.get('[data-cy="filtro-estado"]').click();
    cy.get(`[data-cy="filtro-opcion-${valor}"]`).click();
  }

  it("debería enviar el estado elegido a la API y marcar el filtro activo", () => {
    filtrarPorEstado("Confirmada");
    cy.wait("@cargar").then((interception) => {
      expect(interception.request.body.filtros.estado).to.eq("Confirmada");
    });

    cy.get(agendaPage.loading).should("not.exist");
    cy.get('[data-cy="filtro-activo"]').should("be.visible");
  });

  it("debería mostrar solo reservas del estado elegido", () => {
    filtrarPorEstado("Confirmada");
    cy.wait("@cargar");
    cy.get(agendaPage.loading).should("not.exist");

    cy.get(agendaPage.reservaItem).each(($item) => {
      expect($item.attr("data-cy-estado")).to.eq("Confirmada");
    });
  });

  it("Regresión INC-0421: elegir 'Todos' desactiva el filtro y limpia la cookie", () => {
    filtrarPorEstado("Confirmada");
    cy.wait("@cargar");
    cy.get(agendaPage.loading).should("not.exist");

    filtrarPorEstado("todos");
    cy.wait("@cargar").then((interception) => {
      expect(interception.request.body.filtros.estado).to.equal(undefined);
    });
    cy.get(agendaPage.loading).should("not.exist");

    cy.get('[data-cy="filtro-activo"]').should("not.exist");
    cy.getCookie("agenda_filtro_estado").should("be.null");
    cy.get(agendaPage.reservaItem).then(($items) => {
      const estados = [...$items].map((el) => el.getAttribute("data-cy-estado"));
      expect(estados.some((estado) => estado !== "Confirmada")).to.eq(true);
    });
  });

  it("Regresión INC-0421: al recargar, el selector refleja el filtro recordado", () => {
    filtrarPorEstado("PendienteDeConfirmacion");
    cy.wait("@cargar");
    cy.get(agendaPage.loading).should("not.exist");

    cy.reload();
    cy.wait("@cargar");
    cy.get(agendaPage.loading).should("not.exist");

    cy.get('[data-cy="filtro-estado"]').should("contain.text", "Pendiente de confirmación");
    cy.get('[data-cy="filtro-activo"]').should("be.visible");
    cy.get(agendaPage.reservaItem).each(($item) => {
      expect($item.attr("data-cy-estado")).to.eq("PendienteDeConfirmacion");
    });
  });
});
