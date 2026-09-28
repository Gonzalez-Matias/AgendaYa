export class ReagendarModalPage {
  readonly modal = '[data-cy="reagendar-modal"]'
  readonly loading = '[data-cy="reagendar-loading"]'
  readonly dias = '[data-cy="reagendar-dia"]'
  readonly slots = '[data-cy="reagendar-slot"]'
  readonly sinTurnos = '[data-cy="reagendar-sin-turnos"]'
  readonly btnConfirmar = '[data-cy="reagendar-confirmar"]'
  readonly confirmacion = '[data-cy="reagendar-confirmacion"]'
  readonly btnConfirmarFinal = '[data-cy="reagendar-confirmar-final"]'
  readonly btnCerrar = '[data-cy="reagendar-close"]'
  readonly error = '[data-cy="reagendar-error"]'
  readonly exito = '[data-cy="reagendar-exito"]'
  readonly mesAnterior = '[data-cy="reagendar-mes-anterior"]'
  readonly mesSiguiente = '[data-cy="reagendar-mes-siguiente"]'

  waitForModal() {
    cy.get(this.modal, { timeout: 10000 }).should('be.visible')
    cy.get(this.dias, { timeout: 10000 }).should('have.length.greaterThan', 0)
    return this
  }

  shouldBeClosed() {
    cy.get(this.modal, { timeout: 10000 }).should('not.exist')
    return this
  }

  /**
   * Selector de un día concreto: el mini-calendario expone la fecha en
   * formato DD/MM/AAAA dentro del atributo data-dia.
   */
  dia(fecha: string) {
    return `${this.dias}[data-dia="${fecha}"]`
  }

  /**
   * Navega al mes siguiente y espera a que se recargue la disponibilidad.
   * La espera explícita evita leer el calendario anterior mientras el
   * modal vuelve a consultar el endpoint de disponibilidad.
   */
  nextMonth() {
    cy.get(this.mesSiguiente).click()
    cy.wait(500)
    cy.get(this.dias, { timeout: 10000 }).should('have.length.greaterThan', 0)
    return this
  }

  prevMonth() {
    cy.get(this.mesAnterior).click()
    cy.wait(500)
    cy.get(this.dias, { timeout: 10000 }).should('have.length.greaterThan', 0)
    return this
  }

  /** Click en el día indicado. Debe estar visible en el mes actual. */
  selectDay(fecha: string) {
    cy.get(this.dia(fecha), { timeout: 10000 }).should('have.length.greaterThan', 0)
    cy.get(this.dia(fecha)).click()
    return this
  }

  selectFirstSlot() {
    cy.get(this.slots, { timeout: 10000 }).should('have.length.greaterThan', 0)
    cy.get(this.slots).first().invoke('text').as('turnoSeleccionado')
    cy.get(this.slots).first().click()
    return this
  }

  clickConfirmar() {
    cy.get(this.btnConfirmar).should('not.be.disabled').click()
    return this
  }

  shouldShowConfirmacion() {
    cy.get(this.confirmacion, { timeout: 10000 }).should('be.visible')
    return this
  }

  /**
   * CP-US010-001, paso 3: el diálogo de doble verificación debe reflejar
   * el turno que el administrador acaba de seleccionar.
   */
  shouldShowConfirmacionConTurno() {
    cy.get(this.confirmacion, { timeout: 10000 }).should('be.visible')
    cy.get('@turnoSeleccionado').then((turno) => {
      cy.get(this.confirmacion).should('contain', String(turno).trim())
    })
    return this
  }

  confirmarCambio() {
    cy.get(this.confirmacion, { timeout: 10000 }).should('be.visible')
    cy.get(this.btnConfirmarFinal).should('not.be.disabled').click()
    return this
  }

  shouldShowExito(mensaje?: string) {
    cy.get(this.exito, { timeout: 10000 }).should('be.visible')
    if (mensaje) {
      cy.get(this.exito).should('contain', mensaje)
    }
    return this
  }

  shouldShowError(mensaje?: string) {
    cy.get(this.error, { timeout: 10000 }).should('be.visible')
    if (mensaje) {
      cy.get(this.error).should('contain', mensaje)
    }
    return this
  }
}
