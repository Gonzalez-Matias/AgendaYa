// TODO(M04 / US_005-US_007): test deshabilitado temporalmente.
//
// La UI pública de booking todavía no está implementada:
//  - No existe ninguna página con los data-cy `nombre-input`, `email-input`,
//    `submit-reserva` ni `mensaje-confirmacion` en `src`.
//  - Tampoco existe un endpoint para crear reservas (no hay `POST /api/reservas`;
//    solo detalle/cancelar/completar/confirmar/reagendar).
//
// Cuando se implemente el flujo (formulario + endpoint de creación), quitar el
// `.skip` y ajustar la URL/selectores a la ruta real de la página de reserva.
describe.skip('M04 - Booking Público - Flujo de Reserva', () => {
  beforeEach(() => {
    cy.visit('/')
  })

  it.skip('Debe completar el formulario y confirmar la reserva', () => {
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
