"use client";

import { useState, useEffect } from "react";
import styles from "./DetalleReserva.module.css";
import { ConfirmDialog } from "./ConfirmDialog";
import { ReagendarModal } from "./ReagendarModal";

interface DetalleReservaData {
  id: number;
  fechaHoraInicio: string;
  fechaHoraFin: string;
  duracion: number;
  nombreInvitado: string;
  emailInvitado: string;
  telefonoInvitado: string | null;
  notaInvitado: string | null;
  tipoEvento: { id: number; nombre: string; duracion: number };
  estado: { id: number; nombre: string };
}

interface DetalleReservaProps {
  reservaId: number;
  adminId: number;
  adminNombre: string;
  onClose: () => void;
  onAction?: () => void;
}

const DIAS_LARGOS = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
const MESES_LARGOS = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; outline: string }> = {
  Confirmada: { label: "Confirmada", color: "#166534", bg: "#DCFCE7", outline: "#4CAF50" },
  PendienteDeConfirmacion: { label: "Pendiente de confirmación", color: "#854D0E", bg: "#EAD48E", outline: "#EAB308" },
  PendienteDeReagendar: { label: "Pendiente de reagendar", color: "#9A3412", bg: "#FED7AA", outline: "#F97316" },
  Cancelada: { label: "Cancelada", color: "#991B1B", bg: "#FEE2E2", outline: "#EF4444" },
  Completada: { label: "Completada", color: "#4B5563", bg: "#F3F4F6", outline: "#6B7280" },
};

const TIPO_COLORS = ["#003EC7", "#9C27B0", "#4CAF50", "#6B7280", "#F59E0B", "#EF4444", "#3B82F6", "#10B981"];

function formatDuration(mins: number): string {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h > 0 && m > 0) return `${h} hora${h > 1 ? "s" : ""} ${m} min`;
  if (h > 0) return `${h} hora${h > 1 ? "s" : ""}`;
  return `${m} min`;
}

function formatTime(dateStr: string): string {
  const d = new Date(dateStr);
  const h = d.getHours();
  const m = d.getMinutes();
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 || 12;
  return `${h12}:${String(m).padStart(2, "0")} ${ampm}`;
}

