import { prisma, cleanDB } from "../helpers";
import prismaRepo from "../../src/repositories/db";
import {
  createReservaConHistorial,
  findReservasActivasEnRango,
} from "../../src/repositories/reserva";

describe("reserva repository", () => {
  beforeEach(async () => {
    await cleanDB();
  });

  afterAll(async () => {
    await prisma.$disconnect();
    await prismaRepo.$disconnect();
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

  async function crearReservaEnRango(
    adminId: number,
    tipoEventoId: number,
    estadoReservaId: number,
    fechaHoraInicio: Date
  ) {
    return prisma.reserva.create({
      data: {
        fechaHoraInicio,
        duracion: 30,
        nombreInvitado: "Invitado Test",
        emailInvitado: "invitado@test.com",
        tipoEventoId,
        administradorId: adminId,
        estadoReservaId,
      },
    });
  }

  describe("findReservasActivasEnRango", () => {
    it("debería retornar solo las reservas activas del rango, excluyendo canceladas y la reserva en curso", async () => {
      const { estados, admin, tipoEvento } = await crearBase();
      const desde = new Date("2026-08-01T00:00:00Z");
      const hasta = new Date("2026-08-08T00:00:00Z");

      // Activa dentro del rango: única esperada.
      await crearReservaEnRango(
        admin.id,
        tipoEvento.id,
        estados.Confirmada,
        new Date("2026-08-03T14:00:00Z")
      );
      // Cancelada dentro del rango: fuera del filtro de estados.
      await crearReservaEnRango(
        admin.id,
        tipoEvento.id,
        estados.Cancelada,
        new Date("2026-08-04T14:00:00Z")
      );
      // Completada dentro del rango: también fuera del filtro de estados.
      await crearReservaEnRango(
        admin.id,
        tipoEvento.id,
        estados.Completada,
        new Date("2026-08-05T14:00:00Z")
      );
      // Activa fuera del rango.
      await crearReservaEnRango(
        admin.id,
        tipoEvento.id,
        estados.Confirmada,
        new Date("2026-08-10T14:00:00Z")
      );
      // Reserva que se está re-agendando: excluida por excludeReservaId.
      const reservada = await crearReservaEnRango(
        admin.id,
        tipoEvento.id,
        estados.Confirmada,
        new Date("2026-08-06T14:00:00Z")
      );

      const resultado = await findReservasActivasEnRango(admin.id, reservada.id, desde, hasta);

      expect(resultado).toHaveLength(1);
      expect(resultado[0].fechaHoraInicio).toEqual(new Date("2026-08-03T14:00:00Z"));
      expect(resultado[0].duracion).toBe(30);
    });
  });

  describe("createReservaConHistorial", () => {
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
});
