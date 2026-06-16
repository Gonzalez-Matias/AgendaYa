import { prisma, cleanDB } from "../helpers";
import { cancelarReserva } from "../../src/services/cancelarReserva";

describe("cancelarReserva", () => {
  beforeEach(async () => {
    await cleanDB();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("debería cancelar una reserva confirmada y cambiar su estado a Cancelada", async () => {
    // Preparar datos
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

    await prisma.estadoReserva.create({ data: { nombre: "Cancelada" } });

    const reserva = await prisma.reserva.create({
      data: {
        fechaHoraInicio: new Date(Date.now() + 1000 * 60 * 60 * 24),
        duracion: 30,
        nombreInvitado: "Juan Pérez",
        emailInvitado: "juan@email.com",
        tipoEventoId: tipoEvento.id,
        administradorId: admin.id,
        estadoReservaId: estadoConfirmada.id,
      },
    });

    // Ejecutar
    await cancelarReserva({ reservaId: reserva.id, motivo: "El cliente no puede asistir" });

    // Verificar
    const reservaActualizada = await prisma.reserva.findUnique({
      where: { id: reserva.id },
      include: { estadoReserva: true },
    });

    expect(reservaActualizada?.estadoReserva.nombre).toBe("Cancelada");
  });

  it("debería lanzar un error si se intenta cancelar una reserva que ya está cancelada", async () => {
    // Preparar datos
    const admin = await prisma.usuarioAdministrador.create({
      data: { email: "test2@test.com", nombre: "Test Admin 2" },
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
        fechaHoraInicio: new Date(Date.now() + 1000 * 60 * 60 * 24),
        duracion: 60,
        nombreInvitado: "Laura Silva",
        emailInvitado: "laura@email.com",
        tipoEventoId: tipoEvento.id,
        administradorId: admin.id,
        estadoReservaId: estadoCancelada.id,
      },
    });

    // Verificar que lanza error
    await expect(
      cancelarReserva({ reservaId: reserva.id, motivo: "Intento duplicado" })
    ).rejects.toThrow("La reserva ya está cancelada");
  });

  it("debería lanzar un error si la reserva no existe", async () => {
    await expect(
      cancelarReserva({ reservaId: 99999, motivo: "No existe" })
    ).rejects.toThrow("Reserva no encontrada");
  });
});