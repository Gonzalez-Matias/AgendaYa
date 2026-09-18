import prisma from "./db";

export async function findReservaById(id: number) {
  return prisma.reserva.findUnique({
    where: { id },
    include: {
      estadoReserva: true,
      tipoEvento: true,
    },
  });
}

export async function confirmarReservaEnTransaccion(
  reservaId: number,
  nuevoEstadoId: number
) {
  return prisma.$transaction(async (tx) => {
    const reserva = await tx.reserva.update({
      where: { id: reservaId },
      data: { estadoReservaId: nuevoEstadoId },
      include: { estadoReserva: true },
    });

    await tx.reservaEstadoHistorial.create({
      data: {
        reservaId,
        estadoReservaId: nuevoEstadoId,
        motivo: "Reserva confirmada",
      },
    });

    return reserva;
  });
}
