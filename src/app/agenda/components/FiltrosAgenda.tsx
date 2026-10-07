"use client";

import { useState } from "react";
import styles from "./FiltrosAgenda.module.css";

export const ESTADOS_FILTRO = [
  { value: "", label: "Todos" },
  { value: "Confirmada", label: "Confirmada" },
  { value: "PendienteDeConfirmacion", label: "Pendiente de confirmación" },
  { value: "PendienteDeReagendar", label: "Pendiente de reagendar" },
  { value: "Cancelada", label: "Cancelada" },
  { value: "Completada", label: "Completada" },
] as const;

interface FiltrosAgendaProps {
  estado: string;
  onChange: (estado: string) => void;
}

export function FiltrosAgenda({ estado, onChange }: FiltrosAgendaProps) {
  const [abierto, setAbierto] = useState(false);
  const actual = ESTADOS_FILTRO.find((opcion) => opcion.value === estado) ?? ESTADOS_FILTRO[0];

  function seleccionar(value: string) {
    onChange(value);
    setAbierto(false);
  }

  return (
    <div className={styles.filtros}>
      <span className={styles.label}>Filtrar por estado</span>

      <div className={styles.dropdown}>
        <button
          type="button"
          data-cy="filtro-estado"
          className={styles.trigger}
          onClick={() => setAbierto((valor) => !valor)}
        >
          {actual.label}
        </button>

        {abierto && (
          <>
            <div className={styles.overlay} onClick={() => setAbierto(false)} />
            <div className={styles.menu} data-cy="filtro-menu">
              {ESTADOS_FILTRO.map((opcion) => (
                <button
                  key={opcion.value}
                  type="button"
                  data-cy={`filtro-opcion-${opcion.value || "todos"}`}
                  className={`${styles.opcion} ${
                    opcion.value === estado ? styles.opcionActiva : ""
                  }`}
                  onClick={() => seleccionar(opcion.value)}
                >
                  {opcion.label}
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {estado ? (
        <span className={styles.chip} data-cy="filtro-activo">
          Filtro activo
        </span>
      ) : null}
    </div>
  );
}
