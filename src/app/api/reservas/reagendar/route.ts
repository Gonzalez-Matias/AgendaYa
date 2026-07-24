import { NextRequest, NextResponse } from "next/server";
import { reagendarReserva, ReagendarError } from "@/services/reagendarReserva";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { reservaId, nuevaFechaHoraInicio, motivo, adminId } = body;

    if (!reservaId || !nuevaFechaHoraInicio) {
      return NextResponse.json({ error: "reservaId y nuevaFechaHoraInicio son requeridos" }, { status: 400 });
    }

    const resultado = await reagendarReserva({
      reservaId: Number(reservaId),
      nuevaFechaHoraInicio: new Date(nuevaFechaHoraInicio),
      motivo,
      adminId: adminId ? Number(adminId) : undefined,
    });

    return NextResponse.json({ success: true, data: resultado });
  } catch (error) {
    if (error instanceof ReagendarError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
