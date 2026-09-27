// cypress/e2e/detalle-reserva.cy.js
// Test E2E — M05-RF05: Mostrar detalle de reserva
// Autor: Lucca Ferrero
// Patrón: Arrange / Act / Assert

describe('AgendaYA - M05 Detalle de Reserva', () => {
  beforeEach(() => {
    // Arrange: ir a la agenda y pasar a vista de lista (más predecible que el
    // calendario para encontrar una reserva sobre la que hacer clic)
    cy.visit('/agenda')
    cy.get('[data-cy="toggle-lista"]').click()
  })

  it('Debe abrir el detalle de una reserva y mostrar su información (Escenario 1)', () => {
    // Arrange: hay al menos una reserva cargada por el seed
    cy.get('[data-cy="reserva-item"]').first().as('reservaSeleccionada')

    // Act: hacer clic sobre la reserva
    cy.get('@reservaSeleccionada').click()

    // Assert: el modal de detalle debe abrirse y mostrar el estado de la reserva
    cy.get('[data-cy="detalle-modal"]').should('be.visible')
    cy.get('[data-cy="detalle-estado"]').should('be.visible').and('not.be.empty')
    cy.get('[data-cy="detalle-close"]').should('be.visible')
  })

  it('Debe cerrar el detalle sin disparar ninguna petición de actualización (Escenario 3)', () => {
    // Arrange: abrir el detalle de la primera reserva, e interceptar
    // cualquier mutación para comprobar que no se dispara ninguna
    cy.intercept('POST', '/api/reservas/**').as('mutacionReserva')
    cy.get('[data-cy="reserva-item"]').first().click()
    cy.get('[data-cy="detalle-modal"]').should('be.visible')

    // Act: cerrar el modal con el botón "X"
    cy.get('[data-cy="detalle-close"]').click()

    // Assert: el modal desaparece y no se hizo ninguna petición de escritura
    cy.get('[data-cy="detalle-modal"]').should('not.exist')
    cy.get('@mutacionReserva.all').should('have.length', 0)
  })
})