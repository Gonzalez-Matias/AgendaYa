import { NextRequest, NextResponse } from "next/server";
import { consultarDisponibilidad } from "@/services/disponibilidad";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { tipoEventoId, fechaDesde, fechaHasta } = body;

    if (!tipoEventoId || !fechaDesde || !fechaHasta) {
      return NextResponse.json({ error: "tipoEventoId, fechaDesde y fechaHasta son requeridos" }, { status: 400 });
    }

    const resultado = await consultarDisponibilidad({
      tipoEventoId: Number(tipoEventoId),
      fechaDesde: new Date(fechaDesde),
      fechaHasta: new Date(fechaHasta),
    });

    return NextResponse.json({ data: resultado });
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
