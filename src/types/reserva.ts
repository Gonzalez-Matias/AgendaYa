export interface ReagendarReservaInput {
  reservaId: number;
  nuevaFechaHoraInicio: Date;
  motivo?: string;
}

export interface ReagendarReservaResult {
  reserva: {
    id: number;
    fechaHoraInicio: Date;
    duracion: number;
    nombreInvitado: string;
    emailInvitado: string;
    tipoEvento: { id: number; nombre: string };
    estadoReserva: { id: number; nombre: string };
    administrador: { id: number; nombre: string; email: string };
  };
  mensaje: string;
}
