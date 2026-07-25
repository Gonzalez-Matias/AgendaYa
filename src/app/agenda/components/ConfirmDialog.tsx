"use client";

import { useState } from "react";
import styles from "./ConfirmDialog.module.css";

interface ConfirmDialogProps {
  variant: "cancelar" | "confirmar" | "completar";
  eventTitle: string;
  onConfirm: (motivo?: string) => void;
  onCancel: () => void;
  loading: boolean;
}

export function ConfirmDialog({ variant, eventTitle, onConfirm, onCancel, loading }: ConfirmDialogProps) {
  const [motivo, setMotivo] = useState("");

  function handleConfirm() {
    if (variant === "cancelar") {
      onConfirm(motivo || undefined);
    } else {
      onConfirm();
    }
  }

  if (variant === "cancelar") {
    return (
      <div className={styles.overlay} onClick={onCancel}>
        <div className={`${styles.dialog} ${styles.dialogCancelar}`} onClick={(e) => e.stopPropagation()}>
          <div className={styles.headerCancelar}>
            <div className={styles.iconBoxCancelar}>
              <svg width="22" height="19" viewBox="0 0 22 19" fill="none">
                <path d="M1 1h20M7 1L1 18h14L19 1" stroke="#BA1A1A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M9 7l4 5M13 7l-4 5" stroke="#BA1A1A" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </div>
            <div className={styles.headerText}>
              <div className={styles.title}>Cancelar Reserva</div>
              <div className={styles.bodyText}>
                Esta acción eliminará <span className={styles.bodyTextStrong}>&quot;{eventTitle}&quot;</span> de su calendario y notificará a todos los asistentes.<br />¿Está seguro?
              </div>
            </div>
          </div>

          <div className={styles.textareaWrapper}>
            <textarea
              className={styles.textarea}
              placeholder="Motivo de cancelación (opcional)"
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
            />
          </div>

          <div className={styles.footer}>
            <button className={`${styles.btnVolver} ${styles.btnVolverCancelar}`} onClick={onCancel} disabled={loading}>
              Volver
            </button>
            <button className={styles.btnConfirmCancelar} onClick={handleConfirm} disabled={loading}>
              Cancelar Reserva
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (variant === "confirmar") {
    return (
      <div className={styles.overlay} onClick={onCancel}>
        <div className={`${styles.dialog} ${styles.dialogConfirmar}`} onClick={(e) => e.stopPropagation()}>
          <div className={styles.headerConfirmar}>
            <div className={styles.title}>Confirmar Reserva</div>
            <div className={styles.iconBoxCheck}>
              <svg width="33" height="30" viewBox="0 0 33 30" fill="none">
                <path d="M3 15l8 8L28 3" stroke="#4CAF50" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </div>

          <div className={styles.bodySection}>
            <div className={styles.bodyText}>
              ¿Está seguro que quiere confirmar la reserva llamada<br />
              <span className={styles.bodyTextStrong}>&quot;{eventTitle}&quot;</span>?
            </div>
          </div>

          <div className={styles.footer}>
            <button className={styles.btnVolver} onClick={onCancel} disabled={loading}>
              Volver
            </button>
            <button className={styles.btnConfirmar} onClick={handleConfirm} disabled={loading}>
              Confirmar Reserva
            </button>
          </div>
        </div>
      </div>
    );
  }

  // completar
  return (
    <div className={styles.overlay} onClick={onCancel}>
      <div className={`${styles.dialog} ${styles.dialogCompletar}`} onClick={(e) => e.stopPropagation()}>
        <div className={styles.headerCompletar}>
          <div className={styles.iconBoxCompletar} />
          <div className={styles.titleCompletar}>Marcar como completada</div>
          <button className={styles.closeBtn} onClick={onCancel}>✕</button>
        </div>

        <div className={styles.bodySectionCompletar}>
          <div className={styles.bodyText}>
            ¿Está seguro que quiere marcar la reserva<br />
            <span className={styles.bodyTextStrong}>&quot;{eventTitle}&quot;</span> como completada?
          </div>
        </div>

        <div className={`${styles.footer} ${styles.footerWhite}`}>
          <button className={styles.btnVolver} onClick={onCancel} disabled={loading}>
            Volver
          </button>
          <button className={styles.btnCompletar} onClick={handleConfirm} disabled={loading}>
            Marcar Completada
          </button>
        </div>
      </div>
    </div>
  );
}
