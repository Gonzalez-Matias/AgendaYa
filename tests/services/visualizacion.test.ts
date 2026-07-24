// tests/visualizacion.test.ts
// Tests para M05-RF06: Seleccionar modo de visualización de agenda

import {
  getModoVistaDefault,
  cambiarModoVista,
} from "../../src/services/visualizacion";

describe("M05-RF06 - Modo de visualización de agenda", () => {
  test("La vista por defecto al ingresar a la sección debe ser calendario", () => {
    const vistaDefault = getModoVistaDefault();
    expect(vistaDefault).toBe("calendario");
  });

  test("Al cambiar el modo de vista a lista, el sistema debe retornar el modo lista", () => {
    const nuevaVista = cambiarModoVista("calendario", "lista");
    expect(nuevaVista).toBe("lista");
  });

  test("Al cambiar el modo de vista a calendario, el sistema debe retornar el modo calendario", () => {
    const nuevaVista = cambiarModoVista("lista", "calendario");
    expect(nuevaVista).toBe("calendario");
  });

  test("Se puede mantener la vista actual sin cambios", () => {
    const nuevaVista = cambiarModoVista("calendario", "calendario");
    expect(nuevaVista).toBe("calendario");
  });
});
