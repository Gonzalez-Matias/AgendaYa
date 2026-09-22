export class ConfirmDialogPage {
  readonly dialog = '[data-cy="confirm-dialog"]'
  readonly aceptarBtn = '[data-cy="confirm-aceptar"]'
  readonly volverBtn = '[data-cy="confirm-volver"]'
  readonly motivoTextarea = '[data-cy="confirm-motivo"]'

  waitForDialog() {
    cy.get(this.dialog).should('be.visible')
    return this
  }

  confirmar() {
    this.waitForDialog()
    cy.get(this.aceptarBtn).click()
    return this
  }

  cancelar() {
    cy.get(this.volverBtn).click()
    return this
  }

  typeMotivo(motivo: string) {
    cy.get(this.motivoTextarea).type(motivo)
    return this
  }

  shouldNotShowDialog() {
    cy.get(this.dialog).should('not.exist')
    return this
  }
}
