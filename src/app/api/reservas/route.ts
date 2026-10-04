import { NextRequest, NextResponse } from "next/server";
import { crearReserva, CrearReservaError } from "@/services/crearReserva";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      tipoEventoId,
      fechaHoraInicio,
      nombreInvitado,
      emailInvitado,
      telefonoInvitado,
      notaInvitado,
    } = body;

    if (!tipoEventoId || !fechaHoraInicio || !nombreInvitado || !emailInvitado) {
      return NextResponse.json(
        {
          error:
            "tipoEventoId, fechaHoraInicio, nombreInvitado y emailInvitado son requeridos",
        },
        { status: 400 }
      );
    }

    const inicio = new Date(fechaHoraInicio);
    if (isNaN(inicio.getTime())) {
      return NextResponse.json(
        { error: "fechaHoraInicio debe ser una fecha válida" },
        { status: 400 }
      );
    }

    const resultado = await crearReserva({
      tipoEventoId: Number(tipoEventoId),
      fechaHoraInicio: inicio,
      nombreInvitado: String(nombreInvitado),
      emailInvitado: String(emailInvitado),
      telefonoInvitado: telefonoInvitado ?? null,
      notaInvitado: notaInvitado ?? null,
    });

    return NextResponse.json({ success: true, data: resultado }, { status: 201 });
  } catch (error) {
    if (error instanceof CrearReservaError) {
      if (error.message.includes("no encontrado")) {
        return NextResponse.json({ error: error.message }, { status: 404 });
      }
      if (error.message.includes("ya fue reservado")) {
        return NextResponse.json({ error: error.message }, { status: 409 });
      }
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
