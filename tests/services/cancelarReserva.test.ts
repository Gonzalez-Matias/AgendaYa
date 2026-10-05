import { z } from "zod";
import { cancelarReserva } from "../../src/services/cancelarReserva";
import * as repositorio from "../../src/repositories/cancelarReserva";

// Mockeamos el repositorio para aislar la prueba de la base de datos real.
// Usamos factory explicita para no cargar Prisma ni requerir DATABASE_URL.
jest.mock("../../src/repositories/cancelarReserva", () => ({
  obtenerReservaPorId: jest.fn(),
  obtenerEstadoPorNombre: jest.fn(),
  cancelarReservaAtomica: jest.fn(),
}));

describe("cancelarReserva (unitario con mocks)", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  // ---------------------------------------------------------------------------
  // Comportamiento 1: cancelarReserva (procesamiento de la cancelación)
  // ---------------------------------------------------------------------------
  describe("cancelarReserva", () => {
    it("Test 1 (Happy path): cancela la reserva exitosamente cuando los datos son válidos", async () => {
      (repositorio.obtenerReservaPorId as jest.Mock).mockResolvedValue({
        id: 10,
        administradorId: 1,
        estadoReserva: { id: 1, nombre: "Confirmada" },
      });
      (repositorio.obtenerEstadoPorNombre as jest.Mock).mockResolvedValue({
        id: 2,
        nombre: "Cancelada",
      });
      (repositorio.cancelarReservaAtomica as jest.Mock).mockResolvedValue(true);

      await expect(
        cancelarReserva({ reservaId: 10, motivo: "Cancelación solicitada" })
      ).resolves.toBeUndefined();

      // Cambia el estado a Cancelado: se invoca la cancelación atómica con el
      // id de la reserva, el id del estado "Cancelada" y el motivo.
      expect(repositorio.cancelarReservaAtomica).toHaveBeenCalledWith(
        10,
        2,
        "Cancelación solicitada"
      );
      expect(repositorio.cancelarReservaAtomica).toHaveBeenCalledTimes(1);
    });

    it("Test 2 (Error): lanza error si la reserva no existe", async () => {
      (repositorio.obtenerReservaPorId as jest.Mock).mockResolvedValue(null);

      await expect(cancelarReserva({ reservaId: 99999, motivo: "No existe" })).rejects.toThrow(
        "Reserva no encontrada"
      );

      // Nunca intenta cancelar en la base de datos
      expect(repositorio.cancelarReservaAtomica).not.toHaveBeenCalled();
    });

    it("Test 3 (Error / Autorización): lanza error si la reserva pertenece a otro adminId", async () => {
      (repositorio.obtenerReservaPorId as jest.Mock).mockResolvedValue({
        id: 12,
        administradorId: 1,
        estadoReserva: { id: 1, nombre: "Confirmada" },
      });

      await expect(cancelarReserva({ reservaId: 12, adminId: 2 })).rejects.toThrow(
        "No autorizado: la reserva no pertenece a este administrador"
      );

      expect(repositorio.cancelarReservaAtomica).not.toHaveBeenCalled();
    });
  });

  await expect(
    cancelarReserva({ reservaId: 12 })
  ).rejects.toThrow("La reserva ya está cancelada");

  // No intenta cancelar de nuevo en la base de datos
  expect(repositorio.cancelarReservaAtomica).not.toHaveBeenCalled();
});
  // ---------------------------------------------------------------------------
  // Comportamiento 2: validación del input con Zod (CancelarReservaInputSchema)
  // ---------------------------------------------------------------------------
  describe("validación de CancelarReservaInputSchema (Zod)", () => {
    it("Test 4 (Caso inválido): lanza error de validación si reservaId es negativo o no entero", async () => {
      await expect(cancelarReserva({ reservaId: -1 })).rejects.toThrow(z.ZodError);
      await expect(cancelarReserva({ reservaId: 1.5 })).rejects.toThrow(z.ZodError);

      // La validación falla antes de tocar el repositorio
      expect(repositorio.obtenerReservaPorId).not.toHaveBeenCalled();
      expect(repositorio.cancelarReservaAtomica).not.toHaveBeenCalled();
    });

    it("Test 5 (Caso borde / Opcional): permite procesar la cancelación sin enviar un motivo", async () => {
      (repositorio.obtenerReservaPorId as jest.Mock).mockResolvedValue({
        id: 10,
        administradorId: 1,
        estadoReserva: { id: 1, nombre: "Confirmada" },
      });
      (repositorio.obtenerEstadoPorNombre as jest.Mock).mockResolvedValue({
        id: 2,
        nombre: "Cancelada",
      });
      (repositorio.cancelarReservaAtomica as jest.Mock).mockResolvedValue(true);

      await expect(cancelarReserva({ reservaId: 10 })).resolves.toBeUndefined();

      // El campo motivo es opcional: se pasa undefined al repositorio
      expect(repositorio.cancelarReservaAtomica).toHaveBeenCalledWith(10, 2, undefined);
    });
  });
});
