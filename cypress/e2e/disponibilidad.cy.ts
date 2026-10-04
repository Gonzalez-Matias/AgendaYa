// cypress/e2e/disponibilidad.cy.ts
// E2E de la API M04-RF02 (Consultar disponibilidad) — CasosDePrueba.md CP1 y CP2.
// Pasos según el documento: GET administradores -> GET tipos-evento -> POST disponibilidad.

const MARIA_EMAIL = "maria.garcia@agendaya.com";
const TIPO_REUNION = "Reunión";

interface Administrador {
  id: number;
  email: string;
  nombre: string;
}

interface TipoEvento {
  id: number;
  nombre: string;
}

interface Slot {
  inicio: string;
  fin: string;
}

interface DiaDisponible {
  fecha: string;
  slots: Slot[];
}

function proximoDia(diaSemana: number): Date {
  const ahora = new Date();
  let dias = diaSemana - ahora.getDay();
  if (dias <= 0) dias += 7;
  const resultado = new Date(ahora);
  resultado.setDate(ahora.getDate() + dias);
  resultado.setHours(0, 0, 0, 0);
  return resultado;
}

function diaEnDias(dia: Date, dias: number): Date {
  const resultado = new Date(dia);
  resultado.setDate(dia.getDate() + dias);
  return resultado;
}

function ymd(fecha: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${fecha.getFullYear()}-${pad(fecha.getMonth() + 1)}-${pad(fecha.getDate())}`;
}

function timestampLocal(fecha: Date, horas: number, minutos: number): string {
  const resultado = new Date(fecha);
  resultado.setHours(horas, minutos, 0, 0);
  return resultado.toISOString();
}

function horaLocal(iso: string): string {
  const fecha = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(fecha.getHours())}:${pad(fecha.getMinutes())}`;
}

function verificarSeparacion(slots: Slot[]): void {
  for (let i = 1; i < slots.length; i++) {
    const anterior = new Date(slots[i - 1].inicio).getTime();
    const actual = new Date(slots[i].inicio).getTime();
    expect(actual - anterior).to.eq(15 * 60 * 1000);
  }
}

function obtenerTipoReunion(): Cypress.Chainable<number> {
  return cy.request("GET", "/api/administradores").then((adminsRes) => {
    const administradores = (adminsRes.body as { administradores: Administrador[] })
      .administradores;
    const maria = administradores.find((a) => a.email === MARIA_EMAIL);
    if (!maria) {
      throw new Error(`No se encontró el administrador ${MARIA_EMAIL}`);
    }

    return cy.request("GET", `/api/administradores/${maria.id}/tipos-evento`).then((tiposRes) => {
      const tipos = (tiposRes.body as { tiposEvento: TipoEvento[] }).tiposEvento;
      const reunion = tipos.find((t) => t.nombre === TIPO_REUNION);
      if (!reunion) {
        throw new Error(`No se encontró el tipo de evento ${TIPO_REUNION}`);
      }
      return reunion.id;
    });
  });
}

describe("M04-RF02 - Consultar disponibilidad", () => {
  it("CP1: devuelve 2 y 6 slots para días con disponibilidad y bloqueos", () => {
    // Arrange: elegir el próximo lunes y martes, y sembrar la disponibilidad de
    // María (Lun/Mar 08:00–17:00) con los bloqueos definidos en el caso de prueba.
    const lunes = proximoDia(1);
    const martes = diaEnDias(lunes, 1);

    cy.task("seedDisponibilidadEscenario", {
      bloqueos: [
        {
          fechaInicio: timestampLocal(lunes, 8, 0),
          fechaFin: timestampLocal(lunes, 16, 15),
          motivo: "Bloqueo de prueba",
        },
        {
          fechaInicio: timestampLocal(martes, 8, 0),
          fechaFin: timestampLocal(martes, 15, 15),
          motivo: "Bloqueo de prueba",
        },
      ],
    });

    // Arrange: obtener el id del tipo de evento "Reunión" de María García.
    obtenerTipoReunion().then((tipoEventoId) => {
      // Act: consultar la disponibilidad para el rango lunes–martes.
      cy.request("POST", "/api/disponibilidad", {
        tipoEventoId,
        fechaDesde: ymd(lunes),
        fechaHasta: ymd(martes),
      }).then((res) => {
        // Assert: 200, dos días y la cantidad de slots esperada por día.
        expect(res.status).to.eq(200);

        const dias = res.body.data as DiaDisponible[];
        expect(dias).to.have.length(2);

        expect(new Date(dias[0].fecha).getDate()).to.eq(lunes.getDate());
        expect(new Date(dias[1].fecha).getDate()).to.eq(martes.getDate());

        expect(dias[0].slots).to.have.length(2);
        expect(dias[1].slots).to.have.length(6);

        // Assert: los slots están separados por 15 minutos.
        verificarSeparacion(dias[0].slots);
        verificarSeparacion(dias[1].slots);

        // Assert: los slots no coinciden con los períodos bloqueados.
        expect(horaLocal(dias[0].slots[0].inicio)).to.eq("16:15");
        expect(horaLocal(dias[0].slots[dias[0].slots.length - 1].fin)).to.eq("17:00");
        expect(horaLocal(dias[1].slots[0].inicio)).to.eq("15:15");
      });
    });
  });

  it("CP2: devuelve slots vacíos para sábado y domingo", () => {
    // Arrange: sin bloqueos y eligiendo el próximo sábado y domingo (días sin
    // disponibilidad semanal configurada para María).
    cy.task("seedDisponibilidadEscenario", { bloqueos: [] });

    const sabado = proximoDia(6);
    const domingo = diaEnDias(sabado, 1);

    // Arrange: obtener el id del tipo de evento "Reunión" de María García.
    obtenerTipoReunion().then((tipoEventoId) => {
      // Act: consultar la disponibilidad para sábado y domingo.
      cy.request("POST", "/api/disponibilidad", {
        tipoEventoId,
        fechaDesde: ymd(sabado),
        fechaHasta: ymd(domingo),
      }).then((res) => {
        // Assert: 200, dos días y ambos con la lista de slots vacía.
        expect(res.status).to.eq(200);

        const dias = res.body.data as DiaDisponible[];
        expect(dias).to.have.length(2);
        expect(new Date(dias[0].fecha).getDate()).to.eq(sabado.getDate());
        expect(new Date(dias[1].fecha).getDate()).to.eq(domingo.getDate());
        expect(dias[0].slots).to.have.length(0);
        expect(dias[1].slots).to.have.length(0);
      });
    });
  });
});
