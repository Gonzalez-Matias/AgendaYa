import { z } from "zod";
import {
  obtenerReservaPorId,
  obtenerEstadoPorNombre,
  cancelarReservaAtomica,
} from "../repositories/cancelarReserva";

const CancelarReservaInputSchema = z.object({
  reservaId: z.number().int().positive(),
  motivo: z.string().trim().min(1).optional(),
  adminId: z.number().int().positive().optional(),
});

type CancelarReservaInput = z.infer<typeof CancelarReservaInputSchema>;

export async function cancelarReserva(input: CancelarReservaInput) {
  const { reservaId, adminId } = CancelarReservaInputSchema.parse(input);

  const reserva = await obtenerReservaPorId(reservaId);
  if (!reserva) {
    throw new Error("Reserva no encontrada");
  }

  if (adminId && reserva.administradorId !== adminId) {
    throw new Error("No autorizado: la reserva no pertenece a este administrador");
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