function formatFullDate(dateStr: string): string {
  const d = new Date(dateStr);
  return `${DIAS_LARGOS[d.getDay()]}, ${MESES_LARGOS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

export function DetalleReserva({ reservaId, adminId, adminNombre, onClose, onAction }: DetalleReservaProps) {
  const [detalle, setDetalle] = useState<DetalleReservaData | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [procesando, setProcesando] = useState(false);
  const [accionPendiente, setAccionPendiente] = useState<"confirmar" | "cancelar" | "completar" | null>(null);
  const [mostrarReagendar, setMostrarReagendar] = useState(false);

  useEffect(() => {
    fetch(`/api/reservas/${reservaId}?adminId=${adminId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) {
          setError(data.error);
        } else {
          setDetalle(data.data);
        }
      })
      .catch(() => setError("Error al cargar el detalle"))
      .finally(() => setCargando(false));
  }, [reservaId, adminId]);

  if (cargando) {
    return (
      <div className={styles.overlay} onClick={onClose}>
        <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
          <div className={styles.loading}>Cargando...</div>
        </div>
      </div>
    );
  }

  if (error || !detalle) {
    return (
      <div className={styles.overlay} onClick={onClose}>
        <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
          <div className={styles.error}>{error || "Reserva no encontrada"}</div>
          <button className={styles.closeBtn} onClick={onClose}>✕</button>
        </div>
      </div>
    );
  }

  const st = STATUS_CONFIG[detalle.estado.nombre] || STATUS_CONFIG.PendienteDeConfirmacion;
  const tipoColor = TIPO_COLORS[detalle.tipoEvento.id % TIPO_COLORS.length];
  const isPendiente = detalle.estado.nombre === "PendienteDeConfirmacion";
  const isConfirmada = detalle.estado.nombre === "Confirmada";
  const isCancelada = detalle.estado.nombre === "Cancelada";
  const isCompletada = detalle.estado.nombre === "Completada";
  const isFinalizada = isCancelada || isCompletada;

  async function handleConfirmar() {
    setProcesando(true);
    try {
      const res = await fetch("/api/reservas/confirmar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reservaId, adminId }),
      });
      if (res.ok) {
        onAction?.();
        onClose();
      } else {
        const data = await res.json();
        setError(data.error || "Error al confirmar");
      }
    } catch {
      setError("Error al confirmar");
    } finally {
      setProcesando(false);
    }
  }

  async function handleCancelar(motivo?: string) {
    setProcesando(true);
    try {
      const res = await fetch("/api/reservas/cancelar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reservaId, adminId, motivo: motivo || undefined }),
      });
      if (res.ok) {
        onAction?.();
        onClose();
      } else {
        const data = await res.json();
        setError(data.error || "Error al cancelar");
      }
    } catch {
      setError("Error al cancelar");
    } finally {
      setProcesando(false);
    }
  }

  async function handleCompletar() {
    setProcesando(true);
    try {
      const res = await fetch("/api/reservas/completar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reservaId, adminId }),
      });
      if (res.ok) {
        onAction?.();
        onClose();
      } else {
        const data = await res.json();
        setError(data.error || "Error al completar");
      }
    } catch {
      setError("Error al completar");
    } finally {
      setProcesando(false);
    }
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <div className={styles.dot} style={{ background: tipoColor }} />
            <span className={styles.tipoLabel}>{detalle.tipoEvento.nombre}</span>
            <span className={styles.statusBadge} style={{ background: st.bg, color: st.color, outline: `1px solid ${st.outline}` }}>
              {st.label}
            </span>
          </div>
          <button className={styles.closeBtn} onClick={onClose}>✕</button>
        </div>

        <div className={styles.title}>{detalle.tipoEvento.nombre} - {detalle.nombreInvitado}</div>

        <div className={styles.body}>
          <div className={styles.section}>
            <div className={styles.sectionIcon}>
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <rect x="2" y="3" width="16" height="15" rx="2" stroke="#434656" strokeWidth="1.5" />
                <path d="M2 7h16" stroke="#434656" strokeWidth="1.5" />
                <path d="M6 1v4M14 1v4" stroke="#434656" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </div>
            <div className={styles.sectionContent}>
              <div className={styles.dateText}>{formatFullDate(detalle.fechaHoraInicio)}</div>
              <div className={styles.timeText}>{formatTime(detalle.fechaHoraInicio)} - {formatTime(detalle.fechaHoraFin)} ({formatDuration(detalle.duracion)})</div>
            </div>
          </div>

          <div className={styles.section}>
            <div className={styles.sectionIcon}>
              <svg width="22" height="16" viewBox="0 0 22 16" fill="none">
                <circle cx="8" cy="5" r="3.5" stroke="#434656" strokeWidth="1.5" />
                <path d="M1 15c0-3.3 2.7-6 6-6s6 2.7 6 6" stroke="#434656" strokeWidth="1.5" strokeLinecap="round" />
                <circle cx="16" cy="5" r="2.5" stroke="#434656" strokeWidth="1.5" />
                <path d="M15 15c0-2.5 1.5-4.5 4-5" stroke="#434656" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </div>
            <div className={styles.sectionContent}>
              <span className={styles.sectionLabel}>PARTICIPANTES</span>
              <div className={styles.participant}>
                <span className={styles.participantName}>{adminNombre}</span>
                <span className={styles.participantRole}>(Admin)</span>
              </div>
              <div className={styles.participant}>
                <span className={styles.participantName}>{detalle.nombreInvitado}</span>
              </div>
            </div>
          </div>

          <div className={styles.section}>
            <div className={styles.sectionIcon}>
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M3 17V3l14 7-14 7z" stroke="#434656" strokeWidth="1.5" strokeLinejoin="round" />
              </svg>
            </div>
            <div className={styles.sectionContent}>
              <div className={styles.estadoRow}>
                <span className={styles.estadoLabel}>Estado:</span>
                <span className={styles.estadoText} style={{ color: st.color }}>{st.label}</span>
                {isPendiente && (
                  <button className={styles.confirmBtn} onClick={() => setAccionPendiente("confirmar")} disabled={procesando}>
                    <svg width="13" height="12" viewBox="0 0 13 12" fill="none">
                      <path d="M1 6l4 4 7-7" stroke="#166534" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    Confirmar
                  </button>
                )}
              </div>
            </div>
          </div>

          {detalle.notaInvitado && (
            <div className={styles.section}>
              <div className={styles.sectionIcon}>
                <svg width="16" height="20" viewBox="0 0 16 20" fill="none">
                  <rect x="1" y="1" width="14" height="18" rx="2" stroke="#434656" strokeWidth="1.5" />
                  <path d="M5 6h6M5 10h6M5 14h3" stroke="#434656" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </div>
              <div className={styles.sectionContent}>
                <div className={styles.notaText}>{detalle.notaInvitado}</div>
              </div>
            </div>
          )}
        </div>

        <div className={styles.footer}>
          <button className={styles.cancelBtn} onClick={() => setAccionPendiente("cancelar")} disabled={procesando || isFinalizada}>
            <svg width="17" height="17" viewBox="0 0 17 17" fill="none">
              <path d="M4 4l9 9M13 4l-9 9" stroke="#BA1A1A" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            Cancelar
          </button>
          <button className={styles.reagendarBtn} onClick={() => setMostrarReagendar(true)} disabled={procesando || isFinalizada}>Reagendar</button>
          <button className={styles.completarBtn} onClick={() => setAccionPendiente("completar")} disabled={procesando || !isConfirmada}>
<svg width="17" height="17" viewBox="0 0 17 17" fill="none">
                <circle cx="8.5" cy="8.5" r="7" stroke="white" strokeWidth="1.5" />
                <path d="M5 8.5l2.5 2.5 4.5-4.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Completada
            </button>
        </div>
      </div>

      {accionPendiente && (
        <ConfirmDialog
          variant={accionPendiente}
          eventTitle={`${detalle.tipoEvento.nombre} - ${detalle.nombreInvitado}`}
          onConfirm={accionPendiente === "confirmar" ? () => handleConfirmar() : accionPendiente === "cancelar" ? handleCancelar : handleCompletar}
          onCancel={() => setAccionPendiente(null)}
          loading={procesando}
        />
      )}

      {mostrarReagendar && (
        <ReagendarModal
          reservaId={reservaId}
          tipoEventoId={detalle.tipoEvento.id}
          adminId={adminId}
          duracion={detalle.duracion}
          fechaActual={detalle.fechaHoraInicio}
          horarioActual={`${formatTime(detalle.fechaHoraInicio)} - ${formatTime(detalle.fechaHoraFin)}`}
          nombreInvitado={detalle.nombreInvitado}
          tipoEvento={detalle.tipoEvento.nombre}
          notaInvitado={detalle.notaInvitado}
          onClose={() => setMostrarReagendar(false)}
          onAction={onAction}
        />
      )}
    </div>
  );
}
