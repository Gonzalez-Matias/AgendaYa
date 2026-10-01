import { z } from "zod";
import {
  findReservaById,
  findReservasActivasEnRango,
  findEstadoByNombre,
  updateReservaEnTransaccion,
} from "../repositories/reserva";

const ReagendarReservaSchema = z.object({
  reservaId: z.number().int().positive(),
  nuevaFechaHoraInicio: z.date(),
  motivo: z.string().optional(),
});

export class ReagendarError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ReagendarError";
  }
}

export async function reagendarReserva(input: {
  reservaId: number;
  nuevaFechaHoraInicio: Date;
  motivo?: string;
}) {
  const datos = ReagendarReservaSchema.parse(input);

  const reserva = await findReservaById(datos.reservaId);
  if (!reserva) {
    throw new ReagendarError("La reserva no existe");
  }

  const nuevaFechaFin = new Date(
    datos.nuevaFechaHoraInicio.getTime() + reserva.duracion * 60000
  );

  const ventanaInicio = new Date(
    datos.nuevaFechaHoraInicio.getTime() - 24 * 60 * 60000
  );
  const ventanaFin = new Date(
    datos.nuevaFechaHoraInicio.getTime() + 24 * 60 * 60000
  );

  const reservasActivas = await findReservasActivasEnRango(
    reserva.administradorId,
    datos.reservaId,
    ventanaInicio,
    ventanaFin
  );

  for (const r of reservasActivas) {
    const rFin = new Date(r.fechaHoraInicio.getTime() + r.duracion * 60000);
    if (r.fechaHoraInicio < nuevaFechaFin && datos.nuevaFechaHoraInicio < rFin) {
      throw new ReagendarError("El nuevo horario elegido ya está ocupado");
    }
  }

  const estadoConfirmada = await findEstadoByNombre("Confirmada");
  if (!estadoConfirmada) {
    throw new ReagendarError("El estado 'Confirmada' no está configurado en el sistema");
  }

  const reservaActualizada = await updateReservaEnTransaccion(
    datos.reservaId,
    {
      fechaHoraInicio: datos.nuevaFechaHoraInicio,
      estadoReservaId: estadoConfirmada.id,
    },
    {
      estadoReservaId: estadoConfirmada.id,
      motivo: datos.motivo ?? "Reagendada por administrador",
    }
  );

  return {
    reserva: reservaActualizada,
    mensaje: "¡La reserva se re-agendó con éxito!",
  };
}
