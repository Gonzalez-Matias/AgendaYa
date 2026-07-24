import { obtenerMensajeExito } from "../../src/services/confirmacion";

describe("US_018 - Confirmación Manual de Reservas", () => {
  test("Debe retornar el mensaje de éxito esperado por el Administrador", () => {
    expect(obtenerMensajeExito()).toBe("Reserva confirmada correctamente");
  });
});
