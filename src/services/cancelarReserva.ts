import { z } from "zod";
import {
  obtenerReservaPorId,
  obtenerEstadoPorNombre,
  cancelarReservaAtomica,
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
  const { reservaId } = CancelarReservaInputSchema.parse(input);

  const reserva = await obtenerReservaPorId(reservaId);
  if (!reserva) {
    throw new Error("Reserva no encontrada");
  }

  const estadoCancelada = await obtenerEstadoPorNombre("Cancelada");
  if (!estadoCancelada) {
    throw new Error("Estado Cancelada no encontrado en la base de datos");
  }

  const count = await cancelarReservaAtomica(reservaId, estadoCancelada.id);

  if (count === 0) {
    throw new Error("La reserva ya está cancelada");
  }
}