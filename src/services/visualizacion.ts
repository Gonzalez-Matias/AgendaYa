import { z } from "zod";
import { findReservasByAdmin } from "../repositories/visualizacion";

export type ModoVista = "calendario" | "lista";

export interface ReservaVista {
  id: number;
  fecha: string;
  horario: string;
  nombreInvitado: string;
  emailInvitado: string;
  tipoEvento: string;
  estado: "Confirmada" | "PendienteDeConfirmacion" | "PendienteDeReagendar" | "Cancelada" | "Completada";
  colorFondo: string;
}

const ObtenerReservasInputSchema = z.object({
  administradorId: z.number().int().positive(),
  fechaDesde: z.date(),
  fechaHasta: z.date(),
});

type ObtenerReservasInput = z.infer<typeof ObtenerReservasInputSchema>;

/**
 * Retorna el modo de vista por defecto al ingresar a la sección.
 * Según M05-RF06, la vista por defecto es "calendario".
 */
export function getModoVistaDefault(): ModoVista {
  return "calendario";
}

/**
 * Cambia el modo de vista actual al modo seleccionado por el administrador.
 * No recarga datos, solo cambia la representación.
 */
export function cambiarModoVista(
  vistaActual: ModoVista,
  nuevaVista: ModoVista
): ModoVista {
  return nuevaVista;
}

/**
 * Formatea una fecha como DD/MM/YYYY.
 */
export function formatearFecha(fecha: Date): string {
  const dia = String(fecha.getDate()).padStart(2, "0");
  const mes = String(fecha.getMonth() + 1).padStart(2, "0");
  const anio = fecha.getFullYear();
  return `${dia}/${mes}/${anio}`;
}

/**
 * Obtiene el rango lunes a domingo de la semana que contiene la fecha dada.
 * El rango siempre inicia en lunes según M05-RF03.
 */
export function obtenerRangoSemanal(fecha: Date): { desde: Date; hasta: Date } {
  const copia = new Date(fecha);
  const diaSemana = copia.getDay();

  const desde = new Date(copia);
  const diasHastaLunes = diaSemana === 0 ? 6 : diaSemana - 1;
  desde.setDate(copia.getDate() - diasHastaLunes);
  desde.setHours(0, 0, 0, 0);

  const hasta = new Date(desde);
  hasta.setDate(desde.getDate() + 6);
  hasta.setHours(23, 59, 59, 999);

  return { desde, hasta };
}

export function obtenerRangoMensual(fecha: Date): { desde: Date; hasta: Date } {
  const desde = new Date(fecha.getFullYear(), fecha.getMonth(), 1);
  desde.setHours(0, 0, 0, 0);
  const hasta = new Date(fecha.getFullYear(), fecha.getMonth() + 1, 0, 23, 59, 59, 999);

  return { desde, hasta };
}

/**
 * Pagina un array de reservas.
 */
export function paginarReservas<T>(reservas: T[], pagina: number, porPagina: number): T[] {
  const inicio = (pagina - 1) * porPagina;
  return reservas.slice(inicio, inicio + porPagina);
}

/**
 * Mapea el nombre del estado de la DB a un formato legible para la vista.
 */
function mapearEstado(nombreEstado: string): ReservaVista["estado"] {
  switch (nombreEstado) {
    case "Confirmada":
      return "Confirmada";
    case "PendienteDeConfirmacion":
      return "PendienteDeConfirmacion";
    case "PendienteDeReagendar":
      return "PendienteDeReagendar";
    case "Cancelada":
      return "Cancelada";
    case "Completada":
      return "Completada";
    default:
      return "PendienteDeConfirmacion";
  }
}

/**
 * Obtiene el color de fondo según el estado de la reserva.
 * M05-RF06: Confirmada=verde, Pendiente=amarillo, Cancelada=rojo
 */
function obtenerColorEstado(estado: string): string {
  switch (estado) {
    case "Confirmada":
      return "#4CAF50";
    case "PendienteDeConfirmacion":
      return "#FFC107";
    case "PendienteDeReagendar":
      return "#F97316";
    case "Cancelada":
      return "#F44336";
    case "Completada":
      return "#2196F3";
    default:
      return "#9E9E9E";
  }
}

/**
 * Obtiene las reservas de un administrador en un rango de fechas,
 * formateadas para su visualización en lista o calendario.
 */
export async function obtenerReservasPorRango(
  administradorId: number,
  fechaDesde: Date,
  fechaHasta: Date
): Promise<ReservaVista[]> {
  const datos = ObtenerReservasInputSchema.parse({ administradorId, fechaDesde, fechaHasta });

  const reservas = await findReservasByAdmin(
    datos.administradorId,
    datos.fechaDesde,
    datos.fechaHasta
  );

  return reservas.map((reserva) => {
    const estado = mapearEstado(reserva.estadoReserva.nombre);
    const fechaInicio = new Date(reserva.fechaHoraInicio);
    const fechaFin = new Date(fechaInicio.getTime() + reserva.duracion * 60000);

    return {
      id: reserva.id,
      fecha: formatearFecha(fechaInicio),
      horario: `${String(fechaInicio.getHours()).padStart(2, "0")}:${String(fechaInicio.getMinutes()).padStart(2, "0")} - ${String(fechaFin.getHours()).padStart(2, "0")}:${String(fechaFin.getMinutes()).padStart(2, "0")}`,
      nombreInvitado: reserva.nombreInvitado,
      emailInvitado: reserva.emailInvitado,
      tipoEvento: reserva.tipoEvento.nombre,
      estado,
      colorFondo: obtenerColorEstado(estado),
    };
  });
}
