import prisma from "./db";

export async function obtenerReservaPorId(reservaId: number) {
  return prisma.reserva.findUnique({
    where: { id: reservaId },
    include: { estadoReserva: true },
  });
}

export async function obtenerEstadoPorNombre(nombre: string) {
  return prisma.estadoReserva.findUnique({ where: { nombre } });
}

export async function cancelarReservaAtomica(reservaId: number, estadoCanceladaId: number): Promise<number> {
  const resultado = await prisma.reserva.updateMany({
    where: {
      id: reservaId,
      NOT: { estadoReservaId: estadoCanceladaId },
    },
    data: { estadoReservaId: estadoCanceladaId },
  });
  return resultado.count;
}