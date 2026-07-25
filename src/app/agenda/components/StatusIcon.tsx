"use client";

interface StatusIconProps {
  estado: string;
  size?: number;
}

export function StatusIcon({ estado, size = 16 }: StatusIconProps) {
  const s = size;
  if (estado === "Confirmada") {
    return (
      <svg width={s} height={s} viewBox="0 0 16 16" fill="none">
        <path d="M3 8l4 4 6-6" stroke="#16A34A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  if (estado === "PendienteDeConfirmacion") {
    return (
      <svg width={s} height={s} viewBox="0 0 16 16" fill="none">
        <circle cx="8" cy="8" r="6" stroke="#EAB308" strokeWidth="2" />
        <path d="M8 4v4l3 2" stroke="#EAB308" strokeWidth="2" strokeLinecap="round" />
      </svg>
    );
  }
  if (estado === "PendienteDeReagendar") {
    return (
      <svg width={s} height={s} viewBox="0 0 16 16" fill="none">
        <circle cx="8" cy="8" r="6" stroke="#F97316" strokeWidth="2" />
        <path d="M8 4.5v4" stroke="#F97316" strokeWidth="2" strokeLinecap="round" />
        <circle cx="8" cy="11.5" r="1" fill="#F97316" />
      </svg>
    );
  }
  if (estado === "Cancelada") {
    return (
      <svg width={s} height={s} viewBox="0 0 16 16" fill="none">
        <path d="M4 4l8 8M12 4l-8 8" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" />
      </svg>
    );
  }
  return (
    <svg width={s} height={s} viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="6" stroke="#6B7280" strokeWidth="2" />
    </svg>
  );
}
