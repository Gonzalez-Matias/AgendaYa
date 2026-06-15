"use server";

import { consultarDisponibilidad as consultarDisponibilidadService } from "../services/disponibilidad";
import type { ConsultarDisponibilidadInput } from "../types/disponibilidad";

export async function consultarDisponibilidad(
  input: ConsultarDisponibilidadInput
) {
  return consultarDisponibilidadService(input);
}
