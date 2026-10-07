import prisma from "./db";
import type { Prisma } from "../generated/prisma/client";
import type { FiltrosVista } from "../types/reserva";

/** Arma las condiciones de filtrado opcionales de la vista de agenda. */
function filtrosWhere(filtros?: FiltrosVista): Prisma.ReservaWhereInput {
  const where: Prisma.ReservaWhereInput = {};
  if (filtros?.estado) where.estadoReserva = { nombre: filtros.estado };
  if (filtros?.tipoEventoId) where.tipoEventoId = filtros.tipoEventoId;
  return where;
}

export async function findReservasByAdmin(
  administradorId: number,
  fechaDesde: Date,
  fechaHasta: Date,
  filtros?: FiltrosVista
) {
  return prisma.reserva.findMany({
    where: {
      administradorId,
      fechaHoraInicio: {
        gte: fechaDesde,
        lte: fechaHasta,
      },
      ...filtrosWhere(filtros),
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
  porPagina: number,
  filtros?: FiltrosVista
) {
  const skip = (pagina - 1) * porPagina;

  return prisma.reserva.findMany({
    where: {
      administradorId,
      fechaHoraInicio: {
        gte: fechaDesde,
        lte: fechaHasta,
      },
      ...filtrosWhere(filtros),
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

/** Cuenta las reservas de un administrador en el rango, respetando los filtros de la vista. */
export async function contarReservasByAdmin(
  administradorId: number,
  fechaDesde: Date,
  fechaHasta: Date,
  filtros?: FiltrosVista
) {
  return prisma.reserva.count({
    where: {
      administradorId,
      fechaHoraInicio: { gte: fechaDesde, lte: fechaHasta },
      ...filtrosWhere(filtros),
    },
  });
}
