import { NextRequest, NextResponse } from "next/server";
import { obtenerDetalleReserva } from "@/services/detalleReserva";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const reservaId = Number(id);

    if (!id || isNaN(reservaId) || reservaId <= 0) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 });
    }

    const adminId = request.nextUrl.searchParams.get("adminId");
    const adminIdNum = Number(adminId);
    const resultado = await obtenerDetalleReserva(reservaId, adminIdNum > 0 ? adminIdNum : undefined);

    return NextResponse.json({ data: resultado });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes("no encontrada")) {
        return NextResponse.json({ error: error.message }, { status: 404 });
      }
      if (error.message.includes("No autorizado")) {
        return NextResponse.json({ error: error.message }, { status: 403 });
      }
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
