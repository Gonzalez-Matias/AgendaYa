import { z } from "zod";
import {
  findTipoEvento,
  findDisponibilidadAdmin,
  findReservasEnRango,
  findBloqueosEnRango,
} from "../repositories/disponibilidad";
import type {
  ConsultarDisponibilidadInput,
  DiaDisponible,
  SlotDisponible,
} from "../types/disponibilidad";

const INTERVALO = 15;
const MAX_DIAS = 30;

const Schema = z.object({
  tipoEventoId: z.number().int().positive(),
  fechaDesde: z.date(),
  fechaHasta: z.date(),
});

function haySuperposicion(
  slotInicio: Date,
  slotFin: Date,
  objInicio: Date,
  objFin: Date
): boolean {
  return slotInicio < objFin && slotFin > objInicio;
}

function minutosAFecha(dia: Date, minutos: number): Date {
  const resultado = new Date(dia);
  resultado.setUTCHours(Math.floor(minutos / 60), minutos % 60, 0, 0);
  return resultado;
}

export async function consultarDisponibilidad(
  input: ConsultarDisponibilidadInput
): Promise<DiaDisponible[]> {
  const datos = Schema.parse(input);

  if (datos.fechaDesde > datos.fechaHasta) {
    throw new Error("fechaDesde no puede ser posterior a fechaHasta");
  }

  const diffMs = datos.fechaHasta.getTime() - datos.fechaDesde.getTime();
  const diffDias = diffMs / (1000 * 60 * 60 * 24);
  if (diffDias > MAX_DIAS) {
    throw new Error(`El período no puede superar ${MAX_DIAS} días`);
  }

  const tipoEvento = await findTipoEvento(datos.tipoEventoId);
  if (!tipoEvento) throw new Error("Tipo de evento no encontrado");

  const { administradorId, antelacionMinima } = tipoEvento;

  const disponibilidades = await findDisponibilidadAdmin(administradorId);

  const primerDia = new Date(datos.fechaDesde);
  primerDia.setUTCHours(0, 0, 0, 0);
  const ultimoDia = new Date(datos.fechaHasta);
  ultimoDia.setUTCHours(0, 0, 0, 0);
  ultimoDia.setUTCDate(ultimoDia.getUTCDate() + 1);

  const reservas = await findReservasEnRango(
    administradorId,
    primerDia,
    ultimoDia
  );
  const bloqueos = await findBloqueosEnRango(
    administradorId,
    primerDia,
    ultimoDia
  );

  const dispMap = new Map<number, typeof disponibilidades>();
  for (const d of disponibilidades) {
    const existing = dispMap.get(d.diaSemana);
    if (existing) {
      existing.push(d);
    } else {
      dispMap.set(d.diaSemana, [d]);
    }
  }

  const ahora = new Date();
  const fechaMinima = new Date(ahora);
  fechaMinima.setUTCHours(fechaMinima.getUTCHours() + antelacionMinima);

  const resultado: DiaDisponible[] = [];
  const diaActual = new Date(datos.fechaDesde);

  while (diaActual <= datos.fechaHasta) {
    const diaSemana = diaActual.getUTCDay();
    const disps = dispMap.get(diaSemana);

    if (!disps || disps.length === 0) {
      resultado.push({ fecha: new Date(diaActual), slots: [] });
      diaActual.setUTCDate(diaActual.getUTCDate() + 1);
      continue;
    }

    const diaInicio = new Date(diaActual);
    diaInicio.setUTCHours(0, 0, 0, 0);
    const diaFin = new Date(diaActual);
    diaFin.setUTCHours(24, 0, 0, 0);

    const reservasDelDia = reservas.filter(
      (r) => r.fechaHoraInicio >= diaInicio && r.fechaHoraInicio < diaFin
    );
    const bloqueosDelDia = bloqueos.filter(
      (b) => b.fechaInicio < diaFin && b.fechaFin > diaInicio
    );

    const slots: SlotDisponible[] = [];
    const minutosVistos = new Set<number>();

    for (const disp of disps) {
      for (
        let min = disp.horaInicio;
        min + INTERVALO <= disp.horaFin;
        min += INTERVALO
      ) {
        if (minutosVistos.has(min)) continue;
        minutosVistos.add(min);

        const slotInicio = minutosAFecha(diaActual, min);
        const slotFin = minutosAFecha(diaActual, min + INTERVALO);

        if (slotInicio < fechaMinima) continue;

        const superponeConReserva = reservasDelDia.some((r) => {
          const rFin = new Date(r.fechaHoraInicio);
          rFin.setUTCMinutes(rFin.getUTCMinutes() + r.duracion);
          return haySuperposicion(slotInicio, slotFin, r.fechaHoraInicio, rFin);
        });
        if (superponeConReserva) continue;

        const superponeConBloqueo = bloqueosDelDia.some((b) =>
          haySuperposicion(slotInicio, slotFin, b.fechaInicio, b.fechaFin)
        );
        if (superponeConBloqueo) continue;

        slots.push({ inicio: slotInicio, fin: slotFin });
      }
    }

    resultado.push({ fecha: new Date(diaActual), slots });
    diaActual.setUTCDate(diaActual.getUTCDate() + 1);
  }

  return resultado;
}
