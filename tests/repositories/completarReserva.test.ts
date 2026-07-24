import { prisma, cleanDB } from "../helpers";
import {
  findReservaById,
  findEstadoByNombre,
  completarReservaEnTransaccion,
} from "../../src/repositories/completarReserva";

describe("completarReserva repository", () => {
  beforeEach(async () => {
    await cleanDB();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe("findReservaById", () => {
    it("debería retornar una reserva por ID con su estado", async () => {
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

      const reserva = await prisma.reserva.create({
        data: {
          fechaHoraInicio: new Date(Date.now() + 86400000),
          duracion: 30,
          nombreInvitado: "Juan Pérez",
          emailInvitado: "juan@email.com",
          tipoEventoId: tipoEvento.id,
          administradorId: admin.id,
          estadoReservaId: estado.id,
        },
      });

      const resultado = await findReservaById(reserva.id);

      expect(resultado).not.toBeNull();
      expect(resultado?.nombreInvitado).toBe("Juan Pérez");
      expect(resultado?.estadoReserva.nombre).toBe("Confirmada");
    });

    it("debería retornar null si la reserva no existe", async () => {
      const resultado = await findReservaById(99999);
      expect(resultado).toBeNull();
    });
  });

  describe("findEstadoByNombre", () => {
    it("debería retornar un estado por nombre", async () => {
      await prisma.estadoReserva.create({ data: { nombre: "Completada" } });

      const resultado = await findEstadoByNombre("Completada");

      expect(resultado).not.toBeNull();
      expect(resultado?.nombre).toBe("Completada");
    });

    it("debería retornar null si el estado no existe", async () => {
      const resultado = await findEstadoByNombre("Inexistente");
      expect(resultado).toBeNull();
    });
  });

  describe("completarReservaEnTransaccion", () => {
    it("debería cambiar el estado de la reserva a Completada", async () => {
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
      const estadoCompletada = await prisma.estadoReserva.create({
        data: { nombre: "Completada" },
      });

      const reserva = await prisma.reserva.create({
        data: {
          fechaHoraInicio: new Date(Date.now() + 86400000),
          duracion: 30,
          nombreInvitado: "Juan Pérez",
          emailInvitado: "juan@email.com",
          tipoEventoId: tipoEvento.id,
          administradorId: admin.id,
          estadoReservaId: estadoConfirmada.id,
        },
      });

      const resultado = await completarReservaEnTransaccion(reserva.id, estadoCompletada.id);

      expect(resultado.estadoReserva.nombre).toBe("Completada");
    });

    it("debería crear un registro en el historial", async () => {
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
      const estadoCompletada = await prisma.estadoReserva.create({
        data: { nombre: "Completada" },
      });

      const reserva = await prisma.reserva.create({
        data: {
          fechaHoraInicio: new Date(Date.now() + 86400000),
          duracion: 30,
          nombreInvitado: "Juan Pérez",
          emailInvitado: "juan@email.com",
          tipoEventoId: tipoEvento.id,
          administradorId: admin.id,
          estadoReservaId: estadoConfirmada.id,
        },
      });

      await completarReservaEnTransaccion(reserva.id, estadoCompletada.id);

      const historial = await prisma.reservaEstadoHistorial.findMany({
        where: { reservaId: reserva.id },
      });

      expect(historial).toHaveLength(1);
      expect(historial[0].estadoReservaId).toBe(estadoCompletada.id);
    });
  });
});
