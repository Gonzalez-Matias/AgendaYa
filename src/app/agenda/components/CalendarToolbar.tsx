"use client";

import { useState } from "react";
import styles from "./CalendarToolbar.module.css";

interface CalendarToolbarProps {
  fechaActual: Date;
  modoVista: "lista" | "calendario";
  subVista: "semanal" | "mensual";
  onChangeFecha: (delta: number) => void;
  onGoToMonth: (year: number, month: number) => void;
  onChangeModo: (modo: "lista" | "calendario") => void;
  onChangeSubVista: (sub: "semanal" | "mensual") => void;
}

const MESES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

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

  return (
    <div className={styles.toolbar}>
      <div style={{ position: "relative" }}>
        <span
          className={styles.monthTitle}
          onClick={() => setShowPicker(!showPicker)}
          style={{ cursor: "pointer" }}
        >
          {fechaActual.toLocaleDateString("es-AR", { month: "long", year: "numeric" })}
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
                {MESES.map((mes, idx) => (
                  <button
                    key={mes}
                    className={`${styles.pickerMonth} ${idx === currentMonth ? styles.pickerMonthActive : ""}`}
                    onClick={() => handleSelectMonth(idx)}
                  >
                    {mes.substring(0, 3)}
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
