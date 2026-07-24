import { NextRequest, NextResponse } from "next/server";
import { obtenerReservasPorRango } from "@/services/visualizacion";
import prisma from "@/repositories/db";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { administradorId, fechaDesde, fechaHasta, modoVista, pagina, porPagina } = body;

    if (!administradorId) {
      return NextResponse.json({ error: "administradorId es requerido" }, { status: 400 });
    }

    const inicio = new Date(fechaDesde);
    const fin = new Date(fechaHasta);

    const todasLasReservas = await obtenerReservasPorRango(administradorId, inicio, fin);

    let reservasPaginadas = todasLasReservas;
    let totalPaginas = 1;

    if (modoVista === "lista") {
      const porPaginaNum = porPagina || 10;
      const paginaNum = pagina || 1;
      const inicioIdx = (paginaNum - 1) * porPaginaNum;
      reservasPaginadas = todasLasReservas.slice(inicioIdx, inicioIdx + porPaginaNum);
      totalPaginas = Math.ceil(todasLasReservas.length / porPaginaNum);
    }

    return NextResponse.json({
      reservas: reservasPaginadas,
      total: todasLasReservas.length,
      totalPaginas,
    });
  } catch (error) {
    console.error("Error al obtener reservas:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
