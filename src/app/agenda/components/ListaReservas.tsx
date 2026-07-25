"use client";

import type { ReservaVista } from "@/services/visualizacion";
import styles from "./ListaReservas.module.css";

interface ListaReservasProps {
  reservas: ReservaVista[];
  fechaActual: Date;
  subVista: "semanal" | "mensual";
  onReservaClick?: (id: number) => void;
}

const DIAS_CORTOS = ["dom", "lun", "mar", "mié", "jue", "vie", "sáb"];
const MESES_CORTOS = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];

const PALETTE = [
  { bg: "#003EC7", text: "#FFFFFF" },
  { bg: "#9C27B0", text: "#FFFFFF" },
  { bg: "#4CAF50", text: "#FFFFFF" },
  { bg: "#E4E4E7", text: "#191C1E" },
  { bg: "#F59E0B", text: "#FFFFFF" },
  { bg: "#EF4444", text: "#FFFFFF" },
  { bg: "#3B82F6", text: "#FFFFFF" },
  { bg: "#10B981", text: "#FFFFFF" },
];

function buildTipoColorMap(reservas: ReservaVista[]): Map<string, { bg: string; text: string }> {
  const map = new Map<string, { bg: string; text: string }>();
  const tipos = [...new Set(reservas.map((r) => r.tipoEvento))];
  tipos.forEach((t, i) => map.set(t, PALETTE[i % PALETTE.length]));
  return map;
}

const STATUS_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  Confirmada: { bg: "#DCFCE7", text: "#166534", label: "Confirmada" },
  PendienteDeConfirmacion: { bg: "#FEF9C3", text: "#854D0E", label: "Pendiente de confirmación" },
  PendienteDeReagendar: { bg: "#FED7AA", text: "#9A3412", label: "Pendiente de reagendar" },
  Cancelada: { bg: "#FEE2E2", text: "#991B1B", label: "Cancelada" },
  Completada: { bg: "#F3F4F6", text: "#4B5563", label: "Completada" },
};

function parseDateKey(fecha: string): string {
  const [dd, mm] = fecha.split("/");
  return `${mm}/${dd}`;
}

function esMismaFecha(a: Date, b: Date): boolean {
  return a.getDate() === b.getDate() && a.getMonth() === b.getMonth() && a.getFullYear() === b.getFullYear();
}

function esHoy(fecha: Date): boolean {
  return esMismaFecha(fecha, new Date());
}

function esManana(fecha: Date): boolean {
  const manana = new Date();
  manana.setDate(manana.getDate() + 1);
  return esMismaFecha(fecha, manana);
}

function formatDayHeader(fecha: Date): { label: string; dateStr: string; isToday: boolean } {
  if (esHoy(fecha)) {
    return { label: "Hoy", dateStr: `${fecha.getDate()} ${MESES_CORTOS[fecha.getMonth()]}, ${DIAS_CORTOS[fecha.getDay()]}`, isToday: true };
  }
  if (esManana(fecha)) {
    return { label: "Mañana", dateStr: `${fecha.getDate()} ${MESES_CORTOS[fecha.getMonth()]}, ${DIAS_CORTOS[fecha.getDay()]}`, isToday: false };
  }
  return { label: `${fecha.getDate()} ${MESES_CORTOS[fecha.getMonth()]}`, dateStr: DIAS_CORTOS[fecha.getDay()], isToday: false };
}

function esPasada(reserva: ReservaVista): boolean {
  const [dd, mm, yyyy] = reserva.fecha.split("/");
  const [startStr] = reserva.horario.split(" - ");
  const [h, m] = startStr.split(":").map(Number);
  const fechaReserva = new Date(parseInt(yyyy), parseInt(mm) - 1, parseInt(dd), h, m);
  return fechaReserva < new Date();
}

