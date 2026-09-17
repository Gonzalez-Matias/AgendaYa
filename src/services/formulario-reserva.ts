// src/services/formulario-reserva.ts
// Lógica de validación de formulario y confirmación de reserva
// M04-RF04 y M04-RF05

export type EstadoReserva = "Confirmada" | "Pendiente";

export interface DatosInvitado {
  nombreCompleto: string;
  email: string;
  telefono?: string;
  nota?: string;
}

export interface TipoEvento {
  id: string;
  nombre: string;
  confirmacionAutomatica: boolean;
}

/**
 * Valida el formato de un email.
 * M04-RF04: El campo email es obligatorio y debe tener formato válido.
 */
export function validarEmail(email: string): boolean {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

/**
 * Valida el nombre completo del invitado.
 * M04-RF04: No debe estar vacío ni contener solo espacios. Máx 100 caracteres.
 */
export function validarNombre(nombre: string): boolean {
  return nombre.trim().length > 0 && nombre.length <= 100;
}

/**
 * Determina el estado de la reserva según el tipo de evento.
 * M04-RF05: Si es automático → "Confirmada". Si es manual → "Pendiente".
 */
export function determinarEstadoReserva(
  tipoEvento: TipoEvento
): EstadoReserva {
  return tipoEvento.confirmacionAutomatica ? "Confirmada" : "Pendiente";
}