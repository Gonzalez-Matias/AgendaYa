import { AgendaPage } from '../pages/AgendaPage'
import { DetalleReservaPage } from '../pages/DetalleReservaPage'
import { ReagendarModalPage } from '../pages/ReagendarModalPage'

/**
 * US_010 - Confirmar cambios (M05-RF01)
 *
 * CP-US010-001 (positivo): reagendar a un horario libre -> estado "Confirmada"
 *   y mensaje de éxito visible para el administrador.
 * CP-US010-002 (negativo): reagendar a un horario ya ocupado -> rechazo con
 *   mensaje explícito, sin modificar la reserva original.
 *
 * Notas de diseño:
 *  - La interfaz solo ofrece horarios libres, por lo que el solapamiento del
 *    CP-US010-002 no es alcanzable desde el modal: se valida a nivel API, que es
 *    donde el servicio re-verifica la disponibilidad al confirmar.
 *  - El día y el turno se calculan consultando la MISMA API que consume la UI
 *    (/api/disponibilidad), para no depender de fechas fijas ni del día de la semana.
 */

// El servicio de disponibilidad rechaza rangos mayores a 30 días.
const RANGO_MAX_DIAS = 29

function fechaKey(iso: string): string {
  const d = new Date(iso)
  const dia = String(d.getDate()).padStart(2, '0')
  const mes = String(d.getMonth() + 1).padStart(2, '0')
  return `${dia}/${mes}/${d.getFullYear()}`
}

/** Mismo criterio de rango que usa el modal de reagendar para el mes visible. */
function rangoDeMes(year: number, monthIndex: number) {
  const desde = new Date(year, monthIndex, 1, 0, 0, 0, 0)
  const finDeMes = new Date(year, monthIndex + 1, 0, 23, 59, 59, 999)
  const maxHasta = new Date(desde)
  maxHasta.setDate(desde.getDate() + RANGO_MAX_DIAS)
  maxHasta.setHours(23, 59, 59, 999)
  const hasta = finDeMes.getTime() < maxHasta.getTime() ? finDeMes : maxHasta
  return { desde, hasta }
}

