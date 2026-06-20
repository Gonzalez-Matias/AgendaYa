import { confirmarReserva, obtenerMensajeExito, ReservaConfirmacion } from "../../src/services/confirmacion";

const reservasMock: ReservaConfirmacion[] = [
    { id: "101", invitado: "Carlos Gómez", fecha: "2026-07-10", hora: "15:00", estado: "Pendiente de Confirmación" },
    { id: "102", invitado: "Ana Soler", fecha: "2026-07-11", hora: "10:00", estado: "Pendiente de Confirmación" }
];

describe("US_018 - Confirmación Manual de Reservas", () => {
    // Test 1: Cubre Escenario 1 (Cambio de estado)
    test("Debe cambiar el estado de la reserva de 'Pendiente' a 'Confirmada'", () => {
        const resultado = confirmarReserva("101", reservasMock);
        expect(resultado?.estado).toBe("Confirmada");
    });

    // Test 2: Cubre Escenario 2 (Consistencia de datos)
    test("Debe mantener los datos del invitado intactos tras la confirmación", () => {
        const resultado = confirmarReserva("102", reservasMock);
        expect(resultado?.invitado).toBe("Ana Soler");
        expect(resultado?.fecha).toBe("2026-07-11");
    });

    // Test 3: Cubre Escenario 1 (Realimentación informativa)
    test("Debe retornar el mensaje de éxito esperado por el Administrador", () => {
        expect(obtenerMensajeExito()).toBe("Reserva confirmada correctamente");
    });
});