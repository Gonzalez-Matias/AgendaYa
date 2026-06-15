"use server";

import { consultarDisponibilidad as consultarDisponibilidadService } from "../services/disponibilidad";
import type { ConsultarDisponibilidadInput } from "../types/disponibilidad";

/**
 * Queries availability based on the provided input parameters.
 *
 * @param input - The availability query parameters
 * @returns The availability information matching the query
 */
export async function consultarDisponibilidad(
  input: ConsultarDisponibilidadInput
) {
  return consultarDisponibilidadService(input);
}
