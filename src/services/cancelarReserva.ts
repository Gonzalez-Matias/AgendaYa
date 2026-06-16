import { z } from "zod";
import {
  obtenerReservaPorId,
  obtenerEstadoPorNombre,
  actualizarEstadoReserva,
} from "../repositories/cancelarReserva";

const CancelarReservaInputSchema = z.object({
  reservaId: z.number().int().positive(),
  motivo: z.string().trim().min(1).optional(),
});

type CancelarReservaInput = z.infer<typeof CancelarReservaInputSchema>;

/**
 * Cancela una reserva existente cambiando su estado a "Cancelada".
 * Lanza un error si la reserva no existe o ya está cancelada.
 */
export async function cancelarReserva(input: CancelarReservaInput) {
  const { reservaId, motivo } = CancelarReservaInputSchema.parse(input);

  const reserva = await obtenerReservaPorId(reservaId);

  if (!reserva) {
    throw new Error("Reserva no encontrada");
  }

  if (reserva.estadoReserva.nombre === "Cancelada") {
    throw new Error("La reserva ya está cancelada");
  }

  const estadoCancelada = await obtenerEstadoPorNombre("Cancelada");

  if (!estadoCancelada) {
    throw new Error("Estado Cancelada no encontrado en la base de datos");
  }

  await actualizarEstadoReserva(reservaId, estadoCancelada.id);
}