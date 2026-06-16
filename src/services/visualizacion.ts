// src/services/visualizacion.ts
// Servicio de lógica de visualización de agenda - M05-RF06

export type ModoVista = "calendario" | "lista";

export interface Reserva {
  id: string;
  fecha: string;
  horario: string;
  invitado: string;
  tipoEvento: string;
  estado: "Confirmada" | "Pendiente" | "Cancelada";
}

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
 * Retorna los datos de una reserva específica.
 * Los datos son idénticos sin importar la vista activa (consistencia entre vistas).
 */
export function obtenerDatosReservaEnVista(
  reservas: Reserva[],
  id: string,
  vista: ModoVista
): Reserva | undefined {
  return reservas.find((r) => r.id === id);
}