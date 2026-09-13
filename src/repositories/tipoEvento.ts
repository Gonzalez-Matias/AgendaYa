import prisma from "./db";

export async function findTiposEventoByAdmin(administradorId: number) {
  return prisma.tipoEvento.findMany({
    where: {
      administradorId,
      activo: true,
    },
    orderBy: { nombre: "asc" },
  });
}
