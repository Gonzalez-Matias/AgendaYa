import prisma from "./db";
import type { Prisma } from "../generated/prisma/client";

/** Busca una reserva por ID incluyendo su estado actual. */
export async function obtenerReservaPorId(reservaId: number) {
  return prisma.reserva.findUnique({
    where: { id: reservaId },
    include: { estadoReserva: true },
  });
}

/** Busca un estado de reserva por nombre. */
export async function obtenerEstadoPorNombre(nombre: string) {
  return prisma.estadoReserva.findUnique({ where: { nombre } });
}

/** Cancela una reserva de forma atómica, solo si no está ya cancelada, y registra el cambio en el historial. */
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
