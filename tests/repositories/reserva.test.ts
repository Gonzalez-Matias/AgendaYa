import { prisma, cleanDB } from "../helpers";
import prismaRepo from "../../src/repositories/db";
import { createReservaConHistorial, findReservasActivasEnRango } from "../../src/repositories/reserva";

describe("findReservasActivasEnRango (repositorio)", () => {
  beforeEach(async () => {
    await cleanDB();
  });

  async function crearAdmin(email: string) {
    return prisma.usuarioAdministrador.create({
      data: { email, nombre: "Admin Test" },
    });
  }

  async function crearTipoEvento(administradorId: number) {
    return prisma.tipoEvento.create({
      data: { nombre: "Consulta", duracion: 60, antelacionMinima: 2, administradorId },
    });
  }

  async function crearReserva(params: {
    fechaHoraInicio: Date;
    tipoEventoId: number;
    administradorId: number;
    estadoReservaId: number;
  }) {
    return prisma.reserva.create({
      data: {
        fechaHoraInicio: params.fechaHoraInicio,
        duracion: 60,
        nombreInvitado: "Invitado Test",
        emailInvitado: "invitado@test.com",
        tipoEventoId: params.tipoEventoId,
        administradorId: params.administradorId,
        estadoReservaId: params.estadoReservaId,
      },
    });
  }

  it("debería devolver solo las reservas en estados activos y descartar Cancelada y Completada", async () => {
    const admin = await crearAdmin("admin-activos@test.com");
    const tipoEvento = await crearTipoEvento(admin.id);

    const confirmada = await prisma.estadoReserva.create({ data: { nombre: "Confirmada" } });
    const pendienteConfirmacion = await prisma.estadoReserva.create({
      data: { nombre: "PendienteDeConfirmacion" },
    });
    const pendienteReagendar = await prisma.estadoReserva.create({
      data: { nombre: "PendienteDeReagendar" },
    });
    const cancelada = await prisma.estadoReserva.create({ data: { nombre: "Cancelada" } });
    const completada = await prisma.estadoReserva.create({ data: { nombre: "Completada" } });

    const desde = new Date("2026-08-01T08:00:00Z");
    const hasta = new Date("2026-08-01T18:00:00Z");
    const activas = [
      new Date("2026-08-01T09:00:00Z"),
      new Date("2026-08-01T10:00:00Z"),
      new Date("2026-08-01T11:00:00Z"),
    ];

    await crearReserva({
      fechaHoraInicio: activas[0],
      tipoEventoId: tipoEvento.id,
      administradorId: admin.id,
      estadoReservaId: confirmada.id,
    });
    await crearReserva({
      fechaHoraInicio: activas[1],
      tipoEventoId: tipoEvento.id,
      administradorId: admin.id,
      estadoReservaId: pendienteConfirmacion.id,
    });
    await crearReserva({
      fechaHoraInicio: activas[2],
      tipoEventoId: tipoEvento.id,
      administradorId: admin.id,
      estadoReservaId: pendienteReagendar.id,
    });
    await crearReserva({
      fechaHoraInicio: new Date("2026-08-01T12:00:00Z"),
      tipoEventoId: tipoEvento.id,
      administradorId: admin.id,
      estadoReservaId: cancelada.id,
    });
    await crearReserva({
      fechaHoraInicio: new Date("2026-08-01T13:00:00Z"),
      tipoEventoId: tipoEvento.id,
      administradorId: admin.id,
      estadoReservaId: completada.id,
    });

    const resultado = await findReservasActivasEnRango(admin.id, -1, desde, hasta);

    expect(resultado).toHaveLength(3);
    expect(resultado.map((r) => r.fechaHoraInicio.toISOString()).sort()).toEqual(
      activas.map((d) => d.toISOString()).sort()
    );
  });

  it("debería excluir la reserva indicada en excludeReservaId (auto-exclusión)", async () => {
    const admin = await crearAdmin("admin-exclusion@test.com");
    const tipoEvento = await crearTipoEvento(admin.id);
    const confirmada = await prisma.estadoReserva.create({ data: { nombre: "Confirmada" } });

    const desde = new Date("2026-08-01T08:00:00Z");
    const hasta = new Date("2026-08-01T18:00:00Z");

    const primera = await crearReserva({
      fechaHoraInicio: new Date("2026-08-01T09:00:00Z"),
      tipoEventoId: tipoEvento.id,
      administradorId: admin.id,
      estadoReservaId: confirmada.id,
    });
    await crearReserva({
      fechaHoraInicio: new Date("2026-08-01T10:00:00Z"),
      tipoEventoId: tipoEvento.id,
      administradorId: admin.id,
      estadoReservaId: confirmada.id,
    });

    const resultado = await findReservasActivasEnRango(admin.id, primera.id, desde, hasta);

    expect(resultado).toHaveLength(1);
    expect(resultado[0].fechaHoraInicio.toISOString()).toBe("2026-08-01T10:00:00.000Z");
  });

  it("debería devolver únicamente las reservas del administrador indicado", async () => {
    const admin1 = await crearAdmin("admin-1@test.com");
    const admin2 = await crearAdmin("admin-2@test.com");
    const tipo1 = await crearTipoEvento(admin1.id);
    const tipo2 = await crearTipoEvento(admin2.id);
    const confirmada = await prisma.estadoReserva.create({ data: { nombre: "Confirmada" } });

    const desde = new Date("2026-08-01T08:00:00Z");
    const hasta = new Date("2026-08-01T18:00:00Z");

    await crearReserva({
      fechaHoraInicio: new Date("2026-08-01T09:00:00Z"),
      tipoEventoId: tipo1.id,
      administradorId: admin1.id,
      estadoReservaId: confirmada.id,
    });
    await crearReserva({
      fechaHoraInicio: new Date("2026-08-01T10:00:00Z"),
      tipoEventoId: tipo2.id,
      administradorId: admin2.id,
      estadoReservaId: confirmada.id,
    });

    const resultado = await findReservasActivasEnRango(admin1.id, -1, desde, hasta);

    expect(resultado).toHaveLength(1);
    expect(resultado[0].fechaHoraInicio.toISOString()).toBe("2026-08-01T09:00:00.000Z");
  });

  it("debería incluir el extremo inferior (gte) y excluir el extremo superior (lt) del rango", async () => {
    const admin = await crearAdmin("admin-borde@test.com");
    const tipoEvento = await crearTipoEvento(admin.id);
    const confirmada = await prisma.estadoReserva.create({ data: { nombre: "Confirmada" } });

    const desde = new Date("2026-08-01T08:00:00Z");
    const hasta = new Date("2026-08-01T12:00:00Z");

    await crearReserva({
      fechaHoraInicio: new Date("2026-07-31T23:00:00Z"),
      tipoEventoId: tipoEvento.id,
      administradorId: admin.id,
      estadoReservaId: confirmada.id,
    }); // antes
    await crearReserva({
      fechaHoraInicio: new Date("2026-08-01T08:00:00Z"),
      tipoEventoId: tipoEvento.id,
      administradorId: admin.id,
      estadoReservaId: confirmada.id,
    }); // == desde -> incluida
    await crearReserva({
      fechaHoraInicio: new Date("2026-08-01T12:00:00Z"),
      tipoEventoId: tipoEvento.id,
      administradorId: admin.id,
      estadoReservaId: confirmada.id,
    }); // == hasta -> excluida
    await crearReserva({
      fechaHoraInicio: new Date("2026-08-01T13:00:00Z"),
      tipoEventoId: tipoEvento.id,
      administradorId: admin.id,
      estadoReservaId: confirmada.id,
    }); // después

    const resultado = await findReservasActivasEnRango(admin.id, -1, desde, hasta);

    expect(resultado).toHaveLength(1);
    expect(resultado[0].fechaHoraInicio.toISOString()).toBe(desde.toISOString());
  });
});

