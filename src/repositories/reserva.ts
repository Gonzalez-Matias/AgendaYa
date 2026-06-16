import prisma from "./db";
import type { Prisma } from "../generated/prisma/client";

export async function findReservaById(id: number) {
  return prisma.reserva.findUnique({
    where: { id },
    select: {
      id: true,
      fechaHoraInicio: true,
      duracion: true,
      administradorId: true,
      tipoEvento: { select: { id: true, nombre: true, duracion: true } },
    },
  });
}

export async function findReservasActivasEnRango(
  adminId: number,
  excludeReservaId: number,
  desde: Date,
  hasta: Date
) {
  return prisma.reserva.findMany({
    where: {
      administradorId: adminId,
      id: { not: excludeReservaId },
      estadoReserva: {
        nombre: { in: ["Confirmada", "PendienteDeConfirmacion", "PendienteDeReagendar"] },
      },
      fechaHoraInicio: { gte: desde, lte: hasta },
    },
    select: { fechaHoraInicio: true, duracion: true },
  });
}

export async function findEstadoByNombre(nombre: string) {
  return prisma.estadoReserva.findUnique({
    where: { nombre },
    select: { id: true, nombre: true },
  });
}

export async function updateReservaEnTransaccion(
  reservaId: number,
  updateData: {
    fechaHoraInicio: Date;
    estadoReservaId: number;
  },
  historialData: {
    estadoReservaId: number;
    motivo: string;
  }
) {
  return prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const reservaActualizada = await tx.reserva.update({
      where: { id: reservaId },
      data: {
        fechaHoraInicio: updateData.fechaHoraInicio,
        estadoReservaId: updateData.estadoReservaId,
      },
      select: {
        id: true,
        fechaHoraInicio: true,
        duracion: true,
        nombreInvitado: true,
        emailInvitado: true,
        tipoEvento: { select: { id: true, nombre: true } },
        estadoReserva: { select: { id: true, nombre: true } },
        administrador: { select: { id: true, nombre: true, email: true } },
      },
    });

    await tx.reservaEstadoHistorial.create({
      data: {
        reservaId,
        estadoReservaId: historialData.estadoReservaId,
        motivo: historialData.motivo,
      },
    });

    return reservaActualizada;
  });
}
