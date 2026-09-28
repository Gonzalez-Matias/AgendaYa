// cypress/e2e/visualizacion-agenda.cy.js
// Test E2E — M05-RF06: Alternar entre vista de calendario y vista de lista
// Autor: Andrés Lorenzo Mortensen
// Patrón: Arrange / Act / Assert

describe('AgendaYA - M05 Gestión de Agenda (Admin)', () => {
  beforeEach(() => {
    // Arrange: navegar a la sección de agenda antes de cada test
    cy.visit('/agenda')
  })

  it('Debe mostrar la vista de calendario por defecto al ingresar a la sección', () => {
    // Arrange: la página ya cargó en beforeEach

    // Act: no se realiza ninguna acción, solo se observa el estado inicial

    // Assert: el botón "Calendario" debe estar activo por defecto
    cy.get('[data-cy="toggle-calendario"]')
      .should('exist')
      .and('have.class', 'CalendarToolbar-module__GghAdq__toggleBtnActive')
  })

  it('Debe cambiar a vista de lista al presionar el botón Lista', () => {
    // Arrange: estamos en la vista de calendario por defecto

    // Act: presionar el botón de vista de lista
    cy.get('[data-cy="toggle-lista"]').click()

    // Assert: el botón "Lista" debe quedar activo
    cy.get('[data-cy="toggle-lista"]')
      .should('have.class', 'CalendarToolbar-module__GghAdq__toggleBtnActive')
  })
})