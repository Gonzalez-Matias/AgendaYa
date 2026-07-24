import { NextRequest, NextResponse } from "next/server";
import { obtenerDetalleReserva } from "@/services/detalleReserva";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const reservaId = Number(id);

    if (!id || isNaN(reservaId)) {
      return NextResponse.json({ error: "ID de reserva inválido" }, { status: 400 });
    }

    const adminId = request.nextUrl.searchParams.get("adminId");
    const resultado = await obtenerDetalleReserva(reservaId, adminId ? Number(adminId) : undefined);

    return NextResponse.json({ data: resultado });
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
