import { AgendaPage } from '../pages/AgendaPage'
import { DetalleReservaPage } from '../pages/DetalleReservaPage'
import { ConfirmDialogPage } from '../pages/ConfirmDialogPage'

describe('AgendaYA - Gestión de Reservas (M05)', () => {
  const agendaPage = new AgendaPage()
  const detallePage = new DetalleReservaPage()
  const dialogPage = new ConfirmDialogPage()

  beforeEach(() => {
    agendaPage.visit()
  })

  describe('Cancelar una reserva (Flujo obligatorio)', () => {
    it('debería abrir diálogo de cancelación y volver sin cancelar', () => {
      // Arrange: seleccionar una reserva pendiente
      agendaPage.shouldHaveReservaPendiente()
      agendaPage.clickReservaPendiente()
      detallePage.waitForModal()

      // Act: abrir diálogo de cancelación y volver sin cancelar
      detallePage.clickCancelar()
      dialogPage.waitForDialog()
      dialogPage.cancelar()

      // Assert: el diálogo se cierra y la reserva sigue pendiente
      dialogPage.shouldNotShowDialog()
      detallePage.waitForModal()
      detallePage.shouldShowEstado('Pendiente de confirmación')
    })

    it('debería cancelar una reserva pendiente y cambiar su estado a Cancelada', () => {
      // Arrange: seleccionar una reserva pendiente
      agendaPage.shouldHaveReservaPendiente()
      agendaPage.getPendienteId().then((id) => {
        agendaPage.clickReservaPendiente()
        detallePage.waitForModal()

        // Act: cancelar la reserva desde el detalle
        detallePage.clickCancelar()
        dialogPage.waitForDialog()
        dialogPage.typeMotivo('No puedo asistir a la reunión')
        dialogPage.confirmar()

        // Assert: el modal se cierra y al re-abrir, el estado es Cancelada
        detallePage.waitForModalClosed()
        agendaPage.clickReservaById(Number(id))
        detallePage.waitForModal()
        detallePage.shouldShowEstado('Cancelada')
        detallePage.isCancelarDisabled()
      })
    })
  })

  describe('Confirmar una reserva (Flujo obligatorio)', () => {
    it('debería confirmar una reserva pendiente y cambiar su estado a Confirmada', () => {
      // Arrange: seleccionar una reserva pendiente
      agendaPage.shouldHaveReservaPendiente()
      agendaPage.getPendienteId().then((id) => {
        agendaPage.clickReservaPendiente()
        detallePage.waitForModal()

        // Act: confirmar la reserva
        detallePage.clickConfirmar()
        dialogPage.waitForDialog()
        dialogPage.confirmar()

        // Assert: el modal se cierra y al re-abrir, el estado es Confirmada
        detallePage.waitForModalClosed()
        agendaPage.clickReservaById(Number(id))
        detallePage.waitForModal()
        detallePage.shouldShowEstado('Confirmada')
        detallePage.isConfirmarHidden()
        detallePage.isCancelarEnabled()
        detallePage.isCompletarEnabled()
      })
    })
  })
})
