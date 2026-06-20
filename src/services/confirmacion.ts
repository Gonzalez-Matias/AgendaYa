export interface ReservaConfirmacion {
    id: string;
    invitado: string;
    fecha: string;
    hora: string;
    estado: "Pendiente de Confirmación" | "Confirmada" | "Cancelada";
}

// Lógica para Escenario 1 y 2: Cambiar estado y mantener datos
export function confirmarReserva(id: string, reservas: ReservaConfirmacion[]): ReservaConfirmacion | undefined {
    const reserva = reservas.find(r => r.id === id);
    if (reserva) {
        reserva.estado = "Confirmada";
        return reserva;
    }
    return undefined;
}

// Lógica para Escenario 1: Mensaje de éxito
export function obtenerMensajeExito(): string {
    return "Reserva confirmada correctamente";
}