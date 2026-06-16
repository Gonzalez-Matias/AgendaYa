import { PrismaClient } from "../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error("DATABASE_URL no está definida en las variables de entorno");
}

const adapter = new PrismaPg({ connectionString: databaseUrl });
const prisma = new PrismaClient({ adapter });

export async function obtenerReservaPorId(reservaId: number) {
  return prisma.reserva.findUnique({
    where: { id: reservaId },
    include: { estadoReserva: true },
  });
}

export async function obtenerEstadoPorNombre(nombre: string) {
  return prisma.estadoReserva.findUnique({ where: { nombre } });
}

export async function actualizarEstadoReserva(reservaId: number, estadoReservaId: number) {
  return prisma.reserva.update({
    where: { id: reservaId },
    data: { estadoReservaId },
  });
}

export default prisma;