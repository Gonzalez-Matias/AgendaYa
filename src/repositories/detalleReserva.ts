import prisma from "./db";

/**
 * Busca una reserva por su id, incluyendo los datos relacionados
 * de tipo de evento y estado necesarios para mostrar el detalle.
 */
export async function findReservaPorId(reservaId: number) {
  return prisma.reserva.findUnique({
    where: { id: reservaId },
    include: {
      tipoEvento: true,
      estadoReserva: true,
    },
  });
}