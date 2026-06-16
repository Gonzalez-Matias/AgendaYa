import {
  obtenerReservaPorId,
  obtenerEstadoPorNombre,
  actualizarEstadoReserva,
} from "../repositories/cancelarReserva";

interface CancelarReservaInput {
  reservaId: number;
  motivo?: string;
}

export async function cancelarReserva({ reservaId, motivo }: CancelarReservaInput) {
  // 1. Buscar la reserva
  const reserva = await obtenerReservaPorId(reservaId);

  if (!reserva) {
    throw new Error("Reserva no encontrada");
  }

  // 2. Verificar que no esté ya cancelada
  if (reserva.estadoReserva.nombre === "Cancelada") {
    throw new Error("La reserva ya está cancelada");
  }

  // 3. Obtener el estado "Cancelada"
  const estadoCancelada = await obtenerEstadoPorNombre("Cancelada");

  if (!estadoCancelada) {
    throw new Error("Estado Cancelada no encontrado en la base de datos");
  }

  // 4. Actualizar el estado
  await actualizarEstadoReserva(reservaId, estadoCancelada.id);
}