import { prisma, cleanDB } from "../helpers";
import { completarReserva } from "../../src/services/completarReserva";

describe('Pruebas Unitarias - US_11: Marcar Reserva como Completada', () => {

  beforeEach(async () => {
    await cleanDB();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  // Helper para crear datos base reutilizables
  async function crearReservaConEstado(nombreEstado: string) {
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

    const estado = await prisma.estadoReserva.create({
      data: { nombre: nombreEstado },
    });

    const reserva = await prisma.reserva.create({
      data: {
        fechaHoraInicio: new Date(Date.now() + 86400000),
        duracion: 30,
        nombreInvitado: "Carlos",
        emailInvitado: "carlos@email.com",
        tipoEventoId: tipoEvento.id,
        administradorId: admin.id,
        estadoReservaId: estado.id,
      },
    });

    return { admin, reserva };
  }

  // TEST 1: Flujo feliz (Cambio de estado exitoso)
  it('Debe cambiar el estado a "Completada" si está previamente "Confirmada"', async () => {
    // Arrange
    await prisma.estadoReserva.create({ data: { nombre: "Completada" } });
    const { reserva } = await crearReservaConEstado("Confirmada");

    // Act
    const resultado = await completarReserva({ reservaId: reserva.id });

    // Assert
    expect(resultado.estadoReserva.nombre).toBe("Completada");
  });

  // TEST 2: Control de errores de negocio (No está confirmada)
  it('Debe lanzar un error si la reserva NO está en estado "Confirmada"', async () => {
    // Arrange
    const { reserva } = await crearReservaConEstado("Cancelada");

    // Act & Assert
    await expect(
      completarReserva({ reservaId: reserva.id })
    ).rejects.toThrow("Solo se pueden marcar como completadas las reservas en estado Confirmada");
  });

  // TEST 3: Propiedades requeridas para la interfaz (Ventana emergente/Modal)
  it('El resultado debe contener el nombre del invitado para mostrar en la ventana de confirmación', async () => {
    // Arrange
    await prisma.estadoReserva.create({ data: { nombre: "Completada" } });
    const { reserva } = await crearReservaConEstado("Confirmada");

    // Act
    const resultado = await completarReserva({ reservaId: reserva.id });

    // Assert
    expect(resultado).toHaveProperty('id');
    expect(resultado.nombreInvitado).toBe('Carlos');
  });

    // TEST 4: Validación de input inválido
  it('Debe lanzar un error si el reservaId es un número negativo o cero', async () => {
    // Arrange
    const inputInvalido = { reservaId: -1 };

    // Act & Assert
    await expect(
      completarReserva(inputInvalido)
    ).rejects.toThrow();
  });

  // TEST 5: Error si la reserva está en estado PendienteDeConfirmacion
  it('Debe lanzar un error si la reserva está en estado "PendienteDeConfirmacion"', async () => {
    // Arrange
    await prisma.estadoReserva.create({ data: { nombre: "Completada" } });
    const { reserva } = await crearReservaConEstado("PendienteDeConfirmacion");

    // Act & Assert
    await expect(
      completarReserva({ reservaId: reserva.id })
    ).rejects.toThrow("Solo se pueden marcar como completadas las reservas en estado Confirmada");
  });

});