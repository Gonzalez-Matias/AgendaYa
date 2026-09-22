"use client";

import type { ReservaVista } from "@/services/visualizacion";
import { StatusIcon } from "./StatusIcon";
import styles from "./Sidebar.module.css";

interface SidebarProps {
  reservas: ReservaVista[];
}

const DOT_COLORS = ["#003EC7", "#9C27B0", "#4CAF50", "#E0E3E5", "#F59E0B", "#EF4444", "#3B82F6", "#10B981"];

const STATE_CONFIG: Record<string, { label: string; bg: string; text: string }> = {
  Confirmada: { label: "Confirmada", bg: "#DCFCE7", text: "#166534" },
  PendienteDeConfirmacion: { label: "Pendiente de confirmación", bg: "#FEF9C3", text: "#854D0E" },
  PendienteDeReagendar: { label: "Pendiente de reagendar", bg: "#FED7AA", text: "#9A3412" },
  Cancelada: { label: "Cancelada", bg: "#FEE2E2", text: "#991B1B" },
  Completada: { label: "Completada", bg: "#F3F4F6", text: "#4B5563" },
};

export function Sidebar({ reservas }: SidebarProps) {
  const tipoCounts = new Map<string, number>();
  const estadoCounts = new Map<string, number>();

  reservas.forEach((r) => {
    tipoCounts.set(r.tipoEvento, (tipoCounts.get(r.tipoEvento) || 0) + 1);
    estadoCounts.set(r.estado, (estadoCounts.get(r.estado) || 0) + 1);
  });

  return (
    <div className={styles.sidebar}>
      <span className={styles.sectionTitle}>Resumen</span>
      <div className={styles.summaryList}>
        {[...tipoCounts.entries()].map(([tipo, count], idx) => (
          <div key={tipo} className={styles.summaryItem}>
            <div className={styles.dot} style={{ background: DOT_COLORS[idx % DOT_COLORS.length] }} />
            <span className={styles.summaryLabel}>
              {tipo} [{count}]
            </span>
          </div>
        ))}
        {tipoCounts.size === 0 && (
          <span className={styles.summaryLabel} style={{ color: "#9CA3AF" }}>
            Sin eventos
          </span>
        )}
      </div>

      <div className={styles.divider} />

      <span className={styles.sectionTitle}>Estados</span>
      <div className={styles.stateList}>
        {["Confirmada", "PendienteDeConfirmacion", "PendienteDeReagendar", "Cancelada", "Completada"].map((estado) => {
          const count = estadoCounts.get(estado) || 0;
          const cfg = STATE_CONFIG[estado];
          if (!cfg) return null;
          return (
            <div key={estado} className={styles.stateItem}>
              <StatusIcon estado={estado} />
              <span className={styles.stateBadge} style={{ background: cfg.bg, color: cfg.text }}>
                {cfg.label} [{count}]
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
