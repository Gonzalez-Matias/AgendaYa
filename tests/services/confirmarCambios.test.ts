// tests/services/confirmarCambios.test.ts
// M05-RF01 / US_010 "Confirmar cambios" - Casos de prueba del TP5
// CP-US010-001 (positivo) y CP-US010-002 (negativo: solapamiento de turnos)

import { prisma, cleanDB } from "../helpers";
import prismaRepo from "../../src/repositories/db";
import {
  reagendarReserva,
  ReagendarError,
} from "../../src/services/reagendarReserva";

describe("M05-RF01 / US_010 - Confirmar cambios", () => {
  beforeEach(async () => {
    await cleanDB();
  });

  afterAll(async () => {
    await prisma.$disconnect();
    await prismaRepo.$disconnect();
  });

  async function crearAdminConTipoEvento(email: string, duracion: number) {
    const admin = await prisma.usuarioAdministrador.create({
      data: { email, nombre: "Admin Test" },
    });

    const tipoEvento = await prisma.tipoEvento.create({
      data: {
        nombre: "Consulta",
        duracion,
        confirmacion: "MANUAL",
        antelacionMinima: 2,
        administradorId: admin.id,
      },
    });

    return { admin, tipoEvento };
  }

  it("CP-US010-001: debería confirmar el cambio y pasar la reserva a Confirmada creando el historial con marca de tiempo", async () => {
    const estadoPendiente = await prisma.estadoReserva.create({
      data: { nombre: "PendienteDeConfirmacion" },
    });
    const estadoConfirmada = await prisma.estadoReserva.create({
      data: { nombre: "Confirmada" },
    });

    const { admin, tipoEvento } = await crearAdminConTipoEvento(
      "admin@agendaya.com",
      60
    );

    // resv_001: 25/06/2026 10:00, en estado "Pendiente de confirmación manual"
    const reserva = await prisma.reserva.create({
      data: {
        fechaHoraInicio: new Date("2026-06-25T10:00:00Z"),
        duracion: 60,
        nombreInvitado: "Juan Pérez",
        emailInvitado: "juan@agendaya.com",
        tipoEventoId: tipoEvento.id,
        administradorId: admin.id,
        estadoReservaId: estadoPendiente.id,
      },
    });

    // Nuevos datos a inyectar: 26/06/2026 15:00 (horario sin solapamientos)
    const nuevaFecha = new Date("2026-06-26T15:00:00Z");
    const antesDeConfirmar = new Date();

    const resultado = await reagendarReserva({
      reservaId: reserva.id,
      nuevaFechaHoraInicio: nuevaFecha,
      adminId: admin.id,
    });

    // El sistema confirma la actualización y responde con mensaje de éxito
    expect(resultado.mensaje).toBe("¡La reserva se re-agendó con éxito!");
    expect(resultado.reserva.fechaHoraInicio.toISOString()).toBe(
      nuevaFecha.toISOString()
    );
    expect(resultado.reserva.estadoReserva.nombre).toBe("Confirmada");

    // La reserva persistida queda "Confirmada" con la nueva fecha y hora
    const reservaPersistida = await prisma.reserva.findUniqueOrThrow({
      where: { id: reserva.id },
      include: { estadoReserva: true },
    });
    expect(reservaPersistida.estadoReserva.nombre).toBe("Confirmada");
    expect(reservaPersistida.fechaHoraInicio.toISOString()).toBe(
      nuevaFecha.toISOString()
    );

    // Se crea un nuevo registro de historial con estado "Confirmada" y marca de tiempo
    const historial = await prisma.reservaEstadoHistorial.findMany({
      where: { reservaId: reserva.id },
    });
    expect(historial).toHaveLength(1);
    expect(historial[0].estadoReservaId).toBe(estadoConfirmada.id);
    expect(historial[0].fechaCambio).toBeInstanceOf(Date);
    expect(historial[0].fechaCambio.getTime()).toBeGreaterThanOrEqual(
      antesDeConfirmar.getTime()
    );
    expect(historial[0].fechaCambio.getTime()).toBeLessThanOrEqual(Date.now());
  });

  it("CP-US010-002: debería rechazar el cambio por solapamiento manteniendo fecha, hora y estado originales", async () => {
    const estadoPendiente = await prisma.estadoReserva.create({
      data: { nombre: "PendienteDeConfirmacion" },
    });
    const estadoConfirmada = await prisma.estadoReserva.create({
      data: { nombre: "Confirmada" },
    });

    const { admin, tipoEvento } = await crearAdminConTipoEvento(
      "admin@agendaya.com",
      60
    );

    // resv_002: reserva obstáculo, 26/06/2026 15:00 en estado "Confirmada"
    const reservaObstaculo = await prisma.reserva.create({
      data: {
        fechaHoraInicio: new Date("2026-06-26T15:00:00Z"),
        duracion: 60,
        nombreInvitado: "María López",
        emailInvitado: "maria@agendaya.com",
        tipoEventoId: tipoEvento.id,
        administradorId: admin.id,
        estadoReservaId: estadoConfirmada.id,
      },
    });

    // resv_001: 25/06/2026 10:00, en estado "Pendiente de confirmación manual"
    const reservaAReagendar = await prisma.reserva.create({
      data: {
        fechaHoraInicio: new Date("2026-06-25T10:00:00Z"),
        duracion: 60,
        nombreInvitado: "Juan Pérez",
        emailInvitado: "juan@agendaya.com",
        tipoEventoId: tipoEvento.id,
        administradorId: admin.id,
        estadoReservaId: estadoPendiente.id,
      },
    });
    const fechaOriginal = reservaAReagendar.fechaHoraInicio;

    // Intento de mover resv_001 al mismo horario ocupado por resv_002
    let errorLanzado: unknown;
    try {
      await reagendarReserva({
        reservaId: reservaAReagendar.id,
        nuevaFechaHoraInicio: new Date("2026-06-26T15:00:00Z"),
      });
    } catch (error) {
      errorLanzado = error;
    }

    // El sistema aborta con un error de negocio explícito
    expect(errorLanzado).toBeInstanceOf(ReagendarError);
    expect((errorLanzado as Error).message).toBe(
      "El nuevo horario elegido ya está ocupado"
    );

    // resv_001 conserva fecha/hora original y estado: no libera el turno anterior
    const reservaPersistida = await prisma.reserva.findUniqueOrThrow({
      where: { id: reservaAReagendar.id },
      include: { estadoReserva: true },
    });
    expect(reservaPersistida.fechaHoraInicio.toISOString()).toBe(
      fechaOriginal.toISOString()
    );
    expect(reservaPersistida.estadoReserva.nombre).toBe(
      "PendienteDeConfirmacion"
    );
    expect(reservaPersistida.estadoReservaId).toBe(estadoPendiente.id);

    // La transacción aborta sin escrituras parciales: no hay historial nuevo
    const historial = await prisma.reservaEstadoHistorial.findMany({
      where: { reservaId: reservaAReagendar.id },
    });
    expect(historial).toHaveLength(0);

    // La reserva obstáculo permanece intacta
    const obstaculoPersistido = await prisma.reserva.findUniqueOrThrow({
      where: { id: reservaObstaculo.id },
      include: { estadoReserva: true },
    });
    expect(obstaculoPersistido.estadoReserva.nombre).toBe("Confirmada");
    expect(obstaculoPersistido.fechaHoraInicio.toISOString()).toBe(
      "2026-06-26T15:00:00.000Z"
    );
  });
});
