import { prisma, cleanDB } from "../helpers";
import { completarReserva } from "../../src/services/completarReserva";

describe("completarReserva service", () => {
  beforeEach(async () => {
    await cleanDB();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("debería completar una reserva confirmada y cambiar su estado a Completada", async () => {
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
    await prisma.estadoReserva.create({ data: { nombre: "Completada" } });

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

    const resultado = await completarReserva({ reservaId: reserva.id });

    expect(resultado.estadoReserva.nombre).toBe("Completada");
    expect(resultado.nombreInvitado).toBe("Juan Pérez");
  });

  it("debería lanzar un error si la reserva no existe", async () => {
    await expect(
      completarReserva({ reservaId: 99999 })
    ).rejects.toThrow("Reserva no encontrada");
  });

  it("debería lanzar un error si la reserva está Cancelada", async () => {
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

    const estadoCancelada = await prisma.estadoReserva.create({
      data: { nombre: "Cancelada" },
    });

    const reserva = await prisma.reserva.create({
      data: {
        fechaHoraInicio: new Date(Date.now() + 86400000),
        duracion: 30,
        nombreInvitado: "Ana López",
        emailInvitado: "ana@email.com",
        tipoEventoId: tipoEvento.id,
        administradorId: admin.id,
        estadoReservaId: estadoCancelada.id,
      },
    });

    await expect(
      completarReserva({ reservaId: reserva.id })
    ).rejects.toThrow("Solo se pueden marcar como completadas las reservas en estado Confirmada");
  });

  it("debería lanzar un error si la reserva está PendienteDeConfirmacion", async () => {
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

    const estadoPendiente = await prisma.estadoReserva.create({
      data: { nombre: "PendienteDeConfirmacion" },
    });

    const reserva = await prisma.reserva.create({
      data: {
        fechaHoraInicio: new Date(Date.now() + 86400000),
        duracion: 30,
        nombreInvitado: "Pedro Gómez",
        emailInvitado: "pedro@email.com",
        tipoEventoId: tipoEvento.id,
        administradorId: admin.id,
        estadoReservaId: estadoPendiente.id,
      },
    });

    await expect(
      completarReserva({ reservaId: reserva.id })
    ).rejects.toThrow("Solo se pueden marcar como completadas las reservas en estado Confirmada");
  });

  it("debería lanzar un error si el ID no es válido", async () => {
    await expect(
      completarReserva({ reservaId: -1 })
    ).rejects.toThrow();
  });

  it("debería rechazar si adminId no coincide con el dueño de la reserva", async () => {
    const admin = await prisma.usuarioAdministrador.create({
      data: { email: "test@test.com", nombre: "Test Admin" },
    });
    const otroAdmin = await prisma.usuarioAdministrador.create({
      data: { email: "otro@test.com", nombre: "Otro Admin" },
    });

    const tipoEvento = await prisma.tipoEvento.create({
      data: { nombre: "Reunión", duracion: 30, antelacionMinima: 1, administradorId: admin.id },
    });

    const estado = await prisma.estadoReserva.create({ data: { nombre: "Confirmada" } });
    await prisma.estadoReserva.create({ data: { nombre: "Completada" } });

    const reserva = await prisma.reserva.create({
      data: {
        fechaHoraInicio: new Date(Date.now() + 86400000), duracion: 30,
        nombreInvitado: "Juan", emailInvitado: "juan@email.com",
        tipoEventoId: tipoEvento.id, administradorId: admin.id, estadoReservaId: estado.id,
      },
    });

    await expect(
      completarReserva({ reservaId: reserva.id, adminId: otroAdmin.id })
    ).rejects.toThrow("No autorizado");
  });

  it("debería permitir completar cuando adminId coincide con el dueño", async () => {
    const admin = await prisma.usuarioAdministrador.create({
      data: { email: "test@test.com", nombre: "Test Admin" },
    });

    const tipoEvento = await prisma.tipoEvento.create({
      data: { nombre: "Reunión", duracion: 30, antelacionMinima: 1, administradorId: admin.id },
    });

    const estado = await prisma.estadoReserva.create({ data: { nombre: "Confirmada" } });
    await prisma.estadoReserva.create({ data: { nombre: "Completada" } });

    const reserva = await prisma.reserva.create({
      data: {
        fechaHoraInicio: new Date(Date.now() + 86400000), duracion: 30,
        nombreInvitado: "Juan", emailInvitado: "juan@email.com",
        tipoEventoId: tipoEvento.id, administradorId: admin.id, estadoReservaId: estado.id,
      },
    });

    const resultado = await completarReserva({ reservaId: reserva.id, adminId: admin.id });
    expect(resultado.estadoReserva.nombre).toBe("Completada");
  });
});
