import prisma from "./db";

export async function findReservasByAdmin(
  administradorId: number,
  fechaDesde: Date,
  fechaHasta: Date
) {
  return prisma.reserva.findMany({
    where: {
      administradorId,
      fechaHoraInicio: {
        gte: fechaDesde,
        lte: fechaHasta,
      },
    },
    include: {
      estadoReserva: true,
      tipoEvento: true,
    },
    orderBy: { fechaHoraInicio: "asc" },
  });
}

export async function findReservasByAdminYPagina(
  administradorId: number,
  fechaDesde: Date,
  fechaHasta: Date,
  pagina: number,
  porPagina: number
) {
  const skip = (pagina - 1) * porPagina;

  return prisma.reserva.findMany({
    where: {
      administradorId,
      fechaHoraInicio: {
        gte: fechaDesde,
        lte: fechaHasta,
      },
    },
    include: {
      estadoReserva: true,
      tipoEvento: true,
    },
    orderBy: { fechaHoraInicio: "asc" },
    skip,
    take: porPagina,
  });
}
