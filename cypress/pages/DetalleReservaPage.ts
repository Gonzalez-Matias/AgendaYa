export class DetalleReservaPage {
  readonly modal = '[data-cy="detalle-modal"]'
  readonly estado = '[data-cy="detalle-estado"]'
  readonly closeBtn = '[data-cy="detalle-close"]'
  readonly btnConfirmar = '[data-cy="btn-confirmar"]'
  readonly btnCancelar = '[data-cy="btn-cancelar"]'
  readonly btnCompletar = '[data-cy="btn-completar"]'
  readonly btnReagendar = '[data-cy="btn-reagendar"]'

  waitForModal() {
    cy.get(this.modal, { timeout: 10000 }).should('be.visible')
    return this
  }

  waitForModalClosed() {
    cy.get(this.modal).should('not.exist')
    return this
  }

  close() {
    cy.get(this.closeBtn).click()
    return this
  }

  clickConfirmar() {
    cy.get(this.btnConfirmar).click()
    return this
  }

  clickCancelar() {
    cy.get(this.btnCancelar).click()
    return this
  }

  clickCompletar() {
    cy.get(this.btnCompletar).click()
    return this
  }

  clickReagendar() {
    cy.get(this.btnReagendar).click()
    return this
  }

  shouldShowEstado(estado: string) {
    cy.get(this.estado).should('contain', estado)
    return this
  }

  isConfirmarHidden() {
    cy.get(this.btnConfirmar).should('not.exist')
    return this
  }

  isCompletarEnabled() {
    return cy.get(this.btnCompletar).should('not.be.disabled')
  }

  isCancelarEnabled() {
    return cy.get(this.btnCancelar).should('not.be.disabled')
  }

  isCancelarDisabled() {
    return cy.get(this.btnCancelar).should('be.disabled')
  }
}
