import { z } from "zod";
import {
  findReservaById,
  findEstadoByNombre,
  completarReservaEnTransaccion,
} from "../repositories/completarReserva";

const CompletarReservaInputSchema = z.object({
  reservaId: z.number().int().positive(),
  adminId: z.number().int().positive().optional(),
});

type CompletarReservaInput = z.infer<typeof CompletarReservaInputSchema>;

export async function completarReserva(input: CompletarReservaInput) {
  const { reservaId, adminId } = CompletarReservaInputSchema.parse(input);

  const reserva = await findReservaById(reservaId);
  if (!reserva) {
    throw new Error("Reserva no encontrada");
  }

  if (adminId && reserva.administradorId !== adminId) {
    throw new Error("No autorizado: la reserva no pertenece a este administrador");
  }

  if (reserva.estadoReserva.nombre !== "Confirmada") {
    throw new Error("Solo se pueden marcar como completadas las reservas en estado Confirmada");
  }

  const estadoCompletada = await findEstadoByNombre("Completada");
  if (!estadoCompletada) {
    throw new Error("Estado Completada no encontrado en la base de datos");
  }

  return completarReservaEnTransaccion(reservaId, estadoCompletada.id);
}
