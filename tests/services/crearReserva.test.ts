import { prisma, cleanDB } from "../helpers";
import { crearReserva, CrearReservaError } from "../../src/services/crearReserva";
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

function slotEnDia(dia: Date, horas: number, minutos = 0): Date {
  const resultado = new Date(dia);
  resultado.setHours(horas, minutos, 0, 0);
  return resultado;
}

async function crearAdminConTipo(confirmacion: "AUTOMATICA" | "MANUAL") {
  const admin = await prisma.usuarioAdministrador.create({
    data: { email: `admin-${confirmacion}@test.com`, nombre: `Admin ${confirmacion}` },
  });

  const tipoEvento = await prisma.tipoEvento.create({
    data: {
      nombre: "Reunión",
      duracion: 30,
      antelacionMinima: 1,
      confirmacion,
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

  return { admin, tipoEvento };
}

const datosInvitado = {
  nombreInvitado: "Juan Pérez",
  emailInvitado: "juan.perez@email.com",
};

describe("crearReserva", () => {
  beforeEach(async () => {
    await cleanDB();
    await prisma.estadoReserva.createMany({
      data: [
        { nombre: "Confirmada" },
        { nombre: "PendienteDeConfirmacion" },
        { nombre: "Cancelada" },
      ],
    });
  });

  afterAll(async () => {
    await prisma.$disconnect();
    await prismaRepo.$disconnect();
  });

  it("debería crear la reserva como Confirmada cuando el tipo es automático", async () => {
    const { tipoEvento } = await crearAdminConTipo("AUTOMATICA");
    const martes = proximoDia(2);

    const resultado = await crearReserva({
      tipoEventoId: tipoEvento.id,
      fechaHoraInicio: slotEnDia(martes, 8),
      ...datosInvitado,
    });

    expect(resultado.estado).toBe("Confirmada");
    expect(resultado.mensaje).toContain("confirmada");
    expect(resultado.reserva.estadoReserva.nombre).toBe("Confirmada");
    expect(resultado.reserva.duracion).toBe(30);

    const reservas = await prisma.reserva.findMany();
    expect(reservas).toHaveLength(1);

    const historial = await prisma.reservaEstadoHistorial.findMany();
    expect(historial).toHaveLength(1);
  });

  it("debería crear la reserva como PendienteDeConfirmacion cuando el tipo es manual", async () => {
    const { tipoEvento } = await crearAdminConTipo("MANUAL");
    const martes = proximoDia(2);

    const resultado = await crearReserva({
      tipoEventoId: tipoEvento.id,
      fechaHoraInicio: slotEnDia(martes, 8),
      ...datosInvitado,
    });

    expect(resultado.estado).toBe("PendienteDeConfirmacion");
    expect(resultado.mensaje).toContain("solicitud");
    expect(resultado.reserva.estadoReserva.nombre).toBe("PendienteDeConfirmacion");
  });

  it("debería rechazar la reserva si el slot ya está ocupado", async () => {
    const { admin, tipoEvento } = await crearAdminConTipo("AUTOMATICA");
    const martes = proximoDia(2);

    const estado = await prisma.estadoReserva.findUniqueOrThrow({
      where: { nombre: "Confirmada" },
    });

    await prisma.reserva.create({
      data: {
        fechaHoraInicio: slotEnDia(martes, 8),
        duracion: 30,
        nombreInvitado: "Ocupado",
        emailInvitado: "ocupado@email.com",
        tipoEventoId: tipoEvento.id,
        administradorId: admin.id,
        estadoReservaId: estado.id,
      },
    });

    await expect(
      crearReserva({
        tipoEventoId: tipoEvento.id,
        fechaHoraInicio: slotEnDia(martes, 8),
        ...datosInvitado,
      })
    ).rejects.toThrow("ya fue reservado");

    const reservas = await prisma.reserva.findMany();
    expect(reservas).toHaveLength(1);
  });

  it("debería rechazar un email inválido", async () => {
    const { tipoEvento } = await crearAdminConTipo("AUTOMATICA");
    const martes = proximoDia(2);

    await expect(
      crearReserva({
        tipoEventoId: tipoEvento.id,
        fechaHoraInicio: slotEnDia(martes, 8),
        nombreInvitado: "Juan Pérez",
        emailInvitado: "sinArroba",
      })
    ).rejects.toThrow("email válido");
  });

  it("debería rechazar un nombre vacío o con solo espacios", async () => {
    const { tipoEvento } = await crearAdminConTipo("AUTOMATICA");
    const martes = proximoDia(2);

    await expect(
      crearReserva({
        tipoEventoId: tipoEvento.id,
        fechaHoraInicio: slotEnDia(martes, 8),
        nombreInvitado: "   ",
        emailInvitado: "juan@email.com",
      })
    ).rejects.toThrow("nombre completo");
  });

  it("debería rechazar un tipo de evento inexistente", async () => {
    const martes = proximoDia(2);

    const error = await crearReserva({
      tipoEventoId: 999999,
      fechaHoraInicio: slotEnDia(martes, 8),
      ...datosInvitado,
    }).catch((e) => e);

    expect(error).toBeInstanceOf(CrearReservaError);
    expect(error.message).toContain("no encontrado");
  });

  it("debería guardar teléfono y nota opcionales", async () => {
    const { tipoEvento } = await crearAdminConTipo("AUTOMATICA");
    const martes = proximoDia(2);

    const resultado = await crearReserva({
      tipoEventoId: tipoEvento.id,
      fechaHoraInicio: slotEnDia(martes, 9),
      ...datosInvitado,
      telefonoInvitado: "+5491155551234",
      notaInvitado: "Primera consulta",
    });

    expect(resultado.reserva.telefonoInvitado).toBe("+5491155551234");
    expect(resultado.reserva.notaInvitado).toBe("Primera consulta");
  });
});