describe('US_010 - Confirmar cambios (M05-RF01)', () => {
  const agendaPage = new AgendaPage()
  const detallePage = new DetalleReservaPage()
  const reagendarPage = new ReagendarModalPage()

  /**
   * La suite E2E muta datos (cancelar / confirmar / reagendar) y no restaura el
   * estado entre specs, por lo que un test que dependa de estados concretos puede
   * quedarse sin datos según el orden de ejecución. Sembrar antes de este spec
   * garantiza las precondiciones de ambos casos de prueba: una reserva en estado
   * PendienteDeConfirmacion y una reserva Confirmada en la misma agenda.
   */
  before(() => {
    cy.task('seedDatabase', null, { timeout: 150000 })
  })

  beforeEach(() => {
    agendaPage.visit()
  })

  /** /agenda carga el primer administrador (la API lo devuelve ordenado por nombre). */
  function primerAdministradorId(): Cypress.Chainable<number> {
    return cy.request('/api/administradores').then((res) => res.body.administradores[0].id as number)
  }

  function reservasDelAdmin(administradorId: number) {
    const desde = new Date()
    desde.setFullYear(desde.getFullYear() - 1)
    const hasta = new Date()
    hasta.setFullYear(hasta.getFullYear() + 1)

    return cy.request('POST', '/api/visualizacion', {
      administradorId,
      fechaDesde: desde.toISOString(),
      fechaHasta: hasta.toISOString(),
      modoVista: 'lista',
      pagina: 1,
      porPagina: 100,
    })
  }

  /** Avanza el calendario principal hasta que la reserva quede renderizada. */
  function asegurarReservaVisible(reservaId: number, intentos = 3): void {
    cy.get('body').then(($body) => {
      const item = `[data-cy="reserva-item"][data-reserva-id="${reservaId}"]`
      if ($body.find(item).length > 0) return
      if (intentos <= 0) {
        throw new Error(`La reserva ${reservaId} no se renderizó en la agenda`)
      }
      cy.get('[data-cy="toolbar-next"]').click()
      cy.get('[data-cy="loading"]').should('not.exist')
      asegurarReservaVisible(reservaId, intentos - 1)
    })
  }

  /**
   * Busca el primer día con turnos libres consultando la API de disponibilidad y,
   * si el mes visible no tiene turnos, avanza el mini-calendario mes a mes.
   */
  function buscarDiaConTurnos(
    tipoEventoId: number,
    year: number,
    monthIndex: number,
    mesesMaximos = 3
  ): Cypress.Chainable<string> {
    const intentar = (restantes: number, y: number, m: number): Cypress.Chainable<string> => {
      const { desde, hasta } = rangoDeMes(y, m)

      return cy
        .request('POST', '/api/disponibilidad', {
          tipoEventoId,
          fechaDesde: desde.toISOString(),
          fechaHasta: hasta.toISOString(),
        })
        .then((res) => {
          const dia = res.body.data.find((d: { slots: unknown[] }) => d.slots.length > 0)
          if (dia) {
            return cy.wrap(fechaKey(dia.fecha))
          }
          if (restantes <= 0) {
            throw new Error('No se encontró ningún día con turnos libres')
          }
          reagendarPage.nextMonth()
          const siguiente = new Date(y, m + 1, 1)
          return intentar(restantes - 1, siguiente.getFullYear(), siguiente.getMonth())
        })
    }

    return intentar(mesesMaximos, year, monthIndex)
  }

  it('CP-US010-001: debería confirmar el cambio hacia un horario libre y mostrar el mensaje de éxito', () => {
    primerAdministradorId().then((administradorId) => {
      // Arrange: debe existir una reserva en estado PendienteDeConfirmacion
      reservasDelAdmin(administradorId).then((res) => {
        const pendiente = res.body.reservas.find(
          (r: { id: number; estado: string }) => r.estado === 'PendienteDeConfirmacion'
        )
        if (!pendiente) {
          throw new Error('No hay ninguna reserva en estado PendienteDeConfirmacion')
        }
        const reservaId = pendiente.id as number

        cy.request(`/api/reservas/${reservaId}`).then((detalle) => {
          expect(detalle.status).to.eq(200)
          const tipoEventoId = detalle.body.data.tipoEvento.id as number
          const fechaReserva = new Date(detalle.body.data.fechaHoraInicio as string)

          // Act: abrir el detalle de la reserva y el modal de reagendar
          asegurarReservaVisible(reservaId)
          agendaPage.clickReservaById(reservaId)
          detallePage.waitForModal()
          detallePage.clickReagendar()
          reagendarPage.waitForModal()

          // Precondición del CP: debe existir un horario libre en el mes visible
          buscarDiaConTurnos(tipoEventoId, fechaReserva.getFullYear(), fechaReserva.getMonth()).then(
            (dia) => {
              cy.intercept('POST', '**/api/reservas/reagendar').as('reagendar')

              reagendarPage.selectDay(dia)
              reagendarPage.selectFirstSlot()
              reagendarPage.clickConfirmar()
              reagendarPage.shouldShowConfirmacion()
              reagendarPage.confirmarCambio()

              // Assert: respuesta exitosa, mensaje de éxito visible y modal cerrado
              cy.wait('@reagendar').then(({ response }) => {
                expect(response?.statusCode).to.eq(200)
                expect(response?.body.data.mensaje).to.eq('¡La reserva se re-agendó con éxito!')
                const nuevaFechaHora = response?.body.data.reserva.fechaHoraInicio

                reagendarPage.shouldShowExito('re-agendó con éxito')
                reagendarPage.shouldBeClosed()

                // Assert: la reserva queda Confirmada con la nueva fecha y hora
                cy.request(`/api/reservas/${reservaId}`).then((actualizada) => {
                  expect(actualizada.body.data.estado.nombre).to.eq('Confirmada')
                  expect(actualizada.body.data.fechaHoraInicio).to.eq(nuevaFechaHora)
                })
              })
            }
          )
        })
      })
    })
  })

  it('CP-US010-002: debería rechazar el cambio hacia un horario ocupado manteniendo la reserva original', () => {
    primerAdministradorId().then((administradorId) => {
      reservasDelAdmin(administradorId).then((res) => {
        const reservas = res.body.reservas as Array<{ id: number; estado: string }>
        const pendiente = reservas.find((r) => r.estado === 'PendienteDeConfirmacion')
        const ocupada = reservas.find((r) => r.estado === 'Confirmada')

        if (!pendiente || !ocupada) {
          throw new Error(
            'Se requiere una reserva PendienteDeConfirmacion y una Confirmada del mismo administrador'
          )
        }
        const reservaId = pendiente.id
        const reservaOcupadaId = ocupada.id

        cy.request(`/api/reservas/${reservaId}`).then((detallePendiente) => {
          const fechaOriginal = detallePendiente.body.data.fechaHoraInicio

          cy.request(`/api/reservas/${reservaOcupadaId}`).then((detalleOcupada) => {
            const inicioOcupado = detalleOcupada.body.data.fechaHoraInicio

            // Act: intentar mover la reserva pendiente al horario ya ocupado
            cy.request({
              method: 'POST',
              url: '/api/reservas/reagendar',
              body: { reservaId, nuevaFechaHoraInicio: inicioOcupado },
              failOnStatusCode: false,
            }).then((respuesta) => {
              // Assert: se rechaza con un mensaje de error explícito
              expect(respuesta.status).to.eq(400)
              expect(respuesta.body.error).to.eq('El nuevo horario elegido ya está ocupado')

              // Assert: conserva fecha/hora y estado originales (no libera el turno anterior)
              cy.request(`/api/reservas/${reservaId}`).then((detalleFinal) => {
                expect(detalleFinal.body.data.fechaHoraInicio).to.eq(fechaOriginal)
                expect(detalleFinal.body.data.estado.nombre).to.eq('PendienteDeConfirmacion')
              })
            })
          })
        })
      })
    })
  })
})
