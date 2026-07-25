"use client";

import styles from "./MiniCalendario.module.css";

interface MiniCalendarioProps {
  month: number;
  year: number;
  diasDisponibles: Set<string>;
  selectedDate: string | null;
  onSelectDate: (dateStr: string) => void;
  onMonthChange: (month: number, year: number) => void;
}

const DIAS_CORTOS = ["Dom", "Lun", "Mar", "Mie", "Jue", "Vie", "Sab"];
const MESES = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

function formatKey(day: number, month: number, year: number): string {
  return `${String(day).padStart(2, "0")}/${String(month + 1).padStart(2, "0")}/${year}`;
}

export function MiniCalendario({ month, year, diasDisponibles, selectedDate, onSelectDate, onMonthChange }: MiniCalendarioProps) {
  const primerDia = new Date(year, month, 1);
  const ultimoDia = new Date(year, month + 1, 0);
  const diasEnMes = ultimoDia.getDate();
  const diaInicioSemana = primerDia.getDay();

  const today = new Date();
  const todayTime = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();

  const celdas: { key: string; day: number; empty: boolean }[] = [];

  for (let i = 0; i < diaInicioSemana; i++) {
    celdas.push({ key: `empty-${i}`, day: 0, empty: true });
  }

  for (let d = 1; d <= diasEnMes; d++) {
    const key = formatKey(d, month, year);
    celdas.push({ key, day: d, empty: false });
  }

  function handlePrevMonth() {
    if (month === 0) {
      onMonthChange(11, year - 1);
    } else {
      onMonthChange(month - 1, year);
    }
  }

  function handleNextMonth() {
    if (month === 11) {
      onMonthChange(0, year + 1);
    } else {
      onMonthChange(month + 1, year);
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.nav}>
        <span className={styles.monthTitle}>{MESES[month]} {year}</span>
        <div className={styles.arrows}>
          <button className={styles.arrowBtn} onClick={handlePrevMonth} type="button">
            <svg width="8" height="12" viewBox="0 0 8 12" fill="none">
              <path d="M7 1L1 6l6 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <button className={styles.arrowBtn} onClick={handleNextMonth} type="button">
            <svg width="8" height="12" viewBox="0 0 8 12" fill="none">
              <path d="M1 1l6 5-6 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </div>

      <div className={styles.dayHeaders}>
        {DIAS_CORTOS.map((d) => (
          <div key={d} className={styles.dayHeader}>{d}</div>
        ))}
      </div>

      <div className={styles.grid}>
        {celdas.map((celda) => {
          if (celda.empty) {
            return <div key={celda.key} className={styles.dayCell} />;
          }

          const isAvailable = diasDisponibles.has(celda.key);
          const isSelected = celda.key === selectedDate;
          const celdaTime = new Date(year, month, celda.day).getTime();
          const isPast = celdaTime < todayTime;

          let className = styles.dayCell;
          if (isSelected) {
            className += ` ${styles.daySelected}`;
          } else if (isAvailable && !isPast) {
            className += ` ${styles.dayAvailable}`;
          } else if (!isAvailable) {
            className += ` ${styles.dayDisabled}`;
          }

          return (
            <div
              key={celda.key}
              className={className}
              onClick={() => {
                if (isAvailable && !isPast) {
                  onSelectDate(celda.key);
                }
              }}
              role="button"
              tabIndex={isAvailable && !isPast ? 0 : -1}
            >
              <span className={styles.dayNumber}>{celda.day}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