describe("createReservaConHistorial (repositorio)", () => {
  beforeEach(async () => {
    await cleanDB();
  });

  /** Base mínima: estados + administrador + tipo de evento. */
  async function crearBase() {
    const estados: Record<string, number> = {};
    for (const nombre of ["Confirmada", "PendienteDeConfirmacion", "Cancelada", "Completada"]) {
      const estado = await prisma.estadoReserva.create({ data: { nombre } });
      estados[nombre] = estado.id;
    }
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
    return { estados, admin, tipoEvento };
  }

  it("debería crear la reserva y su registro de historial en la misma transacción", async () => {
    const { estados, admin, tipoEvento } = await crearBase();

    const reserva = await createReservaConHistorial(
      {
        fechaHoraInicio: new Date("2026-08-03T10:00:00Z"),
        duracion: 30,
        nombreInvitado: "Juan Pérez",
        emailInvitado: "juan@test.com",
        tipoEventoId: tipoEvento.id,
        administradorId: admin.id,
      },
      estados.Confirmada,
      "Reserva creada"
    );

    expect(reserva.estadoReserva.nombre).toBe("Confirmada");
    expect(reserva.tipoEvento.nombre).toBe("Reunión");
    expect(reserva.administrador.email).toBe("admin@test.com");

    const historial = await prisma.reservaEstadoHistorial.findMany({
      where: { reservaId: reserva.id },
    });
    expect(historial).toHaveLength(1);
    expect(historial[0].estadoReservaId).toBe(estados.Confirmada);
    expect(historial[0].motivo).toBe("Reserva creada");

    const guardada = await prisma.reserva.findUnique({ where: { id: reserva.id } });
    expect(guardada?.estadoReservaId).toBe(estados.Confirmada);
  });
});

afterAll(async () => {
  await prisma.$disconnect();
  await prismaRepo.$disconnect();
});
