import { z } from "zod";
import { prisma, cleanDB } from "../helpers";
import { obtenerReservasPorRango } from "../../src/services/visualizacion";

// Feature: filtros de la agenda por estado / tipo de evento (M05).
// Cubre los caminos felices y la validación Zod de los filtros.
describe("obtenerReservasPorRango (filtros de la agenda)", () => {
  beforeEach(async () => {
    await cleanDB();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  async function crearEscenario() {
    const admin = await prisma.usuarioAdministrador.create({
      data: { email: "filtros@test.com", nombre: "Admin Filtros" },
    });
    const tipoReunion = await prisma.tipoEvento.create({
      data: { nombre: "Reunión", duracion: 30, antelacionMinima: 1, administradorId: admin.id },
    });
    const tipoConsulta = await prisma.tipoEvento.create({
      data: { nombre: "Consulta", duracion: 60, antelacionMinima: 1, administradorId: admin.id },
    });
    const confirmada = await prisma.estadoReserva.create({ data: { nombre: "Confirmada" } });
    const pendiente = await prisma.estadoReserva.create({
      data: { nombre: "PendienteDeConfirmacion" },
    });

    const manana = new Date();
    manana.setDate(manana.getDate() + 1);
    const aLas = (hora: number) => {
      const d = new Date(manana);
      d.setHours(hora, 0, 0, 0);
      return d;
    };

    await prisma.reserva.create({
      data: {
        fechaHoraInicio: aLas(9),
        duracion: 30,
        nombreInvitado: "Confirmada Reunión",
        emailInvitado: "a@email.com",
        tipoEventoId: tipoReunion.id,
        administradorId: admin.id,
        estadoReservaId: confirmada.id,
      },
    });
    await prisma.reserva.create({
      data: {
        fechaHoraInicio: aLas(10),
        duracion: 30,
        nombreInvitado: "Pendiente Reunión",
        emailInvitado: "b@email.com",
        tipoEventoId: tipoReunion.id,
        administradorId: admin.id,
        estadoReservaId: pendiente.id,
      },
    });
    await prisma.reserva.create({
      data: {
        fechaHoraInicio: aLas(11),
        duracion: 60,
        nombreInvitado: "Confirmada Consulta",
        emailInvitado: "c@email.com",
        tipoEventoId: tipoConsulta.id,
        administradorId: admin.id,
        estadoReservaId: confirmada.id,
      },
    });

    const desde = new Date();
    const hasta = new Date(manana);
    hasta.setDate(hasta.getDate() + 1);
    return { admin, tipoReunion, desde, hasta };
  }

  it("Test 1 (Happy path): sin filtros devuelve todas las reservas del rango", async () => {
    const { admin, desde, hasta } = await crearEscenario();

    const resultado = await obtenerReservasPorRango(admin.id, desde, hasta);

    expect(resultado).toHaveLength(3);
  });

  it("Test 2 (Happy path): filtra por estado", async () => {
    const { admin, desde, hasta } = await crearEscenario();

    const resultado = await obtenerReservasPorRango(admin.id, desde, hasta, {
      estado: "Confirmada",
    });

    expect(resultado).toHaveLength(2);
    expect(resultado.every((r) => r.estado === "Confirmada")).toBe(true);
  });

  it("Test 3 (Happy path): filtra por tipo de evento", async () => {
    const { admin, tipoReunion, desde, hasta } = await crearEscenario();

    const resultado = await obtenerReservasPorRango(admin.id, desde, hasta, {
      tipoEventoId: tipoReunion.id,
    });

    expect(resultado).toHaveLength(2);
    expect(resultado.every((r) => r.tipoEvento === "Reunión")).toBe(true);
  });

  it("Test 4 (Caso borde): un estado sin coincidencias devuelve una lista vacía", async () => {
    const { admin, desde, hasta } = await crearEscenario();

    const resultado = await obtenerReservasPorRango(admin.id, desde, hasta, {
      estado: "Cancelada",
    });

    expect(resultado).toHaveLength(0);
  });

  it("Test 5 (Validación): rechaza filtros inválidos con ZodError", async () => {
    const { admin, desde, hasta } = await crearEscenario();

    await expect(
      obtenerReservasPorRango(admin.id, desde, hasta, { estado: 123 as unknown as string })
    ).rejects.toThrow(z.ZodError);

    await expect(
      obtenerReservasPorRango(admin.id, desde, hasta, { tipoEventoId: 0 })
    ).rejects.toThrow(z.ZodError);
  });
});
