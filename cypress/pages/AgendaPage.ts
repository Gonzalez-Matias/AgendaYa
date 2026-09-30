export class AgendaPage {
  readonly reservaItem = '[data-cy="reserva-item"]'
  readonly noReservas = '[data-cy="no-reservas"]'
  readonly loading = '[data-cy="loading"]'
  readonly toggleLista = '[data-cy="toggle-lista"]'
  readonly toggleCalendario = '[data-cy="toggle-calendario"]'
  readonly toggleSemana = '[data-cy="toggle-semana"]'
  readonly toggleMes = '[data-cy="toggle-mes"]'

  private readonly pendienteSelector = `${this.reservaItem}[data-cy-estado="PendienteDeConfirmacion"]`

  visit() {
    cy.visit('/agenda')
    cy.get(this.loading, { timeout: 10000 }).should('not.exist')
    return this
  }

  getReservaById(id: number) {
    return cy.get(`${this.reservaItem}[data-reserva-id="${id}"]`)
  }

  clickReserva(index: number) {
    cy.get(this.reservaItem).eq(index).click()
    return this
  }

  clickReservaById(id: number) {
    this.getReservaById(id).click()
    return this
  }

  clickReservaPendiente() {
    cy.get(this.pendienteSelector).first().click()
    return this
  }

  getPendienteId() {
    return cy.get(this.pendienteSelector).first().invoke('attr', 'data-reserva-id')
  }

  shouldHaveReservaPendiente() {
    cy.get(this.pendienteSelector).should('have.length.greaterThan', 0)
    return this
  }

  shouldHaveReservas() {
    cy.get(this.reservaItem).should('have.length.greaterThan', 0)
    return this
  }

  switchToLista() {
    cy.get(this.toggleLista).click()
    return this
  }

  switchToCalendario() {
    cy.get(this.toggleCalendario).click()
    return this
  }

  switchToSemanal() {
    cy.get(this.toggleSemana).click()
    return this
  }

  switchToMensual() {
    cy.get(this.toggleMes).click()
    return this
  }
}
