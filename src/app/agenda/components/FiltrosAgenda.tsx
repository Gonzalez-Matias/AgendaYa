"use client";

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
  return (
    <div className={styles.filtros}>
      <label className={styles.label} htmlFor="filtro-estado">
        Filtrar por estado
      </label>
      <select
        id="filtro-estado"
        data-cy="filtro-estado"
        className={styles.select}
        value={estado}
        onChange={(e) => onChange(e.target.value)}
      >
        {ESTADOS_FILTRO.map((opcion) => (
          <option key={opcion.value} value={opcion.value}>
            {opcion.label}
          </option>
        ))}
      </select>

      {estado ? (
        <span className={styles.chip} data-cy="filtro-activo">
          Filtro activo
        </span>
      ) : null}
    </div>
  );
}
