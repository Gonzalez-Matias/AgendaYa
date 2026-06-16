// tests/visualizacion.test.ts
// Tests para M05-RF06: Seleccionar modo de visualización de agenda
// Autor: [Andrés Lorenzo Mortensen]

import {
  getModoVistaDefault,
  cambiarModoVista,
  obtenerDatosReservaEnVista,
} from "../src/services/visualizacion";

// Datos de prueba: reservas simuladas
const reservasMock = [
  {
    id: "1",
    fecha: "2026-06-20",
    horario: "10:00",
    invitado: "Juan Pérez",
    tipoEvento: "Consulta",
    estado: "Confirmada",
  },
  {
    id: "2",
    fecha: "2026-06-21",
    horario: "11:00",
    invitado: "María López",
    tipoEvento: "Reunión",
    estado: "Pendiente",
  },
];

// TEST 1: Vista por defecto es "calendario"
describe("M05-RF06 - Modo de visualización de agenda", () => {
  test("La vista por defecto al ingresar a la sección debe ser calendario", () => {
    const vistaDefault = getModoVistaDefault();
    expect(vistaDefault).toBe("calendario");
  });

  // TEST 2: Cambiar a vista de lista devuelve "lista"
  test("Al cambiar el modo de vista a lista, el sistema debe retornar el modo lista", () => {
    const nuevaVista = cambiarModoVista("calendario", "lista");
    expect(nuevaVista).toBe("lista");
  });

  // TEST 3: Los datos de una reserva son consistentes entre ambas vistas
  test("Los datos de una reserva deben ser idénticos en vista calendario y vista lista", () => {
    const reservaEnCalendario = obtenerDatosReservaEnVista(reservasMock, "1", "calendario");
    const reservaEnLista = obtenerDatosReservaEnVista(reservasMock, "1", "lista");

    expect(reservaEnCalendario).toEqual(reservaEnLista);
    expect(reservaEnCalendario?.fecha).toBe("2026-06-20");
    expect(reservaEnCalendario?.estado).toBe("Confirmada");
  });
});