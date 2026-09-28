import { z } from "zod";
import {
  findTipoEventoConConfirmacion,
  findEstadoByNombre,
  findReservasActivasEnRango,
  createReservaConHistorial,
} from "../repositories/reserva";
import { consultarDisponibilidad } from "./disponibilidad";
import { validarEmail, validarNombre } from "./formulario-reserva";

const CrearReservaSchema = z.object({
  tipoEventoId: z.number().int().positive(),
  fechaHoraInicio: z.date(),
  nombreInvitado: z.string(),
  emailInvitado: z.string(),
  telefonoInvitado: z.string().nullish(),
  notaInvitado: z.string().nullish(),
});

export interface CrearReservaInput {
  tipoEventoId: number;
  fechaHoraInicio: Date;
  nombreInvitado: string;
  emailInvitado: string;
  telefonoInvitado?: string | null;
  notaInvitado?: string | null;
}

export class CrearReservaError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CrearReservaError";
  }
}

const MENSAJE_CONFIRMADA =
  "¡Tu reserva fue confirmada! Revisá tu email para más detalles.";
const MENSAJE_PENDIENTE =
  "¡Tu solicitud fue enviada! El profesional confirmará tu turno a la brevedad.";
const MENSAJE_SLOT_OCUPADO =
  "Este horario ya fue reservado. Por favor elegí otro.";

/**
 * Registra una reserva para un usuario invitado (M04-RF04 / M04-RF05).
 * El estado inicial depende de la configuración del tipo de evento:
 * AUTOMATICA -> Confirmada, MANUAL -> PendienteDeConfirmacion.
 */
export async function crearReserva(input: CrearReservaInput) {
  const datos = CrearReservaSchema.parse(input);

  if (!validarNombre(datos.nombreInvitado)) {
    throw new CrearReservaError(
      "El nombre completo es obligatorio (máximo 100 caracteres)"
    );
  }
  if (!validarEmail(datos.emailInvitado)) {
    throw new CrearReservaError(
      "Ingresá un email válido. Ej: nombre@dominio.com"
    );
  }
  if (datos.notaInvitado && datos.notaInvitado.length > 300) {
    throw new CrearReservaError("La nota no puede superar los 300 caracteres");
  }

  const tipoEvento = await findTipoEventoConConfirmacion(datos.tipoEventoId);
  if (!tipoEvento || !tipoEvento.activo) {
    throw new CrearReservaError("Tipo de evento no encontrado");
  }

  // Verifica la disponibilidad real del slot: franja, bloqueos, reservas y antelación.
  const dias = await consultarDisponibilidad({
    tipoEventoId: tipoEvento.id,
    fechaDesde: datos.fechaHoraInicio,
    fechaHasta: datos.fechaHoraInicio,
  });
  const solicitado = datos.fechaHoraInicio.getTime();
  const estaDisponible = dias[0]?.slots.some(
    (slot) => slot.inicio.getTime() === solicitado
  );
  if (!estaDisponible) {
    throw new CrearReservaError(MENSAJE_SLOT_OCUPADO);
  }

  // Re-check de solapamiento para acotar la ventana de carrera antes de insertar.
  const fechaFin = new Date(
    datos.fechaHoraInicio.getTime() + tipoEvento.duracion * 60000
  );
  const ventanaInicio = new Date(datos.fechaHoraInicio.getTime() - 24 * 60 * 60000);
  const ventanaFin = new Date(fechaFin.getTime() + 24 * 60 * 60000);
  const reservasActivas = await findReservasActivasEnRango(
    tipoEvento.administradorId,
    -1,
    ventanaInicio,
    ventanaFin
  );
  const superpone = reservasActivas.some((r) => {
    const rFin = new Date(r.fechaHoraInicio.getTime() + r.duracion * 60000);
    return r.fechaHoraInicio < fechaFin && datos.fechaHoraInicio < rFin;
  });
  if (superpone) {
    throw new CrearReservaError(MENSAJE_SLOT_OCUPADO);
  }

  const estadoNombre =
    tipoEvento.confirmacion === "AUTOMATICA"
      ? "Confirmada"
      : "PendienteDeConfirmacion";
  const estado = await findEstadoByNombre(estadoNombre);
  if (!estado) {
    throw new CrearReservaError(
      `El estado '${estadoNombre}' no está configurado en el sistema`
    );
  }

  const reserva = await createReservaConHistorial(
    {
      fechaHoraInicio: datos.fechaHoraInicio,
      duracion: tipoEvento.duracion,
      nombreInvitado: datos.nombreInvitado.trim(),
      emailInvitado: datos.emailInvitado.trim(),
      telefonoInvitado: datos.telefonoInvitado ?? null,
      notaInvitado: datos.notaInvitado ?? null,
      tipoEventoId: tipoEvento.id,
      administradorId: tipoEvento.administradorId,
    },
    estado.id,
    estadoNombre === "Confirmada"
      ? "Confirmación automática"
      : "Reserva creada (pendiente de confirmación)"
  );

  return {
    reserva,
    estado: estado.nombre,
    mensaje:
      estadoNombre === "Confirmada" ? MENSAJE_CONFIRMADA : MENSAJE_PENDIENTE,
  };
}
