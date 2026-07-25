"use client";

import { useState, useEffect, useCallback } from "react";
import { MiniCalendario } from "./MiniCalendario";
import styles from "./ReagendarModal.module.css";

interface SlotInfo {
  inicio: string;
  fin: string;
  label: string;
}

interface DiaInfo {
  fecha: string;
  slots: SlotInfo[];
}

interface ReagendarModalProps {
  reservaId: number;
  tipoEventoId: number;
  adminId: number;
  duracion: number;
  fechaActual: string;
  horarioActual: string;
  nombreInvitado: string;
  tipoEvento: string;
  notaInvitado: string | null;
  onClose: () => void;
  onAction?: () => void;
}

const DIAS_LARGOS = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
const MESES_LARGOS = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

function formatearSlotHora(isoStr: string): string {
  const d = new Date(isoStr);
  const h = d.getHours();
  const m = d.getMinutes();
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 || 12;
  if (m === 0) return `${h12}:00 ${ampm}`;
  return `${h12}:${String(m).padStart(2, "0")} ${ampm}`;
}

function formatKey(day: number, month: number, year: number): string {
  return `${String(day).padStart(2, "0")}/${String(month + 1).padStart(2, "0")}/${year}`;
}

function parseSlotLabel(inicio: string, fin: string): string {
  return `${formatearSlotHora(inicio)} - ${formatearSlotHora(fin)}`;
}

