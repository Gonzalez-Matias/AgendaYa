// cypress/e2e/reserva-exitosa.cy.js
// E2E de API — M04 (Booking Público): reserva exitosa.
//
// La UI pública de booking todavía no existe, así que este flujo se valida a
// nivel API contra el endpoint de creación `POST /api/reservas` (M04-RF04/RF05):
// crea una reserva en un slot disponible y verifica que quede en estado
// "Confirmada" (el tipo de evento "Reunión" es de confirmación automática).

const MARIA_EMAIL = "maria.garcia@agendaya.com";
const TIPO_REUNION = "Reunión";

function proximoDia(diaSemana) {
  const ahora = new Date();
  let dias = diaSemana - ahora.getDay();
  if (dias <= 0) dias += 7;
  const resultado = new Date(ahora);
  resultado.setDate(ahora.getDate() + dias);
  resultado.setHours(0, 0, 0, 0);
  return resultado;
}

function ymd(fecha) {
  const pad = (n) => String(n).padStart(2, "0");
  return `${fecha.getFullYear()}-${pad(fecha.getMonth() + 1)}-${pad(fecha.getDate())}`;
}

function obtenerTipoReunion() {
  return cy.request("GET", "/api/administradores").then((adminsRes) => {
    const maria = adminsRes.body.administradores.find((a) => a.email === MARIA_EMAIL);
    if (!maria) {
      throw new Error(`No se encontró el administrador ${MARIA_EMAIL}`);
    }

    return cy.request("GET", `/api/administradores/${maria.id}/tipos-evento`).then((tiposRes) => {
      const reunion = tiposRes.body.tiposEvento.find((t) => t.nombre === TIPO_REUNION);
      if (!reunion) {
        throw new Error(`No se encontró el tipo de evento ${TIPO_REUNION}`);
      }
      return reunion.id;
    });
  });
}

describe("M04 - Booking Público - Reserva exitosa", () => {
  it("debería crear la reserva y responder con estado Confirmada", () => {
    // Arrange: disponibilidad determinista de María (lunes/martes, sin bloqueos).
    cy.task("seedDisponibilidadEscenario", { bloqueos: [] });

    const lunes = proximoDia(1);

    obtenerTipoReunion().then((tipoEventoId) => {
      cy.request("POST", "/api/disponibilidad", {
        tipoEventoId,
        fechaDesde: ymd(lunes),
        fechaHasta: ymd(lunes),
      }).then((dispRes) => {
        const dia = dispRes.body.data.find((d) => d.slots.length > 0);
        if (!dia) {
          throw new Error("No hay días con slots disponibles para reservar");
        }
        const slot = dia.slots[0].inicio;

        // Act: crear la reserva con los datos del invitado.
        cy.request("POST", "/api/reservas", {
          tipoEventoId,
          fechaHoraInicio: slot,
          nombreInvitado: "Andrés Mortensen",
          emailInvitado: "andres@ejemplo.com",
        }).then((res) => {
          // Assert: reserva creada y confirmada automáticamente.
          expect(res.status).to.eq(201);
          expect(res.body.success).to.eq(true);
          expect(res.body.data.estado).to.eq("Confirmada");
          expect(res.body.data.mensaje).to.contain("confirmada");
          expect(res.body.data.reserva.nombreInvitado).to.eq("Andrés Mortensen");

          cy.request("GET", `/api/reservas/${res.body.data.reserva.id}`).then((detalleRes) => {
            expect(detalleRes.status).to.eq(200);
          });
        });
      });
    });
  });
});
