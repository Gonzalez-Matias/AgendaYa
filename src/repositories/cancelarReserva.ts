import prisma from "./db";
import type { Prisma } from "../generated/prisma/client";

export async function obtenerReservaPorId(reservaId: number) {
  return prisma.reserva.findUnique({
    where: { id: reservaId },
    include: { estadoReserva: true },
  });
}

export async function obtenerEstadoPorNombre(nombre: string) {
  return prisma.estadoReserva.findUnique({ where: { nombre } });
}

export async function cancelarReservaAtomica(
  reservaId: number,
  estadoCanceladaId: number,
  motivo?: string
): Promise<boolean> {
  return prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const result = await tx.reserva.updateMany({
      where: {
        id: reservaId,
        NOT: { estadoReservaId: estadoCanceladaId },
      },
      data: { estadoReservaId: estadoCanceladaId },
    });

    if (result.count > 0) {
      await tx.reservaEstadoHistorial.create({
        data: {
          reservaId,
          estadoReservaId: estadoCanceladaId,
          motivo: motivo || "Reserva cancelada",
        },
      });
    }

    return result.count > 0;
  });
}