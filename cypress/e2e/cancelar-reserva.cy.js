describe('US_016 - Cancelar Reserva', () => { 
  
  beforeEach(() => { 
    
    // Arrange: Visitar la pantalla de la agenda 
    cy.visit('/agenda'); 
  }); 

  it('CP1: Debe permitir cancelar una reserva confirmada', () => { 
    
    // 1. Ir a la celda 31 y seleccionar su reserva
    cy.get(':nth-child(31)').find('[data-cy="reserva-item"]').first().click(); 
    
    // 2. Ahora que el detalle está abierto, presionar el botón cancelar 
    cy.get('[data-cy="btn-cancelar"]').should('be.visible').click(); 

    // 3. Confirmar la acción en el modal emergente 
    cy.get('[data-cy="confirm-aceptar"]').click(); 

    // 4. Assert: Verificar que el estado cambie a Cancelada 
    cy.contains('Cancelada').should('be.visible');
    
  }); 

});