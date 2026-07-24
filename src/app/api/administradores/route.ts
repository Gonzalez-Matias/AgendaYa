import { NextResponse } from "next/server";
import prisma from "@/repositories/db";

export async function GET() {
  try {
    const administradores = await prisma.usuarioAdministrador.findMany({
      select: { id: true, nombre: true, email: true },
      orderBy: { nombre: "asc" },
    });

    return NextResponse.json({ administradores });
  } catch (error) {
    console.error("Error al obtener administradores:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
