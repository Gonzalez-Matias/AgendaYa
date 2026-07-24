import { NextRequest, NextResponse } from "next/server";
import { confirmarReserva } from "@/services/confirmacion";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { reservaId, adminId } = body;

    if (!reservaId) {
      return NextResponse.json({ error: "reservaId es requerido" }, { status: 400 });
    }

    const resultado = await confirmarReserva({ reservaId: Number(reservaId), adminId: adminId ? Number(adminId) : undefined });

    return NextResponse.json({ success: true, data: resultado });
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
