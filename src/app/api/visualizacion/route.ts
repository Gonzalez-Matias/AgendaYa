import { NextRequest, NextResponse } from "next/server";
import { obtenerReservasPorRango } from "@/services/visualizacion";
import type { ReservaVista } from "@/services/visualizacion";
import { findReservasByAdminYPagina } from "@/repositories/visualizacion";
import prisma from "@/repositories/db";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { administradorId, fechaDesde, fechaHasta, modoVista, pagina, porPagina } = body;

    if (!administradorId) {
      return NextResponse.json({ error: "administradorId es requerido" }, { status: 400 });
    }

    if (!fechaDesde || !fechaHasta) {
      return NextResponse.json({ error: "fechaDesde y fechaHasta son requeridos" }, { status: 400 });
    }

    const inicio = new Date(fechaDesde);
    const fin = new Date(fechaHasta);

    if (isNaN(inicio.getTime()) || isNaN(fin.getTime())) {
      return NextResponse.json({ error: "fechaDesde y fechaHasta deben ser fechas válidas" }, { status: 400 });
    }

    if (modoVista === "lista") {
      const porPaginaNum = Math.max(1, Number(porPagina) || 10);
      const paginaNum = Math.max(1, Number(pagina) || 1);

      const [reservas, total] = await Promise.all([
        findReservasByAdminYPagina(administradorId, inicio, fin, paginaNum, porPaginaNum),
        prisma.reserva.count({
          where: { administradorId, fechaHoraInicio: { gte: inicio, lte: fin } },
        }),
      ]);

      return NextResponse.json({
        reservas: reservas.map((r) => {
          const fechaInicio = new Date(r.fechaHoraInicio);
          const fechaFin = new Date(fechaInicio.getTime() + r.duracion * 60000);
          return {
            id: r.id,
            fecha: `${String(fechaInicio.getDate()).padStart(2, "0")}/${String(fechaInicio.getMonth() + 1).padStart(2, "0")}/${fechaInicio.getFullYear()}`,
            horario: `${String(fechaInicio.getHours()).padStart(2, "0")}:${String(fechaInicio.getMinutes()).padStart(2, "0")} - ${String(fechaFin.getHours()).padStart(2, "0")}:${String(fechaFin.getMinutes()).padStart(2, "0")}`,
            nombreInvitado: r.nombreInvitado,
            emailInvitado: r.emailInvitado,
            tipoEvento: r.tipoEvento.nombre,
            estado: r.estadoReserva.nombre as ReservaVista["estado"],
            colorFondo: "",
          };
        }),
        total,
        totalPaginas: Math.ceil(total / porPaginaNum),
      });
    }

    const reservas = await obtenerReservasPorRango(administradorId, inicio, fin);
    return NextResponse.json({ reservas, total: reservas.length, totalPaginas: 1 });
  } catch (error) {
    console.error("Error al obtener reservas:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
