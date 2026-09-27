import { prisma, cleanDB } from "../helpers";
import {
  getModoVistaDefault,
  cambiarModoVista,
  obtenerReservasPorRango,
  paginarReservas,
  formatearFecha,
  obtenerRangoSemanal,
  obtenerRangoMensual,
} from "../../src/services/visualizacion";

describe("visualizacion service", () => {
  beforeEach(async () => {
    await cleanDB();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe("getModoVistaDefault", () => {
    it("debería retornar 'calendario' como modo por defecto", () => {
      expect(getModoVistaDefault()).toBe("calendario");
    });
  });

  describe("cambiarModoVista", () => {
    it("debería cambiar de calendario a lista", () => {
      expect(cambiarModoVista("calendario", "lista")).toBe("lista");
    });

    it("debería cambiar de lista a calendario", () => {
      expect(cambiarModoVista("lista", "calendario")).toBe("calendario");
    });

    it("debería permitir seleccionar la misma vista actual", () => {
      expect(cambiarModoVista("calendario", "calendario")).toBe("calendario");
    });
  });

  describe("formatearFecha", () => {
    it("debería formatear una fecha como DD/MM/YYYY", () => {
      const fecha = new Date(2026, 0, 15); // 15 de enero de 2026
      expect(formatearFecha(fecha)).toBe("15/01/2026");
    });

    it("debería agregar ceros a la izquierda cuando sea necesario", () => {
      const fecha = new Date(2026, 2, 5); // 5 de marzo de 2026
      expect(formatearFecha(fecha)).toBe("05/03/2026");
    });
  });

  describe("obtenerRangoSemanal", () => {
    it("debería retornar lunes a domingo de la semana que contiene la fecha", () => {
      const miércoles = new Date(2026, 6, 22); // 22 de julio 2026 (miércoles)
      const rango = obtenerRangoSemanal(miércoles);

      expect(rango.desde.getDay()).toBe(1); // Lunes
      expect(rango.hasta.getDay()).toBe(0); // Domingo
    });

    it("debería incluir la fecha dada dentro del rango", () => {
      const fecha = new Date(2026, 6, 22); // miércoles
      const rango = obtenerRangoSemanal(fecha);

      expect(fecha.getTime()).toBeGreaterThanOrEqual(rango.desde.getTime());
      expect(fecha.getTime()).toBeLessThanOrEqual(rango.hasta.getTime());
    });
  });

  describe("obtenerRangoMensual", () => {
    it("debería retornar el primer y último día del mes que contiene la fecha", () => {
      const fecha = new Date(2026, 6, 15); // 15 de julio 2026
      const rango = obtenerRangoMensual(fecha);

      expect(rango.desde.getDate()).toBe(1);
      expect(rango.hasta.getDate()).toBe(31); // Julio tiene 31 días
    });
  });

  describe("paginarReservas", () => {
    it("debería retornar solo las reservas de la página solicitada", () => {
      const reservas = Array.from({ length: 15 }, (_, i) => ({
        id: i + 1,
        nombreInvitado: `Invitado ${i}`,
      })) as any[];

      const pagina1 = paginarReservas(reservas, 1, 10);
      const pagina2 = paginarReservas(reservas, 2, 10);

      expect(pagina1).toHaveLength(10);
      expect(pagina2).toHaveLength(5);
    });

    it("debería retornar array vacío si la página no existe", () => {
      const reservas = Array.from({ length: 5 }, (_, i) => ({
        id: i + 1,
      })) as any[];

      const resultado = paginarReservas(reservas, 3, 10);

      expect(resultado).toHaveLength(0);
    });
  });

  describe("obtenerReservasPorRango", () => {
    it("debería retornar reservas formateadas para un administrador en un rango", async () => {
      const admin = await prisma.usuarioAdministrador.create({
        data: { email: "test@test.com", nombre: "Test Admin" },
      });

      const tipoEvento = await prisma.tipoEvento.create({
        data: {
          nombre: "Reunión",
          duracion: 30,
          antelacionMinima: 1,
          administradorId: admin.id,
        },
      });

      const estado = await prisma.estadoReserva.create({
        data: { nombre: "Confirmada" },
      });

      const mañana = new Date();
      mañana.setDate(mañana.getDate() + 1);
      mañana.setHours(10, 0, 0, 0);

      await prisma.reserva.create({
        data: {
          fechaHoraInicio: mañana,
          duracion: 30,
          nombreInvitado: "Juan Pérez",
          emailInvitado: "juan@email.com",
          tipoEventoId: tipoEvento.id,
          administradorId: admin.id,
          estadoReservaId: estado.id,
        },
      });

      const hoy = new Date();
      const pasadoMañana = new Date(mañana);
      pasadoMañana.setDate(pasadoMañana.getDate() + 1);

      const resultado = await obtenerReservasPorRango(admin.id, hoy, pasadoMañana);

      expect(resultado).toHaveLength(1);
      expect(resultado[0].nombreInvitado).toBe("Juan Pérez");
      expect(resultado[0].estado).toBe("Confirmada");
      expect(resultado[0].tipoEvento).toBe("Reunión");
    });

    it("debería retornar array vacío si no hay reservas en el rango", async () => {
      const admin = await prisma.usuarioAdministrador.create({
        data: { email: "test@test.com", nombre: "Test Admin" },
      });

      const hoy = new Date();
      const mañana = new Date(hoy);
      mañana.setDate(mañana.getDate() + 1);

      const resultado = await obtenerReservasPorRango(admin.id, hoy, mañana);

      expect(resultado).toHaveLength(0);
    });

    it("debería mapear estados correctamente", async () => {
      const admin = await prisma.usuarioAdministrador.create({
        data: { email: "test@test.com", nombre: "Test Admin" },
      });

      const tipoEvento = await prisma.tipoEvento.create({
        data: {
          nombre: "Reunión",
          duracion: 30,
          antelacionMinima: 1,
          administradorId: admin.id,
        },
      });

      const estadoConfirmada = await prisma.estadoReserva.create({
        data: { nombre: "Confirmada" },
      });
      const estadoPendiente = await prisma.estadoReserva.create({
        data: { nombre: "PendienteDeConfirmacion" },
      });
      const estadoCancelada = await prisma.estadoReserva.create({
        data: { nombre: "Cancelada" },
      });

      const hoy = new Date();
      const mañana = new Date(hoy);
      mañana.setDate(mañana.getDate() + 1);

      const f1 = new Date(mañana); f1.setHours(9, 0, 0, 0);
      const f2 = new Date(mañana); f2.setHours(10, 0, 0, 0);
      const f3 = new Date(mañana); f3.setHours(11, 0, 0, 0);

      await prisma.reserva.create({
        data: {
          fechaHoraInicio: f1, duracion: 30, nombreInvitado: "R1",
          emailInvitado: "r1@email.com", tipoEventoId: tipoEvento.id,
          administradorId: admin.id, estadoReservaId: estadoConfirmada.id,
        },
      });
      await prisma.reserva.create({
        data: {
          fechaHoraInicio: f2, duracion: 30, nombreInvitado: "R2",
          emailInvitado: "r2@email.com", tipoEventoId: tipoEvento.id,
          administradorId: admin.id, estadoReservaId: estadoPendiente.id,
        },
      });
      await prisma.reserva.create({
        data: {
          fechaHoraInicio: f3, duracion: 30, nombreInvitado: "R3",
          emailInvitado: "r3@email.com", tipoEventoId: tipoEvento.id,
          administradorId: admin.id, estadoReservaId: estadoCancelada.id,
        },
      });

      const resultado = await obtenerReservasPorRango(admin.id, hoy, new Date(mañana.getTime() + 86400000));

      expect(resultado).toHaveLength(3);
      expect(resultado.find(r => r.nombreInvitado === "R1")?.estado).toBe("Confirmada");
      expect(resultado.find(r => r.nombreInvitado === "R2")?.estado).toBe("PendienteDeConfirmacion");
      expect(resultado.find(r => r.nombreInvitado === "R3")?.estado).toBe("Cancelada");
    });
  });
});
