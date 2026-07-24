"use client";

import type { ReservaVista } from "@/services/visualizacion";
import { StatusIcon } from "./StatusIcon";
import styles from "./CalendarioMensual.module.css";

interface CalendarioMensualProps {
  reservas: ReservaVista[];
  fechaActual: Date;
}

const DIAS = ["DOM", "LUN", "MAR", "MIÉ", "JUE", "VIE", "SÁB"];
const COLORES_TIPO = ["#003EC7", "#9C27B0", "#4CAF50", "#6B7280", "#F59E0B", "#EF4444", "#3B82F6", "#10B981"];

function obtenerColor(idx: number) {
  return COLORES_TIPO[idx % COLORES_TIPO.length];
}

function obtenerBg(idx: number) {
  const bgs = ["#D3E4FE", "#F3E8F5", "#E8F5E9", "#E0E3E5", "#FEF3C7", "#FEE2E2", "#DBEAFE", "#D1FAE5"];
  return bgs[idx % bgs.length];
}

interface TipoEventoColor {
  nombre: string;
  bg: string;
  border: string;
}

function buildTipoColorMap(reservas: ReservaVista[]): Map<string, TipoEventoColor> {
  const map = new Map<string, TipoEventoColor>();
  const tipos = [...new Set(reservas.map((r) => r.tipoEvento))];
  tipos.forEach((t, i) => {
    map.set(t, { nombre: t, bg: obtenerBg(i), border: obtenerColor(i) });
  });
  return map;
}

function formatearDiaMes(fecha: Date): string {
  return `${String(fecha.getDate()).padStart(2, "0")}/${String(fecha.getMonth() + 1).padStart(2, "0")}`;
}

export function CalendarioMensual({ reservas, fechaActual }: CalendarioMensualProps) {
  const anio = fechaActual.getFullYear();
  const mes = fechaActual.getMonth();
  const hoy = new Date();
  const tipoColorMap = buildTipoColorMap(reservas);

  const primerDia = new Date(anio, mes, 1);
  const ultimoDia = new Date(anio, mes + 1, 0);

  const diaInicioSemana = primerDia.getDay();
  const diasMes = ultimoDia.getDate();

  const celdas: (Date | null)[] = [];

  for (let i = 0; i < diaInicioSemana; i++) {
    celdas.push(null);
  }

  for (let d = 1; d <= diasMes; d++) {
    celdas.push(new Date(anio, mes, d));
  }

  while (celdas.length % 7 !== 0) {
    celdas.push(null);
  }

  function reservasDelDia(fecha: Date): ReservaVista[] {
    const key = formatearDiaMes(fecha);
    return reservas.filter((r) => {
      const [dd, mm] = r.fecha.split("/");
      return `${dd}/${mm}` === key;
    });
  }

  function esHoy(fecha: Date): boolean {
    return fecha.getDate() === hoy.getDate() &&
      fecha.getMonth() === hoy.getMonth() &&
      fecha.getFullYear() === hoy.getFullYear();
  }

  function esFinde(colIdx: number): boolean {
    return colIdx === 0 || colIdx === 6;
  }

  return (
    <div className={styles.calendar}>
      <div className={styles.header}>
        {DIAS.map((dia) => (
          <div key={dia} className={styles.headerCell}>{dia}</div>
        ))}
      </div>
      <div className={styles.grid}>
        {celdas.map((fecha, idx) => {
          const col = idx % 7;
          const isWeekend = esFinde(col);
          const isOtherMonth = !fecha;
          const isToday = fecha && esHoy(fecha);

          let cellClass = styles.cell;
          if (isOtherMonth) cellClass += ` ${styles.otherMonth}`;
          else if (isWeekend) cellClass += ` ${styles.weekend}`;
          if (isToday) cellClass += ` ${styles.today}`;

          return (
            <div key={idx} className={cellClass}>
              {fecha && (
                <>
                  <div className={styles.dayNumber}>
                    <span className={isToday ? styles.todayNumber : ""}>
                      {fecha.getDate()}
                    </span>
                  </div>
                  <div className={styles.events}>
                    {reservasDelDia(fecha).slice(0, 3).map((reserva) => {
                      const colorInfo = tipoColorMap.get(reserva.tipoEvento);
                      const bg = colorInfo?.bg || "#E0E3E5";
                      const border = colorInfo?.border || "#6B7280";
                      return (
                        <div
                          key={reserva.id}
                          className={styles.event}
                          style={{
                            background: bg,
                            borderLeft: `3px solid ${border}`,
                          }}
                          title={`${reserva.horario} - ${reserva.nombreInvitado} (${reserva.estado})`}
                        >
                          <span className={styles.eventTime}>{reserva.horario.split(" - ")[0]}</span>
                          <StatusIcon estado={reserva.estado} size={12} />
                          <span className={styles.eventName}>
                            {reserva.nombreInvitado}
                          </span>
                        </div>
                      );
                    })}
                    {reservasDelDia(fecha).length > 3 && (
                      <span className={styles.moreEvents}>
                        +{reservasDelDia(fecha).length - 3} más
                      </span>
                    )}
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
