import { NextRequest, NextResponse } from "next/server";
import { findTiposEventoByAdmin } from "@/repositories/tipoEvento";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const adminId = Number(id);

    if (!id || isNaN(adminId)) {
      return NextResponse.json({ error: "ID de administrador inválido" }, { status: 400 });
    }

    const tiposEvento = await findTiposEventoByAdmin(adminId);

    return NextResponse.json({ tiposEvento });
  } catch (error) {
    console.error("Error al obtener tipos de evento:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
