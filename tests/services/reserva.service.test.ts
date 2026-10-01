import { prisma, cleanDB } from "../helpers";
import prismaRepo from "../../src/repositories/db";
import { reagendarReserva, ReagendarError } from "../../src/services/reserva.service";

describe("reagendarReserva", () => {
  beforeEach(async () => {
    await cleanDB();
  });

  afterAll(async () => {
    await prisma.$disconnect();
    await prismaRepo.$disconnect();
  });

  it("debería reagendar y cambiar estado a Confirmada cuando la reserva está PendienteDeReagendar", async () => {
    const estadoReagendar = await prisma.estadoReserva.create({
      data: { nombre: "PendienteDeReagendar" },
    });
    const estadoConfirmada = await prisma.estadoReserva.create({
      data: { nombre: "Confirmada" },
    });

    const admin = await prisma.usuarioAdministrador.create({
      data: { email: "admin@test.com", nombre: "Admin Test" },
    });

    const tipoEvento = await prisma.tipoEvento.create({
      data: {
        nombre: "Consulta",
        duracion: 60,
        confirmacion: "MANUAL",
        antelacionMinima: 2,
        administradorId: admin.id,
      },
    });

    const reserva = await prisma.reserva.create({
      data: {
        fechaHoraInicio: new Date("2026-08-01T10:00:00Z"),
        duracion: 60,
        nombreInvitado: "Juan Pérez",
        emailInvitado: "juan@test.com",
        tipoEventoId: tipoEvento.id,
        administradorId: admin.id,
        estadoReservaId: estadoReagendar.id,
      },
    });

    const nuevaFecha = new Date("2026-08-01T14:00:00Z");

    const resultado = await reagendarReserva({
      reservaId: reserva.id,
      nuevaFechaHoraInicio: nuevaFecha,
    });

    expect(resultado.mensaje).toBe("¡La reserva se re-agendó con éxito!");
    expect(resultado.reserva.fechaHoraInicio.toISOString()).toBe(nuevaFecha.toISOString());
    expect(resultado.reserva.estadoReserva.nombre).toBe("Confirmada");

    const historial = await prisma.reservaEstadoHistorial.findMany({
      where: { reservaId: reserva.id },
    });
    expect(historial).toHaveLength(1);
    expect(historial[0].estadoReservaId).toBe(estadoConfirmada.id);
    expect(historial[0].motivo).toBe("Reagendada por administrador");
  });

  it("debería lanzar error si la reserva no existe", async () => {
    await expect(
      reagendarReserva({
        reservaId: 9999,
        nuevaFechaHoraInicio: new Date("2026-08-01T14:00:00Z"),
      })
    ).rejects.toThrow(ReagendarError);
  });

  it("debería lanzar error si el nuevo horario se superpone con una reserva existente", async () => {
    const estadoConfirmada = await prisma.estadoReserva.create({
      data: { nombre: "Confirmada" },
    });
    const estadoReagendar = await prisma.estadoReserva.create({
      data: { nombre: "PendienteDeReagendar" },
    });

    const admin = await prisma.usuarioAdministrador.create({
      data: { email: "admin@test.com", nombre: "Admin Test" },
    });

    const tipoEvento = await prisma.tipoEvento.create({
      data: {
        nombre: "Consulta",
        duracion: 60,
        confirmacion: "MANUAL",
        antelacionMinima: 2,
        administradorId: admin.id,
      },
    });

    await prisma.reserva.create({
      data: {
        fechaHoraInicio: new Date("2026-08-01T14:00:00Z"),
        duracion: 60,
        nombreInvitado: "María López",
        emailInvitado: "maria@test.com",
        tipoEventoId: tipoEvento.id,
        administradorId: admin.id,
        estadoReservaId: estadoConfirmada.id,
      },
    });

    const reservaAReagendar = await prisma.reserva.create({
      data: {
        fechaHoraInicio: new Date("2026-08-01T10:00:00Z"),
        duracion: 60,
        nombreInvitado: "Juan Pérez",
        emailInvitado: "juan@test.com",
        tipoEventoId: tipoEvento.id,
        administradorId: admin.id,
        estadoReservaId: estadoReagendar.id,
      },
    });

    await expect(
      reagendarReserva({
        reservaId: reservaAReagendar.id,
        nuevaFechaHoraInicio: new Date("2026-08-01T14:00:00Z"),
      })
    ).rejects.toThrow(ReagendarError);
  });

  it("debería reagendar correctamente incluso si la reserva ya estaba Confirmada", async () => {
    const estadoConfirmada = await prisma.estadoReserva.create({
      data: { nombre: "Confirmada" },
    });

    const admin = await prisma.usuarioAdministrador.create({
      data: { email: "admin@test.com", nombre: "Admin Test" },
    });

    const tipoEvento = await prisma.tipoEvento.create({
      data: {
        nombre: "Reunión",
        duracion: 30,
        confirmacion: "AUTOMATICA",
        antelacionMinima: 1,
        administradorId: admin.id,
      },
    });

    const reserva = await prisma.reserva.create({
      data: {
        fechaHoraInicio: new Date("2026-08-01T09:00:00Z"),
        duracion: 30,
        nombreInvitado: "Ana Gómez",
        emailInvitado: "ana@test.com",
        tipoEventoId: tipoEvento.id,
        administradorId: admin.id,
        estadoReservaId: estadoConfirmada.id,
      },
    });

    const nuevaFecha = new Date("2026-08-01T16:00:00Z");

    const resultado = await reagendarReserva({
      reservaId: reserva.id,
      nuevaFechaHoraInicio: nuevaFecha,
      motivo: "El cliente solicitó cambio",
    });

    expect(resultado.reserva.estadoReserva.nombre).toBe("Confirmada");
    expect(resultado.reserva.fechaHoraInicio.toISOString()).toBe(nuevaFecha.toISOString());

    const historial = await prisma.reservaEstadoHistorial.findMany({
      where: { reservaId: reserva.id },
    });
    expect(historial[0].motivo).toBe("El cliente solicitó cambio");
  });
});
