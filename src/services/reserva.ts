import { z } from "zod";
import { findReservaPorId } from "../repositories/detalleReserva";
import { DetalleReserva } from "../types/reserva";

const reservaIdSchema = z.number().int().positive();

/**
 * Obtiene el detalle completo de una reserva (Épica: Detalle_De_Reserva, M05-RF05).
 *
 * Devuelve los datos del invitado, del evento, de la cita y la nota
 * dejada por el invitado al momento de reservar. El campo de notas
 * se devuelve tal cual fue guardado: este service no permite modificarlo,
 * ya que en la interfaz de booking solo el invitado puede escribirlo y
 * para el administrador es de solo lectura.
 *
 * @throws Error si el id no es un entero positivo válido.
 * @throws Error si no existe una reserva con el id indicado.
 */
export async function obtenerDetalleReserva(
  reservaId: number
): Promise<DetalleReserva> {
  const idValidado = reservaIdSchema.parse(reservaId);

  const reserva = await findReservaPorId(idValidado);

  if (!reserva) {
    throw new Error(`No existe una reserva con id ${idValidado}`);
  }

  const fechaHoraFin = new Date(
    reserva.fechaHoraInicio.getTime() + reserva.duracion * 60000
  );

  return {
    id: reserva.id,
    fechaHoraInicio: reserva.fechaHoraInicio,
    fechaHoraFin,
    duracion: reserva.duracion,

    nombreInvitado: reserva.nombreInvitado,
    emailInvitado: reserva.emailInvitado,
    telefonoInvitado: reserva.telefonoInvitado,
    notaInvitado: reserva.notaInvitado,

    tipoEvento: {
      id: reserva.tipoEvento.id,
      nombre: reserva.tipoEvento.nombre,
      duracion: reserva.tipoEvento.duracion,
    },

    estado: {
      id: reserva.estadoReserva.id,
      nombre: reserva.estadoReserva.nombre,
    },
  };
}