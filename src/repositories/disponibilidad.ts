import prisma from "./db";

export async function findTipoEvento(id: number) {
  return prisma.tipoEvento.findUnique({
    where: { id },
    select: { administradorId: true, duracion: true, antelacionMinima: true },
  });
}

export async function findDisponibilidadAdmin(adminId: number) {
  return prisma.disponibilidadSemanal.findMany({
    where: { administradorId: adminId },
    select: { diaSemana: true, horaInicio: true, horaFin: true },
  });
}

export async function findReservasEnRango(adminId: number, inicio: Date, fin: Date) {
  const estadoCancelada = await prisma.estadoReserva.findUnique({
    where: { nombre: "Cancelada" },
  });

  return prisma.reserva.findMany({
    where: {
      administradorId: adminId,
      NOT: { estadoReservaId: estadoCancelada?.id },
      fechaHoraInicio: { gte: inicio, lt: fin },
    },
    select: { fechaHoraInicio: true, duracion: true },
  });
}

export async function findBloqueosEnRango(adminId: number, inicio: Date, fin: Date) {
  return prisma.bloqueoAgenda.findMany({
    where: {
      administradorId: adminId,
      OR: [
        { fechaInicio: { gte: inicio, lt: fin } },
        { fechaFin: { gte: inicio, lt: fin } },
        { fechaInicio: { lte: inicio }, fechaFin: { gte: fin } },
      ],
    },
    select: { fechaInicio: true, fechaFin: true },
  });
}
