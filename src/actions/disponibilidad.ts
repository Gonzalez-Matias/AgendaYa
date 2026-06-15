"use server";

import { consultarDisponibilidad as consultarDisponibilidadService } from "../services/disponibilidad";
import type { ConsultarDisponibilidadInput } from "../types/disponibilidad";

function validarFormato(
  input: ConsultarDisponibilidadInput
): ConsultarDisponibilidadInput {
  if (typeof input.tipoEventoId !== "number" || !Number.isInteger(input.tipoEventoId) || input.tipoEventoId <= 0) {
    throw new Error("tipoEventoId debe ser un entero positivo");
  }
  if (!(input.fechaDesde instanceof Date) || isNaN(input.fechaDesde.getTime())) {
    throw new Error("fechaDesde debe ser una fecha válida");
  }
  if (!(input.fechaHasta instanceof Date) || isNaN(input.fechaHasta.getTime())) {
    throw new Error("fechaHasta debe ser una fecha válida");
  }
  return input;
}

export async function consultarDisponibilidad(
  input: ConsultarDisponibilidadInput
) {
  const datosValidados = validarFormato(input);
  return consultarDisponibilidadService(datosValidados);
}
