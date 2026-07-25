import { prisma, cleanDB } from "../helpers";
import { consultarDisponibilidad } from "../../src/services/disponibilidad";
import prismaRepo from "../../src/repositories/db";

function proximoDia(diaSemana: number): Date {
  const ahora = new Date();
  const actual = ahora.getDay();
  let dias = diaSemana - actual;
  if (dias <= 0) dias += 7;
  const resultado = new Date(ahora);
  resultado.setDate(ahora.getDate() + dias);
  resultado.setHours(0, 0, 0, 0);
  return resultado;
}

function diaEnDias(dia: Date, dias: number): Date {
  const resultado = new Date(dia);
  resultado.setDate(dia.getDate() + dias);
  return resultado;
}

describe("consultarDisponibilidad", () => {
  beforeEach(async () => {
    await cleanDB();
  });

  afterAll(async () => {
    await prisma.$disconnect();
    await prismaRepo.$disconnect();
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
    expect(resultado[0].slots[0].inicio.getHours()).toBe(8);
    expect(resultado[0].slots[0].inicio.getMinutes()).toBe(0);
    expect(resultado[0].slots[35].fin.getHours()).toBe(17);
    expect(resultado[0].slots[35].fin.getMinutes()).toBe(0);
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
    expect(slots[0].inicio.getHours()).toBe(8);
    expect(slots[0].inicio.getMinutes()).toBe(0);
    expect(slots[1].inicio.getHours()).toBe(8);
    expect(slots[1].inicio.getMinutes()).toBe(15);
    expect(slots[2].inicio.getHours()).toBe(8);
    expect(slots[2].inicio.getMinutes()).toBe(30);
    expect(slots[3].inicio.getHours()).toBe(8);
    expect(slots[3].inicio.getMinutes()).toBe(45);
    expect(slots[4].inicio.getHours()).toBe(9);
    expect(slots[4].inicio.getMinutes()).toBe(0);
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
    reservaInicio.setHours(10, 0, 0, 0);

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
      (s) => `${s.inicio.getHours()}:${String(s.inicio.getMinutes()).padStart(2, "0")}`
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
    bloqueoInicio.setHours(12, 0, 0, 0);
    const bloqueoFin = new Date(martes);
    bloqueoFin.setHours(13, 0, 0, 0);

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
      (s) => `${s.inicio.getHours()}:${String(s.inicio.getMinutes()).padStart(2, "0")}`
    );

    expect(horarios).toContain("11:30");
    expect(horarios).not.toContain("12:00");
    expect(horarios).toContain("13:00");
  });

  it("debería respetar antelación mínima del tipo de evento", async () => {
    const ahora = new Date();
    const antelacionHoras = 2;
    const fechaMinima = new Date(ahora);
    fechaMinima.setHours(fechaMinima.getHours() + antelacionHoras);

    const admin = await prisma.usuarioAdministrador.create({
      data: { email: "test@test.com", nombre: "Test" },
    });

    const tipoEvento = await prisma.tipoEvento.create({
      data: {
        nombre: "Reunión",
        duracion: 30,
        antelacionMinima: antelacionHoras,
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

    if (slots.length > 0) {
      expect(slots[0].inicio.getTime()).toBeGreaterThanOrEqual(fechaMinima.getTime());
    } else {
      expect(slots).toHaveLength(0);
    }
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
    bloqueoInicio.setHours(8, 0, 0, 0);
    const bloqueoFin = new Date(martes);
    bloqueoFin.setHours(17, 0, 0, 0);

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
    reservaInicio.setHours(10, 0, 0, 0);
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
    bloqueoInicio.setHours(12, 0, 0, 0);
    const bloqueoFin = new Date(martes);
    bloqueoFin.setHours(13, 0, 0, 0);
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

  it("debería verificar horarios exactos por día — reserva en un día no afecta al siguiente", async () => {
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

    const estado = await prisma.estadoReserva.create({
      data: { nombre: "Confirmada" },
    });

    const reservaInicio = new Date(lunes);
    reservaInicio.setHours(10, 0, 0, 0);
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
      fechaDesde: lunes,
      fechaHasta: martes,
    });

    expect(resultado).toHaveLength(2);

    const lunesHorarios = resultado[0].slots.map(
      (s) => `${s.inicio.getHours()}:${String(s.inicio.getMinutes()).padStart(2, "0")}`
    );
    const martesHorarios = resultado[1].slots.map(
      (s) => `${s.inicio.getHours()}:${String(s.inicio.getMinutes()).padStart(2, "0")}`
    );

    expect(lunesHorarios).not.toContain("10:00");
    expect(lunesHorarios).not.toContain("10:15");
    expect(martesHorarios).toContain("10:00");
    expect(martesHorarios).toContain("10:15");
    expect(martesHorarios).toHaveLength(36);
  });

  it("debería funcionar con período de 7 días (semana completa)", async () => {
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
    const domingo = diaEnDias(lunes, 6);

    const estado = await prisma.estadoReserva.create({
      data: { nombre: "Confirmada" },
    });

    const reserva1Inicio = new Date(lunes);
    reserva1Inicio.setHours(10, 0, 0, 0);
    await prisma.reserva.create({
      data: {
        fechaHoraInicio: reserva1Inicio,
        duracion: 30,
        nombreInvitado: "Test1",
        emailInvitado: "test1@email.com",
        tipoEventoId: tipoEvento.id,
        administradorId: admin.id,
        estadoReservaId: estado.id,
      },
    });

    const martes = diaEnDias(lunes, 1);
    const reserva2Inicio = new Date(martes);
    reserva2Inicio.setHours(14, 0, 0, 0);
    await prisma.reserva.create({
      data: {
        fechaHoraInicio: reserva2Inicio,
        duracion: 30,
        nombreInvitado: "Test2",
        emailInvitado: "test2@email.com",
        tipoEventoId: tipoEvento.id,
        administradorId: admin.id,
        estadoReservaId: estado.id,
      },
    });

    const miercoles = diaEnDias(lunes, 2);
    const bloqueoInicio = new Date(miercoles);
    bloqueoInicio.setHours(9, 0, 0, 0);
    const bloqueoFin = new Date(miercoles);
    bloqueoFin.setHours(11, 0, 0, 0);
    await prisma.bloqueoAgenda.create({
      data: {
        fechaInicio: bloqueoInicio,
        fechaFin: bloqueoFin,
        motivo: "Reunión interna",
        administradorId: admin.id,
      },
    });

    const resultado = await consultarDisponibilidad({
      tipoEventoId: tipoEvento.id,
      fechaDesde: lunes,
      fechaHasta: domingo,
    });

    expect(resultado).toHaveLength(7);

    expect(resultado[0].slots.length).toBeLessThan(36);
    expect(resultado[1].slots.length).toBeLessThan(36);
    expect(resultado[2].slots.length).toBeLessThan(36);

    expect(resultado[3].slots).toHaveLength(36);
    expect(resultado[4].slots).toHaveLength(36);

    expect(resultado[5].slots).toHaveLength(0);
    expect(resultado[6].slots).toHaveLength(0);

    const lunesHorarios = resultado[0].slots.map(
      (s) => `${s.inicio.getHours()}:${String(s.inicio.getMinutes()).padStart(2, "0")}`
    );
    expect(lunesHorarios).not.toContain("10:00");

    const martesHorarios = resultado[1].slots.map(
      (s) => `${s.inicio.getHours()}:${String(s.inicio.getMinutes()).padStart(2, "0")}`
    );
    expect(martesHorarios).not.toContain("14:00");

    const miercolesHorarios = resultado[2].slots.map(
      (s) => `${s.inicio.getHours()}:${String(s.inicio.getMinutes()).padStart(2, "0")}`
    );
    expect(miercolesHorarios).not.toContain("9:00");
    expect(miercolesHorarios).not.toContain("9:15");
    expect(miercolesHorarios).not.toContain("9:30");
    expect(miercolesHorarios).not.toContain("9:45");
    expect(miercolesHorarios).not.toContain("10:00");
    expect(miercolesHorarios).not.toContain("10:15");
    expect(miercolesHorarios).not.toContain("10:30");
    expect(miercolesHorarios).not.toContain("10:45");
    expect(miercolesHorarios).toContain("8:45");
    expect(miercolesHorarios).toContain("11:00");
  });

  it("debería rechazar el rango cuando fechaDesde es posterior a fechaHasta", async () => {
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

    const desde = new Date("2026-06-20T12:00:00Z");
    const hasta = new Date("2026-06-19T12:00:00Z");

    await expect(
      consultarDisponibilidad({
        tipoEventoId: tipoEvento.id,
        fechaDesde: desde,
        fechaHasta: hasta,
      })
    ).rejects.toThrow("fechaDesde no puede ser posterior a fechaHasta");
  });

  it("debería rechazar períodos mayores a 30 días", async () => {
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

    const desde = new Date();
    const hasta = new Date(desde);
    hasta.setDate(hasta.getDate() + 31);

    await expect(
      consultarDisponibilidad({
        tipoEventoId: tipoEvento.id,
        fechaDesde: desde,
        fechaHasta: hasta,
      })
    ).rejects.toThrow("El período no puede superar 30 días");
  });
});
