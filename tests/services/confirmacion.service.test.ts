import { prisma, cleanDB } from "../helpers";
import { confirmarReserva } from "../../src/services/confirmacion";

describe("confirmarReserva service", () => {
  beforeEach(async () => {
    await cleanDB();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("debería confirmar una reserva pendiente de confirmación", async () => {
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

    const estadoPendiente = await prisma.estadoReserva.create({
      data: { nombre: "PendienteDeConfirmacion" },
    });
    await prisma.estadoReserva.create({ data: { nombre: "Confirmada" } });

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

    const resultado = await confirmarReserva({ reservaId: reserva.id });

    expect(resultado.estadoReserva.nombre).toBe("Confirmada");
    expect(resultado.nombreInvitado).toBe("María López");
  });

  it("debería lanzar un error si la reserva no existe", async () => {
    await expect(
      confirmarReserva({ reservaId: 99999 })
    ).rejects.toThrow("Reserva no encontrada");
  });

  it("debería lanzar un error si la reserva ya está confirmada", async () => {
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

    const estadoConfirmada = await prisma.estadoReserva.create({
      data: { nombre: "Confirmada" },
    });

    const reserva = await prisma.reserva.create({
      data: {
        fechaHoraInicio: new Date(Date.now() + 86400000),
        duracion: 60,
        nombreInvitado: "Pedro Gómez",
        emailInvitado: "pedro@email.com",
        tipoEventoId: tipoEvento.id,
        administradorId: admin.id,
        estadoReservaId: estadoConfirmada.id,
      },
    });

    await expect(
      confirmarReserva({ reservaId: reserva.id })
    ).rejects.toThrow("La reserva ya está confirmada");
  });

  it("debería lanzar un error si la reserva está cancelada", async () => {
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

    const estadoCancelada = await prisma.estadoReserva.create({
      data: { nombre: "Cancelada" },
    });

    const reserva = await prisma.reserva.create({
      data: {
        fechaHoraInicio: new Date(Date.now() + 86400000),
        duracion: 60,
        nombreInvitado: "Ana López",
        emailInvitado: "ana@email.com",
        tipoEventoId: tipoEvento.id,
        administradorId: admin.id,
        estadoReservaId: estadoCancelada.id,
      },
    });

    await expect(
      confirmarReserva({ reservaId: reserva.id })
    ).rejects.toThrow("No se puede confirmar una reserva cancelada");
  });

  it("debería lanzar un error si la reserva está completada", async () => {
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

    const estadoCompletada = await prisma.estadoReserva.create({
      data: { nombre: "Completada" },
    });

    const reserva = await prisma.reserva.create({
      data: {
        fechaHoraInicio: new Date(Date.now() + 86400000),
        duracion: 60,
        nombreInvitado: "Carlos Ruiz",
        emailInvitado: "carlos@email.com",
        tipoEventoId: tipoEvento.id,
        administradorId: admin.id,
        estadoReservaId: estadoCompletada.id,
      },
    });

    await expect(
      confirmarReserva({ reservaId: reserva.id })
    ).rejects.toThrow("No se puede confirmar una reserva completada");
  });

  it("debería rechazar si adminId no coincide con el dueño", async () => {
    const admin = await prisma.usuarioAdministrador.create({
      data: { email: "test@test.com", nombre: "Test Admin" },
    });
    const otroAdmin = await prisma.usuarioAdministrador.create({
      data: { email: "otro@test.com", nombre: "Otro Admin" },
    });
    const tipoEvento = await prisma.tipoEvento.create({
      data: { nombre: "Consulta", duracion: 60, antelacionMinima: 1, administradorId: admin.id },
    });
    const estadoPendiente = await prisma.estadoReserva.create({ data: { nombre: "PendienteDeConfirmacion" } });

    const reserva = await prisma.reserva.create({
      data: {
        fechaHoraInicio: new Date(Date.now() + 86400000), duracion: 60,
        nombreInvitado: "María", emailInvitado: "maria@email.com",
        tipoEventoId: tipoEvento.id, administradorId: admin.id, estadoReservaId: estadoPendiente.id,
      },
    });

    await expect(
      confirmarReserva({ reservaId: reserva.id, adminId: otroAdmin.id })
    ).rejects.toThrow("No autorizado");
  });

  it("debería permitir confirmar cuando adminId coincide con el dueño", async () => {
    const admin = await prisma.usuarioAdministrador.create({
      data: { email: "test@test.com", nombre: "Test Admin" },
    });
    const tipoEvento = await prisma.tipoEvento.create({
      data: { nombre: "Consulta", duracion: 60, antelacionMinima: 1, administradorId: admin.id },
    });
    const estadoPendiente = await prisma.estadoReserva.create({ data: { nombre: "PendienteDeConfirmacion" } });
    await prisma.estadoReserva.create({ data: { nombre: "Confirmada" } });

    const reserva = await prisma.reserva.create({
      data: {
        fechaHoraInicio: new Date(Date.now() + 86400000), duracion: 60,
        nombreInvitado: "María", emailInvitado: "maria@email.com",
        tipoEventoId: tipoEvento.id, administradorId: admin.id, estadoReservaId: estadoPendiente.id,
      },
    });

    const resultado = await confirmarReserva({ reservaId: reserva.id, adminId: admin.id });
    expect(resultado.estadoReserva.nombre).toBe("Confirmada");
  });
});
