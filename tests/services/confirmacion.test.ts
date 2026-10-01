import { confirmarReserva, obtenerMensajeExito } from "../../src/services/confirmacion";
import {
    findReservaById,
    confirmarReservaEnTransaccion,
} from "../../src/repositories/confirmarReserva";
import { findEstadoByNombre } from "../../src/repositories/reserva";

// Simulamos los accesos a la base de datos (Mocks) para pruebas puramente unitarias
jest.mock("../../src/repositories/confirmarReserva");
jest.mock("../../src/repositories/reserva");

const mockFindReservaById =
    findReservaById as jest.MockedFunction<typeof findReservaById>;

const mockConfirmarReservaEnTransaccion =
    confirmarReservaEnTransaccion as jest.MockedFunction<
        typeof confirmarReservaEnTransaccion
    >;

const mockFindEstadoByNombre =
    findEstadoByNombre as jest.MockedFunction<typeof findEstadoByNombre>;

describe("US_018 - Confirmación Manual de Reservas (Pruebas Unitarias)", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    // TEST 1: Caso de éxito (Happy Path)
    test(
        "1. Caso de éxito: Debe confirmar la reserva correctamente si está 'PendienteDeConfirmacion'",
        async () => {
            mockFindReservaById.mockResolvedValue({
                id: 1,
                administradorId: 10,
                estadoReserva: {
                    nombre: "PendienteDeConfirmacion",
                },
            } as any);

            mockFindEstadoByNombre.mockResolvedValue({
                id: 2,
                nombre: "Confirmada",
            } as any);

            mockConfirmarReservaEnTransaccion.mockResolvedValue({
                id: 1,
                estadoReservaId: 2,
            } as any);

            const resultado = await confirmarReserva({
                reservaId: 1,
                adminId: 10,
            });

            expect(mockFindReservaById).toHaveBeenCalledWith(1);
            expect(mockFindEstadoByNombre).toHaveBeenCalledWith("Confirmada");
            expect(mockConfirmarReservaEnTransaccion).toHaveBeenCalledWith(
                1,
                2
            );

            expect(resultado).toEqual({
                id: 1,
                estadoReservaId: 2,
            });
        }
    );

    // TEST 2: Reserva no encontrada
    test(
        "2. Reserva no encontrada: Debe lanzar un error si el ID de la reserva no existe",
        async () => {
            mockFindReservaById.mockResolvedValue(null);

            await expect(
                confirmarReserva({
                    reservaId: 999,
                })
            ).rejects.toThrow("Reserva no encontrada");
        }
    );

    // TEST 3: Reserva ya confirmada
    test(
        "3. Reserva ya confirmada: Debe lanzar un error si el estado actual es 'Confirmada'",
        async () => {
            mockFindReservaById.mockResolvedValue({
                id: 1,
                administradorId: 10,
                estadoReserva: {
                    nombre: "Confirmada",
                },
            } as any);

            await expect(
                confirmarReserva({
                    reservaId: 1,
                })
            ).rejects.toThrow("La reserva ya está confirmada");
        }
    );

    // TEST 4: Reserva cancelada
    test(
        "4. Reserva cancelada: Debe impedir confirmar una reserva que fue 'Cancelada'",
        async () => {
            mockFindReservaById.mockResolvedValue({
                id: 1,
                administradorId: 10,
                estadoReserva: {
                    nombre: "Cancelada",
                },
            } as any);

            await expect(
                confirmarReserva({
                    reservaId: 1,
                })
            ).rejects.toThrow("No se puede confirmar una reserva cancelada");
        }
    );

    // TEST 5: Mensaje de realimentación para la UI
    test(
        "5. Realimentación informativa: Debe retornar el mensaje de éxito esperado para el Administrador",
        () => {
            const mensaje = obtenerMensajeExito();

            expect(mensaje).toBe("Reserva confirmada correctamente");
        }
    );
});