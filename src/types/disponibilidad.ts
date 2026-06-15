export interface ConsultarDisponibilidadInput {
  tipoEventoId: number;
  fechaDesde: Date;
  fechaHasta: Date;
}

export interface SlotDisponible {
  inicio: Date;
  fin: Date;
}

export interface DiaDisponible {
  fecha: Date;
  slots: SlotDisponible[];
}
