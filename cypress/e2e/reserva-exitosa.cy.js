describe('M04 - Booking Público - Flujo de Reserva', () => {
  beforeEach(() => {
    // ATENCIÓN: Cambiá el puerto 3000 o 5500 según dónde esté corriendo tu frontend local
    cy.visit('http://localhost:3000') 
  })

  it('Debe completar el formulario y confirmar la reserva', () => {
    // Arrange: Preparar los datos del formulario
    cy.get('[data-cy="nombre-input"]').type('Andrés Mortensen')
    cy.get('[data-cy="email-input"]').type('andres@ejemplo.com')
    
    // Act: Ejecutar la acción principal
    cy.get('[data-cy="submit-reserva"]').click()
    
    // Assert: Verificar el resultado esperado
    cy.get('[data-cy="mensaje-confirmacion"]').should('be.visible')
    cy.get('[data-cy="mensaje-confirmacion"]').should('contain', 'Confirmada')
  })
})