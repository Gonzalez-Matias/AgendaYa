"use client";

import { useState } from "react";
import type { ModoVista } from "@/services/visualizacion";
import styles from "./CalendarToolbar.module.css";

interface CalendarToolbarProps {
  fechaActual: Date;
  modoVista: ModoVista;
  subVista: "semanal" | "mensual";
  onChangeFecha: (delta: number) => void;
  onGoToMonth: (year: number, month: number) => void;
  onChangeModo: (modo: ModoVista) => void;
  onChangeSubVista: (sub: "semanal" | "mensual") => void;
}

const MESES_CORTOS = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

function getWeekRange(date: Date): { start: Date; end: Date } {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const start = new Date(d);
  start.setDate(diff);
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  return { start, end };
}

function getMonthTitle(fechaActual: Date): string {
  return `${MESES_CORTOS[fechaActual.getMonth()]} ${fechaActual.getFullYear()}`;
}

function getWeekTitle(fechaActual: Date): string {
  const { start, end } = getWeekRange(fechaActual);
  const fmt = (d: Date) => `${MESES_CORTOS[d.getMonth()]} ${d.getDate()}`;

  if (start.getMonth() === end.getMonth()) {
    return `${fmt(start)} - ${end.getDate()}, ${start.getFullYear()}`;
  }
  if (start.getFullYear() === end.getFullYear()) {
    return `${fmt(start)} - ${fmt(end)}, ${start.getFullYear()}`;
  }
  return `${fmt(start)}, ${start.getFullYear()} - ${fmt(end)}, ${end.getFullYear()}`;
}

export function CalendarToolbar({
  fechaActual,
  modoVista,
  subVista,
  onChangeFecha,
  onGoToMonth,
  onChangeModo,
  onChangeSubVista,
}: CalendarToolbarProps) {
  const [showPicker, setShowPicker] = useState(false);
  const currentYear = fechaActual.getFullYear();
  const currentMonth = fechaActual.getMonth();

  function handleSelectMonth(month: number) {
    onGoToMonth(currentYear, month);
    setShowPicker(false);
  }

  const monthTitle = subVista === "semanal"
    ? getWeekTitle(fechaActual)
    : getMonthTitle(fechaActual);

  return (
    <div className={styles.toolbar}>
      <div style={{ position: "relative" }}>
        <span
          className={styles.monthTitle}
          onClick={() => setShowPicker(!showPicker)}
          style={{ cursor: "pointer" }}
        >
          {monthTitle}
        </span>

        {showPicker && (
          <>
            <div className={styles.pickerOverlay} onClick={() => setShowPicker(false)} />
            <div className={styles.picker}>
              <div className={styles.pickerYear}>
                <button
                  className={styles.pickerYearBtn}
                  onClick={() => onGoToMonth(currentYear - 1, currentMonth)}
                >
                  ◀
                </button>
                <span style={{ fontWeight: 700, fontSize: 14 }}>{currentYear}</span>
                <button
                  className={styles.pickerYearBtn}
                  onClick={() => onGoToMonth(currentYear + 1, currentMonth)}
                >
                  ▶
                </button>
              </div>
              <div className={styles.pickerGrid}>
                {MESES_CORTOS.map((mes, idx) => (
                  <button
                    key={mes}
                    className={`${styles.pickerMonth} ${idx === currentMonth ? styles.pickerMonthActive : ""}`}
                    onClick={() => handleSelectMonth(idx)}
                  >
                    {mes}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      <div className={styles.navArrows}>
        <button className={styles.arrowBtn} onClick={() => onChangeFecha(-1)}>◀</button>
        <button className={styles.arrowBtn} onClick={() => onChangeFecha(1)}>▶</button>
      </div>

      <div className={styles.toggles}>
        <div className={styles.toggleGroup}>
          <button
            className={`${styles.toggleBtn} ${modoVista === "lista" ? styles.toggleBtnActive : ""}`}
            onClick={() => onChangeModo("lista")}
          >
            Lista
          </button>
          <button
            className={`${styles.toggleBtn} ${modoVista === "calendario" ? styles.toggleBtnActive : ""}`}
            onClick={() => onChangeModo("calendario")}
          >
            Calendario
          </button>
        </div>

        <div className={styles.toggleGroup}>
          <button
            className={`${styles.toggleBtn} ${subVista === "semanal" ? styles.toggleBtnActive : ""}`}
            onClick={() => onChangeSubVista("semanal")}
          >
            Semana
          </button>
          <button
            className={`${styles.toggleBtn} ${subVista === "mensual" ? styles.toggleBtnActive : ""}`}
            onClick={() => onChangeSubVista("mensual")}
          >
            Mes
          </button>
        </div>
      </div>
    </div>
  );
}
