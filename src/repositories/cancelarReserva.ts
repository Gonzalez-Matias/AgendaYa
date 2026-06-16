import { PrismaClient } from "../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error("DATABASE_URL no está definida en las variables de entorno");
}

const adapter = new PrismaPg({ connectionString: databaseUrl });
const prisma = new PrismaClient({ adapter });

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

/** Cancela una reserva de forma atómica, solo si no está ya cancelada. Retorna cuántos registros se actualizaron. */
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

export default prisma;