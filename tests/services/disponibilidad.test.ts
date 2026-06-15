import { prisma, cleanDB } from "../helpers";
import { consultarDisponibilidad } from "../../src/services/disponibilidad";

function proximoDia(diaSemana: number): Date {
  const ahora = new Date();
  const actual = ahora.getUTCDay();
  let dias = diaSemana - actual;
  if (dias <= 0) dias += 7;
  const resultado = new Date(ahora);
  resultado.setUTCDate(ahora.getUTCDate() + dias);
  resultado.setUTCHours(0, 0, 0, 0);
  return resultado;
}

function diaEnDias(dia: Date, dias: number): Date {
  const resultado = new Date(dia);
  resultado.setUTCDate(dia.getUTCDate() + dias);
  return resultado;
}

describe("consultarDisponibilidad", () => {
  beforeEach(async () => {
    await cleanDB();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("debería devolver slots de 15min para un día con disponibilidad", async () => {
    const admin = await prisma.usuarioAdministrador.create({
      data: { email: "test@test.com", nombre: "Test" },
    });

    const tipoEvento = await prisma.tipoEvento.create({
      data: {
        nombre: "Reunión",
        duracion: 30,
        antelacionMinima: 1,
        administradorId: admin.id,
      },
    });

    await prisma.disponibilidadSemanal.createMany({
      data: [1, 2, 3, 4, 5].map((d) => ({
        diaSemana: d,
        horaInicio: 480,
        horaFin: 1020,
        administradorId: admin.id,
      })),
    });

    const martes = proximoDia(2);

    const resultado = await consultarDisponibilidad({
      tipoEventoId: tipoEvento.id,
      fechaDesde: martes,
      fechaHasta: martes,
    });

    expect(resultado).toHaveLength(1);
    expect(resultado[0].slots).toHaveLength(36);
    expect(resultado[0].slots[0].inicio.getUTCHours()).toBe(8);
    expect(resultado[0].slots[0].inicio.getUTCMinutes()).toBe(0);
    expect(resultado[0].slots[35].fin.getUTCHours()).toBe(17);
    expect(resultado[0].slots[35].fin.getUTCMinutes()).toBe(0);
  });

  it("debería generar slots con intervalos de 15min", async () => {
    const admin = await prisma.usuarioAdministrador.create({
      data: { email: "test@test.com", nombre: "Test" },
    });

    const tipoEvento = await prisma.tipoEvento.create({
      data: {
        nombre: "Reunión",
        duracion: 30,
        antelacionMinima: 1,
        administradorId: admin.id,
      },
    });

    await prisma.disponibilidadSemanal.createMany({
      data: [1, 2, 3, 4, 5].map((d) => ({
        diaSemana: d,
        horaInicio: 480,
        horaFin: 1020,
        administradorId: admin.id,
      })),
    });

    const martes = proximoDia(2);

    const resultado = await consultarDisponibilidad({
      tipoEventoId: tipoEvento.id,
      fechaDesde: martes,
      fechaHasta: martes,
    });

    const slots = resultado[0].slots;
    expect(slots[0].inicio.getUTCHours()).toBe(8);
    expect(slots[0].inicio.getUTCMinutes()).toBe(0);
    expect(slots[1].inicio.getUTCHours()).toBe(8);
    expect(slots[1].inicio.getUTCMinutes()).toBe(15);
    expect(slots[2].inicio.getUTCHours()).toBe(8);
    expect(slots[2].inicio.getUTCMinutes()).toBe(30);
    expect(slots[3].inicio.getUTCHours()).toBe(8);
    expect(slots[3].inicio.getUTCMinutes()).toBe(45);
    expect(slots[4].inicio.getUTCHours()).toBe(9);
    expect(slots[4].inicio.getUTCMinutes()).toBe(0);
  });

  it("debería excluir slots que se superponen con reservas existentes", async () => {
    const admin = await prisma.usuarioAdministrador.create({
      data: { email: "test@test.com", nombre: "Test" },
    });

    const tipoEvento = await prisma.tipoEvento.create({
      data: {
        nombre: "Reunión",
        duracion: 30,
        antelacionMinima: 1,
        administradorId: admin.id,
      },
    });

    await prisma.disponibilidadSemanal.createMany({
      data: [1, 2, 3, 4, 5].map((d) => ({
        diaSemana: d,
        horaInicio: 480,
        horaFin: 1020,
        administradorId: admin.id,
      })),
    });

    const martes = proximoDia(2);
    const reservaInicio = new Date(martes);
    reservaInicio.setUTCHours(10, 0, 0, 0);

    const estado = await prisma.estadoReserva.create({
      data: { nombre: "Confirmada" },
    });

    await prisma.reserva.create({
      data: {
        fechaHoraInicio: reservaInicio,
        duracion: 30,
        nombreInvitado: "Test",
        emailInvitado: "test@email.com",
        tipoEventoId: tipoEvento.id,
        administradorId: admin.id,
        estadoReservaId: estado.id,
      },
    });

    const resultado = await consultarDisponibilidad({
      tipoEventoId: tipoEvento.id,
      fechaDesde: martes,
      fechaHasta: martes,
    });

    const slots = resultado[0].slots;
    const horarios = slots.map(
      (s) => `${s.inicio.getUTCHours()}:${String(s.inicio.getUTCMinutes()).padStart(2, "0")}`
    );

    expect(horarios).not.toContain("10:00");
    expect(horarios).not.toContain("10:15");
    expect(horarios).toContain("9:45");
    expect(horarios).toContain("10:30");
  });

  it("debería excluir slots dentro de bloqueos de agenda", async () => {
    const admin = await prisma.usuarioAdministrador.create({
      data: { email: "test@test.com", nombre: "Test" },
    });

    const tipoEvento = await prisma.tipoEvento.create({
      data: {
        nombre: "Reunión",
        duracion: 30,
        antelacionMinima: 1,
        administradorId: admin.id,
      },
    });

    await prisma.disponibilidadSemanal.createMany({
      data: [1, 2, 3, 4, 5].map((d) => ({
        diaSemana: d,
        horaInicio: 480,
        horaFin: 1020,
        administradorId: admin.id,
      })),
    });

    const martes = proximoDia(2);
    const bloqueoInicio = new Date(martes);
    bloqueoInicio.setUTCHours(12, 0, 0, 0);
    const bloqueoFin = new Date(martes);
    bloqueoFin.setUTCHours(13, 0, 0, 0);

    await prisma.bloqueoAgenda.create({
      data: {
        fechaInicio: bloqueoInicio,
        fechaFin: bloqueoFin,
        motivo: "Almuerzo",
        administradorId: admin.id,
      },
    });

    const resultado = await consultarDisponibilidad({
      tipoEventoId: tipoEvento.id,
      fechaDesde: martes,
      fechaHasta: martes,
    });

    const slots = resultado[0].slots;
    const horarios = slots.map(
      (s) => `${s.inicio.getUTCHours()}:${String(s.inicio.getUTCMinutes()).padStart(2, "0")}`
    );

    expect(horarios).not.toContain("11:45");
    expect(horarios).not.toContain("12:00");
    expect(horarios).not.toContain("12:15");
    expect(horarios).not.toContain("12:30");
    expect(horarios).not.toContain("12:45");
    expect(horarios).toContain("11:30");
    expect(horarios).toContain("13:00");
  });

  it("debería respetar antelación mínima del tipo de evento", async () => {
    const admin = await prisma.usuarioAdministrador.create({
      data: { email: "test@test.com", nombre: "Test" },
    });

    const tipoEvento = await prisma.tipoEvento.create({
      data: {
        nombre: "Reunión",
        duracion: 30,
        antelacionMinima: 2,
        administradorId: admin.id,
      },
    });

    await prisma.disponibilidadSemanal.createMany({
      data: [1, 2, 3, 4, 5].map((d) => ({
        diaSemana: d,
        horaInicio: 480,
        horaFin: 1020,
        administradorId: admin.id,
      })),
    });

    const martes = proximoDia(2);

    const resultado = await consultarDisponibilidad({
      tipoEventoId: tipoEvento.id,
      fechaDesde: martes,
      fechaHasta: martes,
    });

    const slots = resultado[0].slots;
    const primeraHora = slots[0].inicio.getUTCHours();

    expect(primeraHora).toBeGreaterThanOrEqual(10);
  });

  it("debería devolver día con slots vacíos si no hay disponibilidad", async () => {
    const admin = await prisma.usuarioAdministrador.create({
      data: { email: "test@test.com", nombre: "Test" },
    });

    const tipoEvento = await prisma.tipoEvento.create({
      data: {
        nombre: "Reunión",
        duracion: 30,
        antelacionMinima: 1,
        administradorId: admin.id,
      },
    });

    const sabado = proximoDia(6);

    const resultado = await consultarDisponibilidad({
      tipoEventoId: tipoEvento.id,
      fechaDesde: sabado,
      fechaHasta: sabado,
    });

    expect(resultado).toHaveLength(1);
    expect(resultado[0].slots).toHaveLength(0);
  });

  it("debería devolver slots vacíos para días sin disponibilidad en período de varios días", async () => {
    const admin = await prisma.usuarioAdministrador.create({
      data: { email: "test@test.com", nombre: "Test" },
    });

    const tipoEvento = await prisma.tipoEvento.create({
      data: {
        nombre: "Reunión",
        duracion: 30,
        antelacionMinima: 1,
        administradorId: admin.id,
      },
    });

    await prisma.disponibilidadSemanal.createMany({
      data: [1, 2, 3, 4, 5].map((d) => ({
        diaSemana: d,
        horaInicio: 480,
        horaFin: 1020,
        administradorId: admin.id,
      })),
    });

    const sabado = proximoDia(6);
    const domingo = diaEnDias(sabado, 1);

    const resultado = await consultarDisponibilidad({
      tipoEventoId: tipoEvento.id,
      fechaDesde: sabado,
      fechaHasta: domingo,
    });

    expect(resultado).toHaveLength(2);
    expect(resultado[0].slots).toHaveLength(0);
    expect(resultado[1].slots).toHaveLength(0);
  });

  it("debería devolver slots vacíos si todo el período está ocupado", async () => {
    const admin = await prisma.usuarioAdministrador.create({
      data: { email: "test@test.com", nombre: "Test" },
    });

    const tipoEvento = await prisma.tipoEvento.create({
      data: {
        nombre: "Reunión",
        duracion: 30,
        antelacionMinima: 1,
        administradorId: admin.id,
      },
    });

    await prisma.disponibilidadSemanal.createMany({
      data: [1, 2, 3, 4, 5].map((d) => ({
        diaSemana: d,
        horaInicio: 480,
        horaFin: 1020,
        administradorId: admin.id,
      })),
    });

    const martes = proximoDia(2);
    const bloqueoInicio = new Date(martes);
    bloqueoInicio.setUTCHours(8, 0, 0, 0);
    const bloqueoFin = new Date(martes);
    bloqueoFin.setUTCHours(17, 0, 0, 0);

    await prisma.bloqueoAgenda.create({
      data: {
        fechaInicio: bloqueoInicio,
        fechaFin: bloqueoFin,
        motivo: "Día completo",
        administradorId: admin.id,
      },
    });

    const resultado = await consultarDisponibilidad({
      tipoEventoId: tipoEvento.id,
      fechaDesde: martes,
      fechaHasta: martes,
    });

    expect(resultado).toHaveLength(1);
    expect(resultado[0].slots).toHaveLength(0);
  });

  it("debería funcionar correctamente con período de varios días", async () => {
    const admin = await prisma.usuarioAdministrador.create({
      data: { email: "test@test.com", nombre: "Test" },
    });

    const tipoEvento = await prisma.tipoEvento.create({
      data: {
        nombre: "Reunión",
        duracion: 30,
        antelacionMinima: 1,
        administradorId: admin.id,
      },
    });

    await prisma.disponibilidadSemanal.createMany({
      data: [1, 2, 3, 4, 5].map((d) => ({
        diaSemana: d,
        horaInicio: 480,
        horaFin: 1020,
        administradorId: admin.id,
      })),
    });

    const lunes = proximoDia(1);
    const martes = diaEnDias(lunes, 1);
    const miercoles = diaEnDias(lunes, 2);

    const estado = await prisma.estadoReserva.create({
      data: { nombre: "Confirmada" },
    });

    const reservaInicio = new Date(lunes);
    reservaInicio.setUTCHours(10, 0, 0, 0);
    await prisma.reserva.create({
      data: {
        fechaHoraInicio: reservaInicio,
        duracion: 30,
        nombreInvitado: "Test",
        emailInvitado: "test@email.com",
        tipoEventoId: tipoEvento.id,
        administradorId: admin.id,
        estadoReservaId: estado.id,
      },
    });

    const bloqueoInicio = new Date(martes);
    bloqueoInicio.setUTCHours(12, 0, 0, 0);
    const bloqueoFin = new Date(martes);
    bloqueoFin.setUTCHours(13, 0, 0, 0);
    await prisma.bloqueoAgenda.create({
      data: {
        fechaInicio: bloqueoInicio,
        fechaFin: bloqueoFin,
        motivo: "Almuerzo",
        administradorId: admin.id,
      },
    });

    const resultado = await consultarDisponibilidad({
      tipoEventoId: tipoEvento.id,
      fechaDesde: lunes,
      fechaHasta: miercoles,
    });

    expect(resultado).toHaveLength(3);

    const lunesSlots = resultado[0].slots;
    expect(lunesSlots.length).toBeLessThan(36);

    const martesSlots = resultado[1].slots;
    expect(martesSlots.length).toBeLessThan(36);

    const miercolesSlots = resultado[2].slots;
    expect(miercolesSlots).toHaveLength(36);
  });
});
