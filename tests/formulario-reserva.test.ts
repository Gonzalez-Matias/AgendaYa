// tests/formulario-reserva.test.ts
// Tests unitarios — M04-RF04 y M04-RF05
// Autor: Andrés Lorenzo Mortensen

import {
  validarEmail,
  validarNombre,
  determinarEstadoReserva,
  TipoEvento,
} from "../src/services/formulario-reserva";

describe("M04-RF04 y M04-RF05 - Formulario y confirmación de reserva", () => {

  // TEST 1: Email inválido debe fallar
  test("Email con formato inválido debe retornar false", () => {
    expect(validarEmail("usuario@")).toBe(false);
    expect(validarEmail("sinArroba")).toBe(false);
    expect(validarEmail("")).toBe(false);
  });

  // TEST 2: Email válido debe pasar
  test("Email con formato válido debe retornar true", () => {
    expect(validarEmail("nombre@dominio.com")).toBe(true);
    expect(validarEmail("andy@gmail.com")).toBe(true);
  });

  // TEST 3: Nombre vacío o solo espacios debe fallar
  test("Nombre vacío o solo espacios debe retornar false", () => {
    expect(validarNombre("")).toBe(false);
    expect(validarNombre("   ")).toBe(false);
  });

  // TEST 4: Confirmación automática → estado "Confirmada"
  test("Reserva con tipo de evento de confirmación automática debe tener estado Confirmada", () => {
    const tipoEvento: TipoEvento = {
      id: "1",
      nombre: "Consulta rápida",
      confirmacionAutomatica: true,
    };
    expect(determinarEstadoReserva(tipoEvento)).toBe("Confirmada");
  });

  // TEST 5: Confirmación manual → estado "Pendiente"
  test("Reserva con tipo de evento de confirmación manual debe tener estado Pendiente", () => {
    const tipoEvento: TipoEvento = {
      id: "2",
      nombre: "Reunión estratégica",
      confirmacionAutomatica: false,
    };
    expect(determinarEstadoReserva(tipoEvento)).toBe("Pendiente");
  });

});