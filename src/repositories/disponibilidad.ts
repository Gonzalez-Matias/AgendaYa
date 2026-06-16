import prisma from "./db";

/**
 * Retrieves event type information by its ID.
 *
 * @returns An object containing `administradorId`, `duracion`, and `antelacionMinima`, or `null` if not found.
 */
export async function findTipoEvento(id: number) {
  return prisma.tipoEvento.findUnique({
    where: { id },
    select: { administradorId: true, duracion: true, antelacionMinima: true },
  });
}

/**
 * Retrieves the weekly availability entries for an administrator.
 *
 * @returns An array of weekly availability records, each containing the day of week, start time, and end time.
 */
export async function findDisponibilidadAdmin(adminId: number) {
  return prisma.disponibilidadSemanal.findMany({
    where: { administradorId: adminId },
    select: { diaSemana: true, horaInicio: true, horaFin: true },
  });
}

/**
 * Retrieves non-cancelled reservations for an administrator within a date range.
 *
 * @param adminId - The administrator's ID
 * @param inicio - The start of the date range (inclusive)
 * @param fin - The end of the date range (exclusive)
 * @returns An array of reservations with their start time and duration
 */
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

/**
 * Fetches agenda blocks that overlap with a specified time range for an administrator.
 *
 * @param adminId - The administrator identifier
 * @param inicio - The start of the time range
 * @param fin - The end of the time range
 * @returns An array of agenda blocks overlapping the specified range
 */
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
