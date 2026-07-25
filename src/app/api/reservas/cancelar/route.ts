import { NextRequest, NextResponse } from "next/server";
import { cancelarReserva } from "@/services/cancelarReserva";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { reservaId, motivo, adminId } = body;

    if (!reservaId) {
      return NextResponse.json({ error: "reservaId es requerido" }, { status: 400 });
    }

    await cancelarReserva({ reservaId: Number(reservaId), motivo, adminId: Number(adminId) > 0 ? Number(adminId) : undefined });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
