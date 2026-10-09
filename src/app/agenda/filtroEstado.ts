export const COOKIE_FILTRO_ESTADO = "agenda_filtro_estado";

const MAX_AGE_SEGUNDOS = 31536000;

export const ESTADOS_FILTRO = [
  { value: "", label: "Todos" },
  { value: "Confirmada", label: "Confirmada" },
  { value: "PendienteDeConfirmacion", label: "Pendiente de confirmación" },
  { value: "PendienteDeReagendar", label: "Pendiente de reagendar" },
  { value: "Cancelada", label: "Cancelada" },
  { value: "Completada", label: "Completada" },
] as const;

const ESTADOS_VALIDOS = new Set<string>(
  ESTADOS_FILTRO.map((opcion) => opcion.value).filter((value) => value !== "")
);

/**
 * Extrae el estado recordado del header de cookies, descartando valores
 * desconocidos (por ejemplo cookies obsoletas).
 */
export function parsearFiltroEstadoGuardado(cookieHeader: string): string {
  const prefijo = `${COOKIE_FILTRO_ESTADO}=`;
  const par = cookieHeader
    .split(";")
    .map((cookie) => cookie.trim())
    .find((cookie) => cookie.startsWith(prefijo));

  if (!par) return "";

  const valor = decodeURIComponent(par.slice(prefijo.length));
  return ESTADOS_VALIDOS.has(valor) ? valor : "";
}

/**
 * Arma el par cookie=valor para persistir el filtro. "Todos" (string vacío)
 * la expira, para que el servidor deje de recordar el último estado.
 */
export function serializarCookieFiltroEstado(estado: string): string {
  if (estado && ESTADOS_VALIDOS.has(estado)) {
    return `${COOKIE_FILTRO_ESTADO}=${encodeURIComponent(estado)}; path=/; max-age=${MAX_AGE_SEGUNDOS}`;
  }

  return `${COOKIE_FILTRO_ESTADO}=; path=/; max-age=0`;
}

export function leerFiltroEstadoGuardado(): string {
  if (typeof document === "undefined") return "";
  return parsearFiltroEstadoGuardado(document.cookie);
}

export function guardarFiltroEstado(estado: string): void {
  if (typeof document === "undefined") return;
  document.cookie = serializarCookieFiltroEstado(estado);
}
