import { NextRequest, NextResponse } from "next/server";
import { obtenerReservasPorRango } from "@/services/visualizacion";
import { findReservasByAdminYPagina } from "@/repositories/visualizacion";
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

    if (modoVista === "lista") {
      const porPaginaNum = Math.max(1, Number(porPagina) || 10);
      const paginaNum = Math.max(1, Number(pagina) || 1);
      const skip = (paginaNum - 1) * porPaginaNum;

      const [reservas, total] = await Promise.all([
        findReservasByAdminYPagina(administradorId, inicio, fin, paginaNum, porPaginaNum),
        prisma.reserva.count({
          where: { administradorId, fechaHoraInicio: { gte: inicio, lte: fin } },
        }),
      ]);

      return NextResponse.json({
        reservas: reservas.map((r) => ({
          id: r.id,
          fecha: `${String(r.fechaHoraInicio.getUTCDate()).padStart(2, "0")}/${String(r.fechaHoraInicio.getUTCMonth() + 1).padStart(2, "0")}/${r.fechaHoraInicio.getUTCFullYear()}`,
          horario: `${String(r.fechaHoraInicio.getUTCHours()).padStart(2, "0")}:${String(r.fechaHoraInicio.getUTCMinutes()).padStart(2, "0")} - ${String(new Date(r.fechaHoraInicio.getTime() + r.duracion * 60000).getUTCHours()).padStart(2, "0")}:${String(new Date(r.fechaHoraInicio.getTime() + r.duracion * 60000).getUTCMinutes()).padStart(2, "0")}`,
          nombreInvitado: r.nombreInvitado,
          emailInvitado: r.emailInvitado,
          tipoEvento: r.tipoEvento.nombre,
          estado: r.estadoReserva.nombre === "PendienteDeConfirmacion" || r.estadoReserva.nombre === "PendienteDeReagendar" ? "Pendiente" : r.estadoReserva.nombre,
          colorFondo: "",
        })),
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
