// src/services/completarReserva.ts
import { z } from "zod";

const obtenerReservaPorIdMock = async (id: number) => {
  if (id === 101) return { id: 101, nombreInvitado: "Carlos", estadoReserva: { id: 1, nombre: "Confirmada" } };
  if (id === 102) return { id: 102, nombreInvitado: "Ana", estadoReserva: { id: 3, nombre: "Cancelada" } };
  return null;
};

const CompletarReservaInputSchema = z.object({
  reservaId: z.number().int().positive(),
});

type CompletarReservaInput = z.infer<typeof CompletarReservaInputSchema>;

/**
 * Modifica el estado de una reserva a "Completada" (US_11 - Opción Completar).
 * Valida que la reserva exista y que su estado actual sea estrictamente "Confirmada".
 */
export async function completarReserva(input: CompletarReservaInput) {
  const { reservaId } = CompletarReservaInputSchema.parse(input);

  const reserva = await obtenerReservaPorIdMock(reservaId);
  if (!reserva) {
    throw new Error("Reserva no encontrada");
  }

  if (reserva.estadoReserva.nombre !== "Confirmada") {
    throw new Error("Solo se pueden marcar como completadas las reservas en estado Confirmada");
  }

  return {
    id: reserva.id,
    nombreInvitado: reserva.nombreInvitado,
    estadoReserva: {
      id: 2,
      nombre: "Completada"
    }
  };
}