function getWeekDays(fechaActual: Date): Date[] {
  const d = new Date(fechaActual);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const start = new Date(d);
  start.setDate(diff);
  return Array.from({ length: 7 }, (_, i) => {
    const dd = new Date(start);
    dd.setDate(dd.getDate() + i);
    return dd;
  });
}

export function ListaReservas({ reservas, fechaActual, subVista, onReservaClick }: ListaReservasProps) {
  const tipoColorMap = buildTipoColorMap(reservas);

  if (reservas.length === 0) {
    return (
      <div className={styles.listaContainer}>
        <div className={styles.noEvents}>No hay reservas para este período</div>
      </div>
    );
  }

  const datesToFechas = subVista === "semanal"
    ? getWeekDays(fechaActual)
    : (() => {
        const y = fechaActual.getFullYear();
        const m = fechaActual.getMonth();
        const diasMes = new Date(y, m + 1, 0).getDate();
        return Array.from({ length: diasMes }, (_, i) => new Date(y, m, i + 1));
      })();

  const dateKeyToFechas = new Map<string, Date>();
  datesToFechas.forEach((f) => {
    const key = parseDateKey(`${String(f.getDate()).padStart(2, "0")}/${String(f.getMonth() + 1).padStart(2, "0")}`);
    dateKeyToFechas.set(key, f);
  });

  const agrupadas = new Map<string, ReservaVista[]>();
  reservas.forEach((r) => {
    const key = parseDateKey(r.fecha);
    if (!agrupadas.has(key)) agrupadas.set(key, []);
    agrupadas.get(key)!.push(r);
  });

  const diasConReservas = [...agrupadas.entries()]
    .filter(([key]) => dateKeyToFechas.has(key))
    .sort((a, b) => {
      const [mA, dA] = a[0].split("/").map(Number);
      const [mB, dB] = b[0].split("/").map(Number);
      return mA !== mB ? mA - mB : dA - dB;
    });

  return (
    <div className={styles.listaContainer}>
      <div className={styles.listaScroll}>
        {diasConReservas.map(([dateKey, dayReservas]) => {
          const fecha = dateKeyToFechas.get(dateKey)!;
          const header = formatDayHeader(fecha);

          return (
            <div key={dateKey} className={styles.dayGroup}>
              <div className={styles.dayHeader}>
                <span className={`${styles.dayLabel} ${header.isToday ? styles.dayLabelToday : ""}`}>
                  {header.label}
                </span>
                <span className={styles.dayDate}>• {header.dateStr}</span>
              </div>
              <div className={styles.eventCards}>
                {dayReservas
                  .sort((a, b) => {
                    const [aH, aM] = a.horario.split(" - ")[0].split(":").map(Number);
                    const [bH, bM] = b.horario.split(" - ")[0].split(":").map(Number);
                    return aH * 60 + aM - (bH * 60 + bM);
                  })
                  .map((r) => {
                    const [startStr, endStr] = r.horario.split(" - ");
                    const tc = tipoColorMap.get(r.tipoEvento) || PALETTE[4];
                    const sc = STATUS_STYLES[r.estado] || STATUS_STYLES.Completada;
                    const past = esPasada(r);

                    return (
                      <div key={r.id} className={`${styles.eventCard} ${past ? styles.eventCardPast : ""}`} onClick={() => onReservaClick?.(r.id)} role="button" tabIndex={0}>
                        <div className={styles.timeColumn}>
                          <span className={styles.startTime}>{startStr}</span>
                          <span className={styles.endTime}>{endStr}</span>
                        </div>
                        <div className={styles.detailsColumn}>
                          <span className={styles.eventTitle}>{r.tipoEvento} - {r.nombreInvitado}</span>
                          <div className={styles.badgesRow}>
                            <span className={styles.typeBadge} style={{ background: tc.bg, color: tc.text }}>
                              {r.tipoEvento}
                            </span>
                            <span className={styles.statusBadge} style={{ background: sc.bg, color: sc.text }}>
                              {sc.label}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
