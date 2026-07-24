"use client";

import type { ReservaVista } from "@/services/visualizacion";
import styles from "./CalendarioSemanal.module.css";

interface CalendarioSemanalProps {
  reservas: ReservaVista[];
  fechaActual: Date;
}

const DIAS_CORTOS = ["LUN", "MAR", "MIÉ", "JUE", "VIE", "SÁB", "DOM"];

const EVENT_COLORS = [
  { bg: "#DBEAFE", border: "#2563EB", time: "#1E40AF", name: "#1E3A8A" },
  { bg: "#FAF5FF", border: "#9333EA", time: "#6B21A8", name: "#581C87" },
  { bg: "#F0FDF4", border: "#16A34A", time: "#166534", name: "#14532D" },
  { bg: "#F2F4F6", border: "#6B7280", time: "#374151", name: "#1F2937" },
];

const HOUR_START = 8;
const HOUR_END = 24;
const HOUR_HEIGHT = 64;

function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function parseTime(timeStr: string): number {
  const [h, m] = timeStr.split(":").map(Number);
  return h + m / 60;
}

function formatHour(h: number): string {
  if (h < 12) return `${h} AM`;
  if (h === 12) return "12 PM";
  return `${h - 12} PM`;
}

function esHoy(fecha: Date): boolean {
  const hoy = new Date();
  return (
    fecha.getDate() === hoy.getDate() &&
    fecha.getMonth() === hoy.getMonth() &&
    fecha.getFullYear() === hoy.getFullYear()
  );
}

export function CalendarioSemanal({ reservas, fechaActual }: CalendarioSemanalProps) {
  const weekStart = getWeekStart(fechaActual);

  const tipoColorMap = new Map<string, number>();
  const tipos = [...new Set(reservas.map((r) => r.tipoEvento))];
  tipos.forEach((t, i) => tipoColorMap.set(t, i % EVENT_COLORS.length));

  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    return d;
  });

  const hours = Array.from({ length: HOUR_END - HOUR_START }, (_, i) => HOUR_START + i);

  function reservasDelDia(fecha: Date): ReservaVista[] {
    const key = `${String(fecha.getDate()).padStart(2, "0")}/${String(fecha.getMonth() + 1).padStart(2, "0")}`;
    return reservas.filter((r) => {
      const [dd, mm] = r.fecha.split("/");
      return `${dd}/${mm}` === key;
    });
  }

  return (
    <div className={styles.weekCalendar}>
      <div className={styles.header}>
        <div className={styles.timeCorner} />
        {days.map((d, i) => {
          const isToday = esHoy(d);
          const isWeekend = i >= 5;
          return (
            <div key={i} className={`${styles.dayHeader} ${isWeekend ? styles.dayHeaderWeekend : ""}`}>
              <span className={`${styles.dayName} ${isToday ? styles.dayNameToday : ""}`}>
                {DIAS_CORTOS[i]}
              </span>
              <span className={`${styles.dayNumber} ${isToday ? styles.dayNumberToday : ""}`}>
                {d.getDate()}
              </span>
            </div>
          );
        })}
      </div>

      <div className={styles.body}>
        <div className={styles.timeColumn}>
          {hours.map((h) => (
            <div key={h} className={styles.timeSlot}>
              <span className={styles.timeLabel}>{formatHour(h)}</span>
            </div>
          ))}
        </div>

        {days.map((d, dayIdx) => {
          const isToday = esHoy(d);
          const isWeekend = dayIdx >= 5;
          const dayReservas = reservasDelDia(d);

          return (
            <div
              key={dayIdx}
              className={`${styles.dayColumn} ${isToday ? styles.dayColumnToday : ""} ${isWeekend ? styles.dayColumnWeekend : ""}`}
            >
              {hours.map((h) => (
                <div
                  key={h}
                  className={`${styles.timeRow} ${(h - HOUR_START) % 2 === 0 ? styles.timeRowEven : styles.timeRowOdd}`}
                />
              ))}

              {dayReservas.map((r) => {
                const tipoIdx = tipoColorMap.get(r.tipoEvento) ?? 3;
                const colors = EVENT_COLORS[tipoIdx];
                const [startStr, endStr] = r.horario.split(" - ");
                const startH = parseTime(startStr);
                const endH = parseTime(endStr);
                const top = (startH - HOUR_START) * HOUR_HEIGHT;
                const height = Math.max((endH - startH) * HOUR_HEIGHT, 32);

                return (
                  <div
                    key={r.id}
                    className={styles.eventCard}
                    style={{
                      top: `${top}px`,
                      height: `${height}px`,
                      background: colors.bg,
                      borderLeft: `4px solid ${colors.border}`,
                    }}
                  >
                    <span className={styles.eventTime} style={{ color: colors.time }}>
                      {r.horario}
                    </span>
                    <span className={styles.eventName} style={{ color: colors.name }}>
                      {r.tipoEvento} - {r.nombreInvitado}
                    </span>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}