function formatDateLong(dateStr: string): string {
  const d = new Date(dateStr);
  return `${DIAS_LARGOS[d.getDay()]}, ${MESES_LARGOS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

function agruparSlots(slotsBrutos: { inicio: string; fin: string }[], duracionMin: number): SlotInfo[] {
  const resultado: SlotInfo[] = [];
  const cantidad = duracionMin / 15;
  for (let i = 0; i <= slotsBrutos.length - cantidad; i++) {
    const inicio = slotsBrutos[i].inicio;
    const finEsperado = new Date(new Date(inicio).getTime() + duracionMin * 60000).toISOString();
    const ultimo = slotsBrutos[i + cantidad - 1];
    if (ultimo && ultimo.fin === finEsperado) {
      resultado.push({
        inicio,
        fin: finEsperado,
        label: `${formatearSlotHora(inicio)} - ${formatearSlotHora(finEsperado)}`,
      });
    }
  }
  return resultado;
}

export function ReagendarModal({
  reservaId,
  tipoEventoId,
  adminId,
  duracion,
  fechaActual,
  horarioActual,
  nombreInvitado,
  tipoEvento,
  notaInvitado,
  onClose,
  onAction,
}: ReagendarModalProps) {
  const [disponibilidad, setDisponibilidad] = useState<DiaInfo[]>([]);
  const [cargando, setCargando] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<SlotInfo | null>(null);
  const [confirmando, setConfirmando] = useState(false);
  const [procesando, setProcesando] = useState(false);
  const [error, setError] = useState("");
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const d = new Date(fechaActual);
    return d.getMonth();
  });
  const [calendarYear, setCalendarYear] = useState(() => {
    const d = new Date(fechaActual);
    return d.getFullYear();
  });

  const diasDisponibles = new Set(
    disponibilidad.map((d) => {
      const fecha = new Date(d.fecha);
      return formatKey(fecha.getDate(), fecha.getMonth(), fecha.getFullYear());
    })
  );

  const fetchDisponibilidad = useCallback(async (desde: Date, hasta: Date) => {
    setCargando(true);
    setError("");
    try {
      const res = await fetch("/api/disponibilidad", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tipoEventoId,
          fechaDesde: desde.toISOString(),
          fechaHasta: hasta.toISOString(),
        }),
      });
      const data = await res.json();
      if (data.error) {
        setError(data.error);
        setDisponibilidad([]);
      } else {
        const dias: DiaInfo[] = (data.data || []).map((d: { fecha: string; slots: { inicio: string; fin: string }[] }) => ({
          fecha: d.fecha,
          slots: agruparSlots(d.slots, duracion),
        }));
        setDisponibilidad(dias);
      }
    } catch {
      setError("Error al cargar disponibilidad");
    } finally {
      setCargando(false);
    }
  }, [tipoEventoId, duracion]);

  useEffect(() => {
    const desde = new Date(calendarYear, calendarMonth, 1);
    desde.setHours(0, 0, 0, 0);
    const finDeMes = new Date(calendarYear, calendarMonth + 1, 0);
    finDeMes.setHours(23, 59, 59, 999);
    const maxHasta = new Date(desde);
    maxHasta.setDate(desde.getDate() + 29);
    maxHasta.setHours(23, 59, 59, 999);
    const hasta = finDeMes.getTime() < maxHasta.getTime() ? finDeMes : maxHasta;
    fetchDisponibilidad(desde, hasta);
  }, [calendarMonth, calendarYear, fetchDisponibilidad]);

  function handleSelectDate(dateKey: string) {
    setSelectedDate(dateKey);
    setSelectedSlot(null);
  }

  function handleSelectSlot(slot: SlotInfo) {
    setSelectedSlot(slot);
  }

  function handleMonthChange(month: number, year: number) {
    setCalendarMonth(month);
    setCalendarYear(year);
    setSelectedDate(null);
    setSelectedSlot(null);
  }

  async function handleConfirm() {
    if (!selectedSlot) return;
    setConfirmando(true);
  }

  async function handleConfirmarDefinitivo() {
    if (!selectedSlot) return;
    setProcesando(true);
    setError("");
    try {
      const res = await fetch("/api/reservas/reagendar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reservaId,
          nuevaFechaHoraInicio: selectedSlot.inicio,
          adminId,
        }),
      });
      if (res.ok) {
        onAction?.();
        onClose();
      } else {
        const data = await res.json();
        setError(data.error || "Error al reagendar");
      }
    } catch {
      setError("Error al reagendar");
    } finally {
      setProcesando(false);
    }
  }

  const slotsDelDia = selectedDate
    ? disponibilidad.find((d) => {
        const fecha = new Date(d.fecha);
        return formatKey(fecha.getDate(), fecha.getMonth(), fecha.getFullYear()) === selectedDate;
      })?.slots || []
    : [];

  const selectedDateLong = selectedDate
    ? (() => {
        const [dd, mm, yyyy] = selectedDate.split("/");
        return `${DIAS_LARGOS[new Date(Number(yyyy), Number(mm) - 1, Number(dd)).getDay()]}, ${MESES_LARGOS[Number(mm) - 1]} ${Number(dd)}, ${yyyy}`;
      })()
    : "";

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <div className={styles.headerText}>
            <span className={styles.title}>Reagendar Reserva</span>
            <span className={styles.subtitle}>Elija nueva fecha y horario</span>
          </div>
          <button className={styles.closeBtn} onClick={onClose} type="button">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M1 1l12 12M13 1L1 13" stroke="#434656" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <div className={styles.body}>
          <div className={styles.eventInfo}>
            <span className={styles.eventName}>{tipoEvento} - {nombreInvitado}</span>
            <div className={styles.eventDetails}>
              <div className={styles.detailRow}>
                <div className={styles.detailIcon}>
                  <svg width="18" height="20" viewBox="0 0 18 20" fill="none">
                    <rect x="1" y="2" width="16" height="17" rx="2" stroke="#737688" strokeWidth="1.5" />
                    <path d="M1 7h16" stroke="#737688" strokeWidth="1.5" />
                    <path d="M5 1v3M13 1v3" stroke="#737688" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                </div>
                <span className={styles.detailText}>{formatDateLong(fechaActual)}</span>
              </div>
              <div className={styles.detailRow}>
                <div className={styles.detailIcon}>
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <circle cx="10" cy="10" r="8" stroke="#737688" strokeWidth="1.5" />
                    <path d="M10 5v5l4 2" stroke="#737688" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                </div>
                <span className={styles.detailText}>{horarioActual}</span>
              </div>
            </div>
          </div>

          {notaInvitado && (
            <div className={styles.noteSection}>
              <span className={styles.noteLabel}>DESCRIPCIÓN</span>
              <span className={styles.noteText}>{notaInvitado}</span>
            </div>
          )}

          <div className={styles.calendarSection}>
            {cargando ? (
              <span className={styles.noSlots}>Cargando disponibilidad...</span>
            ) : error ? (
              <span className={styles.noSlots} style={{ color: "#EF4444" }}>{error}</span>
            ) : (
              <MiniCalendario
                month={calendarMonth}
                year={calendarYear}
                diasDisponibles={diasDisponibles}
                selectedDate={selectedDate}
                onSelectDate={handleSelectDate}
                onMonthChange={handleMonthChange}
              />
            )}
          </div>

          {selectedDate && slotsDelDia.length > 0 && (
            <div className={styles.slotsSection}>
              <span className={styles.slotsHeader}>Turnos disponibles - {selectedDateLong}</span>
              <div className={styles.slotsList}>
                {slotsDelDia.map((slot) => (
                  <button
                    key={slot.inicio}
                    className={`${styles.slotBtn} ${selectedSlot?.inicio === slot.inicio ? styles.slotBtnSelected : ""}`}
                    onClick={() => handleSelectSlot(slot)}
                    type="button"
                  >
                    {slot.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {selectedDate && slotsDelDia.length === 0 && !cargando && (
            <div className={styles.slotsSection}>
              <span className={styles.noSlots}>No hay turnos disponibles para esta fecha</span>
            </div>
          )}
        </div>

        <div className={styles.footer}>
          <button className={styles.cancelBtn} onClick={onClose} disabled={procesando} type="button">
            Cancelar
          </button>
          <button
            className={styles.confirmBtn}
            onClick={handleConfirm}
            disabled={!selectedSlot || procesando}
            type="button"
          >
            Confirmar Cambios
          </button>
        </div>
      </div>

      {confirmando && selectedSlot && (
        <div className={styles.confirmOverlay} onClick={() => setConfirmando(false)}>
          <div className={styles.confirmDialog} onClick={(e) => e.stopPropagation()}>
            <div className={styles.confirmHeader}>
              <div className={styles.confirmIcon}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="#54647A" strokeWidth="2" />
                  <path d="M8 12l3 3 5-5" stroke="#54647A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <span className={styles.confirmTitle}>Confirmar cambio de turno</span>
            </div>

            <div className={styles.confirmInfo}>
              <div className={styles.confirmText}>
                Está a punto de reagendar la reserva{" "}
                <span className={styles.confirmTextBold}>{tipoEvento} - {nombreInvitado}</span>.{" "}
                ¿Desea confirmar los cambios?
              </div>
              <div className={styles.confirmDetails}>
                <div className={styles.confirmDetailRow}>
                  <div className={styles.confirmDetailIcon}>
                    <svg width="14" height="15" viewBox="0 0 14 15" fill="none">
                      <rect x="1" y="1.5" width="12" height="12.5" rx="1.5" stroke="#003EC7" strokeWidth="1.5" />
                      <path d="M1 5.5h12" stroke="#003EC7" strokeWidth="1.5" />
                      <path d="M4 1v3M10 1v3" stroke="#003EC7" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                  </div>
                  <span>{formatDateLong(selectedSlot.inicio)}</span>
                </div>
                <div className={styles.confirmDetailRow}>
                  <div className={styles.confirmDetailIcon}>
                    <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
                      <circle cx="7.5" cy="7.5" r="6.5" stroke="#003EC7" strokeWidth="1.5" />
                      <path d="M7.5 4v3.5l2.5 1.5" stroke="#003EC7" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <span>{selectedSlot.label}</span>
                </div>
              </div>
            </div>

            <div className={styles.confirmFooter}>
              <button
                className={styles.confirmCancelBtn}
                onClick={() => setConfirmando(false)}
                disabled={procesando}
                type="button"
              >
                Cancelar
              </button>
              <button
                className={styles.confirmAcceptBtn}
                onClick={handleConfirmarDefinitivo}
                disabled={procesando}
                type="button"
              >
                Confirmar Cambios
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
