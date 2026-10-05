import { prisma, cleanDB } from "../helpers";
import prismaRepo from "../../src/repositories/db";
import { cancelarReservaAtomica } from "../../src/repositories/cancelarReserva";

describe("cancelarReserva repository", () => {
  beforeEach(async () => {
    await cleanDB();
  });

  afterAll(async () => {
    await prisma.$disconnect();
    await prismaRepo.$disconnect();
  });

  /** Base mínima: estados + administrador + tipo de evento + reserva en el estado indicado. */
  async function crearReserva(estadoReserva: string) {
    const estado = await prisma.estadoReserva.create({ data: { nombre: estadoReserva } });
    const estadoCancelada =
      estadoReserva === "Cancelada"
        ? estado
        : await prisma.estadoReserva.create({ data: { nombre: "Cancelada" } });
    const admin = await prisma.usuarioAdministrador.create({
      data: { email: "admin@test.com", nombre: "Admin Test" },
    });
    const tipoEvento = await prisma.tipoEvento.create({
      data: {
        nombre: "Reunión",
        duracion: 30,
        antelacionMinima: 1,
        administradorId: admin.id,
      },
    });
    const reserva = await prisma.reserva.create({
      data: {
        fechaHoraInicio: new Date("2026-08-01T10:00:00Z"),
        duracion: 30,
        nombreInvitado: "Juan Pérez",
        emailInvitado: "juan@test.com",
        tipoEventoId: tipoEvento.id,
        administradorId: admin.id,
        estadoReservaId: estado.id,
      },
    });
    return { estadoCancelada, reserva };
  }

  it("debería cancelar la reserva y registrar el motivo en el historial", async () => {
    const { estadoCancelada, reserva } = await crearReserva("Confirmada");

    const cancelada = await cancelarReservaAtomica(reserva.id, estadoCancelada.id, "Motivo X");

    expect(cancelada).toBe(true);

    const guardada = await prisma.reserva.findUnique({ where: { id: reserva.id } });
    expect(guardada?.estadoReservaId).toBe(estadoCancelada.id);

    const historial = await prisma.reservaEstadoHistorial.findMany({
      where: { reservaId: reserva.id },
    });
    expect(historial).toHaveLength(1);
    expect(historial[0].estadoReservaId).toBe(estadoCancelada.id);
    expect(historial[0].motivo).toBe("Motivo X");
  });

  it("no debería cancelar una reserva ya cancelada ni crear un segundo registro de historial", async () => {
    const { estadoCancelada, reserva } = await crearReserva("Cancelada");

    const cancelada = await cancelarReservaAtomica(
      reserva.id,
      estadoCancelada.id,
      "Segunda cancelación"
    );

    expect(cancelada).toBe(false);

    const guardada = await prisma.reserva.findUnique({ where: { id: reserva.id } });
    expect(guardada?.estadoReservaId).toBe(estadoCancelada.id);

    const historial = await prisma.reservaEstadoHistorial.findMany({
      where: { reservaId: reserva.id },
    });
    expect(historial).toHaveLength(0);
  });
});
