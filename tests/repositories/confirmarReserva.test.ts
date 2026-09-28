import { prisma, cleanDB } from "../helpers";
import {
  findReservaById,
  confirmarReservaEnTransaccion,
} from "../../src/repositories/confirmarReserva";

describe("confirmarReserva repository", () => {
  beforeEach(async () => {
    await cleanDB();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe("findReservaById", () => {
    it("debería retornar una reserva por ID con su estado y tipo de evento", async () => {
      const admin = await prisma.usuarioAdministrador.create({
        data: { email: "test@test.com", nombre: "Test Admin" },
      });

      const tipoEvento = await prisma.tipoEvento.create({
        data: {
          nombre: "Consulta",
          duracion: 60,
          antelacionMinima: 1,
          confirmacion: "MANUAL",
          administradorId: admin.id,
        },
      });

      const estado = await prisma.estadoReserva.create({
        data: { nombre: "PendienteDeConfirmacion" },
      });

      const reserva = await prisma.reserva.create({
        data: {
          fechaHoraInicio: new Date(Date.now() + 86400000),
          duracion: 60,
          nombreInvitado: "María López",
          emailInvitado: "maria@email.com",
          tipoEventoId: tipoEvento.id,
          administradorId: admin.id,
          estadoReservaId: estado.id,
        },
      });

      const resultado = await findReservaById(reserva.id);

      expect(resultado).not.toBeNull();
      expect(resultado?.nombreInvitado).toBe("María López");
      expect(resultado?.estadoReserva.nombre).toBe("PendienteDeConfirmacion");
      expect(resultado?.tipoEvento.nombre).toBe("Consulta");
    });

    it("debería retornar null si la reserva no existe", async () => {
      const resultado = await findReservaById(99999);
      expect(resultado).toBeNull();
    });
  });

  describe("confirmarReservaEnTransaccion", () => {
    it("debería cambiar el estado de la reserva a Confirmada", async () => {
      const admin = await prisma.usuarioAdministrador.create({
        data: { email: "test@test.com", nombre: "Test Admin" },
      });

      const tipoEvento = await prisma.tipoEvento.create({
        data: {
          nombre: "Consulta",
          duracion: 60,
          antelacionMinima: 1,
          administradorId: admin.id,
        },
      });

      const estadoPendiente = await prisma.estadoReserva.create({
        data: { nombre: "PendienteDeConfirmacion" },
      });
      const estadoConfirmada = await prisma.estadoReserva.create({
        data: { nombre: "Confirmada" },
      });

      const reserva = await prisma.reserva.create({
        data: {
          fechaHoraInicio: new Date(Date.now() + 86400000),
          duracion: 60,
          nombreInvitado: "María López",
          emailInvitado: "maria@email.com",
          tipoEventoId: tipoEvento.id,
          administradorId: admin.id,
          estadoReservaId: estadoPendiente.id,
        },
      });

      const resultado = await confirmarReservaEnTransaccion(reserva.id, estadoConfirmada.id);

      expect(resultado.estadoReserva.nombre).toBe("Confirmada");
    });

    it("debería crear un registro en el historial", async () => {
      const admin = await prisma.usuarioAdministrador.create({
        data: { email: "test@test.com", nombre: "Test Admin" },
      });

      const tipoEvento = await prisma.tipoEvento.create({
        data: {
          nombre: "Consulta",
          duracion: 60,
          antelacionMinima: 1,
          administradorId: admin.id,
        },
      });

      const estadoPendiente = await prisma.estadoReserva.create({
        data: { nombre: "PendienteDeConfirmacion" },
      });
      const estadoConfirmada = await prisma.estadoReserva.create({
        data: { nombre: "Confirmada" },
      });

      const reserva = await prisma.reserva.create({
        data: {
          fechaHoraInicio: new Date(Date.now() + 86400000),
          duracion: 60,
          nombreInvitado: "María López",
          emailInvitado: "maria@email.com",
          tipoEventoId: tipoEvento.id,
          administradorId: admin.id,
          estadoReservaId: estadoPendiente.id,
        },
      });

      await confirmarReservaEnTransaccion(reserva.id, estadoConfirmada.id);

      const historial = await prisma.reservaEstadoHistorial.findMany({
        where: { reservaId: reserva.id },
      });

      expect(historial).toHaveLength(1);
      expect(historial[0].estadoReservaId).toBe(estadoConfirmada.id);
    });
  });
});
