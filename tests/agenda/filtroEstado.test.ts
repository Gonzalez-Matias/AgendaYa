// Regresión INC-0421 (M05): memoria del filtro de estado de la agenda.
// El cliente es dueño de la cookie; "Todos" debe limpiarla y el estado
// recordado debe poder leerse al recargar.

import {
  COOKIE_FILTRO_ESTADO,
  parsearFiltroEstadoGuardado,
  serializarCookieFiltroEstado,
} from "../../src/app/agenda/filtroEstado";

describe("filtroEstado (cookie de memoria del filtro de agenda)", () => {
  it("Test 1 (Happy path): lee un estado válido de la cookie", () => {
    const cookie = `${COOKIE_FILTRO_ESTADO}=Confirmada`;

    expect(parsearFiltroEstadoGuardado(cookie)).toBe("Confirmada");
  });

  it("Test 2 (Caso borde): sin cookie devuelve string vacío (Todos)", () => {
    expect(parsearFiltroEstadoGuardado("")).toBe("");
    expect(parsearFiltroEstadoGuardado("otra=cosa")).toBe("");
  });

  it("Test 3 (Caso borde): ignora cookies ajenas y espacios alrededor", () => {
    const cookie = `theme=dark; ${COOKIE_FILTRO_ESTADO}=PendienteDeConfirmacion; locale=es`;

    expect(parsearFiltroEstadoGuardado(cookie)).toBe("PendienteDeConfirmacion");
  });

  it("Test 4 (Validación): descarta un valor desconocido o corrupto", () => {
    expect(parsearFiltroEstadoGuardado(`${COOKIE_FILTRO_ESTADO}=Inventado`)).toBe("");
    expect(parsearFiltroEstadoGuardado(`${COOKIE_FILTRO_ESTADO}=`)).toBe("");
    expect(parsearFiltroEstadoGuardado(`${COOKIE_FILTRO_ESTADO}`)).toBe("");
  });

  it("Test 5 (Happy path): serializa la cookie con vencimiento al elegir un estado", () => {
    const serializada = serializarCookieFiltroEstado("Cancelada");

    expect(serializada).toContain(`${COOKIE_FILTRO_ESTADO}=Cancelada`);
    expect(serializada).toContain("path=/");
    expect(serializada).toMatch(/max-age=\d+/);
  });

  it("Test 6 (Regresión INC-0421): 'Todos' expira la cookie en lugar de conservarla", () => {
    const serializada = serializarCookieFiltroEstado("");

    expect(serializada).toContain(`${COOKIE_FILTRO_ESTADO}=`);
    expect(serializada).toContain("max-age=0");
  });
});
