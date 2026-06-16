"use server";

import { reagendarReserva, ReagendarError } from "../services/reserva.service";

export async function reagendarReservaAction(input: {
  reservaId: number;
  nuevaFechaHoraInicio: Date;
  motivo?: string;
}) {
  try {
    // Llamamos a tu lógica de negocio
    const resultado = await reagendarReserva(input);
    
    // Retornamos un objeto de éxito para el frontend
    return { 
        success: true, 
        data: resultado 
    };
    
  } catch (error) {
    // Si atrapamos el error específico de negocio que creaste, lo devolvemos
    if (error instanceof ReagendarError) {
      return { 
          success: false, 
          error: error.message 
      };
    }
    
    // Fallback para errores no controlados (ej. caídas de base de datos)
    return { 
        success: false, 
        error: "Ocurrió un error inesperado al intentar re-agendar la reserva." 
    };
  }
}