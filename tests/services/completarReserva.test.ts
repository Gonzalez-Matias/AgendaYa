// src/services/completarReserva.test.ts
import { completarReserva } from '../../src/services/completarReserva';

describe('Pruebas Unitarias - US_11: Marcar Reserva como Completada', () => {

  // TEST 1: Flujo feliz (Cambio de estado exitoso)
  test('Debe cambiar el nombre del estado a "Completada" si está previamente "Confirmada"', async () => {
    const input = { reservaId: 101 };
    const resultado = await completarReserva(input);
    expect(resultado.estadoReserva.nombre).toBe('Completada');
  });

  // TEST 2: Control de errores de negocio (No está confirmada)
  test('Debe lanzar un error si la reserva NO está en estado "Confirmada"', async () => {
    const input = { reservaId: 102 };
    await expect(completarReserva(input)).rejects.toThrow(
      'Solo se pueden marcar como completadas las reservas en estado Confirmada'
    );
  });

  // TEST 3: Propiedades requeridas para la interfaz (Ventana emergente/Modal)
  test('El resultado debe contener el nombre del invitado para mostrar en la ventana de confirmación', async () => {
    const input = { reservaId: 101 };
    const resultado = await completarReserva(input);
    expect(resultado).toHaveProperty('id');
    expect(resultado.nombreInvitado).toBe('Carlos');
  });
});
