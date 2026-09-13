import { z } from "zod";
import {
  findReservaById,
  confirmarReservaEnTransaccion,
} from "../repositories/confirmarReserva";
import { findEstadoByNombre } from "../repositories/reserva";

const ConfirmarReservaInputSchema = z.object({
  reservaId: z.number().int().positive(),
  adminId: z.number().int().positive().optional(),
});

type ConfirmarReservaInput = z.infer<typeof ConfirmarReservaInputSchema>;

export async function confirmarReserva(input: ConfirmarReservaInput) {
  const { reservaId, adminId } = ConfirmarReservaInputSchema.parse(input);

  const reserva = await findReservaById(reservaId);
  if (!reserva) {
    throw new Error("Reserva no encontrada");
  }

  if (adminId && reserva.administradorId !== adminId) {
    throw new Error("No autorizado: la reserva no pertenece a este administrador");
  }

  const estadoActual = reserva.estadoReserva.nombre;

  if (estadoActual === "Confirmada") {
    throw new Error("La reserva ya está confirmada");
  }

  if (estadoActual === "Cancelada") {
    throw new Error("No se puede confirmar una reserva cancelada");
  }

  if (estadoActual === "Completada") {
    throw new Error("No se puede confirmar una reserva completada");
  }

  if (estadoActual !== "PendienteDeConfirmacion") {
    throw new Error(`No se puede confirmar una reserva en estado "${estadoActual}"`);
  }

  const estadoConfirmada = await findEstadoByNombre("Confirmada");

  if (!estadoConfirmada) {
    throw new Error("Estado Confirmada no encontrado en la base de datos");
  }

  return confirmarReservaEnTransaccion(reservaId, estadoConfirmada.id);
}

/**
 * Retorna el mensaje de éxito estándar para confirmación de reserva.
 */
export function obtenerMensajeExito(): string {
  return "Reserva confirmada correctamente";
}
