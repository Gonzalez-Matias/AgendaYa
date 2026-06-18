import { prisma, cleanDB, seed } from "../helpers";
import { obtenerDetalleReserva } from "../../src/services/reserva";
import prismaRepo from "../../src/repositories/db";

// M05-RF05 - Mostrar detalle de reserva
// Tests de solo lectura: usan los datos cargados por seed(), no crean
// registros propios, siguiendo la convención de tests/ del proyecto.
describe("obtenerDetalleReserva", () => {
  beforeAll(async () => {
    await seed();
  });

  afterAll(async () => {
    await cleanDB();
    await prisma.$disconnect();
    await prismaRepo.$disconnect();
  });

  it("debería devolver todos los datos de la reserva: invitado, evento, estado y horarios (Escenario 1)", async () => {
    const reservaSeed = await prisma.reserva.findFirstOrThrow({
      where: { nombreInvitado: "Juan Pérez" },
      include: { tipoEvento: true, estadoReserva: true },
    });

    const detalle = await obtenerDetalleReserva(reservaSeed.id);

    expect(detalle.id).toBe(reservaSeed.id);
    expect(detalle.nombreInvitado).toBe("Juan Pérez");
    expect(detalle.emailInvitado).toBe("juan@email.com");
    expect(detalle.fechaHoraInicio.getTime()).toBe(
      reservaSeed.fechaHoraInicio.getTime()
    );
    expect(detalle.fechaHoraFin.getTime()).toBe(
      reservaSeed.fechaHoraInicio.getTime() + reservaSeed.duracion * 60000
    );
    expect(detalle.tipoEvento.nombre).toBe(reservaSeed.tipoEvento.nombre);
    expect(detalle.tipoEvento.duracion).toBe(reservaSeed.tipoEvento.duracion);
    expect(detalle.estado.nombre).toBe(reservaSeed.estadoReserva.nombre);
  });

  it("debería devolver null en teléfono y nota cuando el invitado no los completó (Escenario 2)", async () => {
    const reservaSeed = await prisma.reserva.findFirstOrThrow({
      where: { nombreInvitado: "Juan Pérez" },
    });

    // El seed no carga teléfono ni nota para esta reserva: debe llegar
    // como null y no como string vacío, undefined o un valor inventado.
    expect(reservaSeed.telefonoInvitado).toBeNull();
    expect(reservaSeed.notaInvitado).toBeNull();

    const detalle = await obtenerDetalleReserva(reservaSeed.id);

    expect(detalle.telefonoInvitado).toBeNull();
    expect(detalle.notaInvitado).toBeNull();
  });

  it("debería lanzar un error claro si la reserva no existe (caso borde)", async () => {
    const idInexistente = 999999;

    await expect(obtenerDetalleReserva(idInexistente)).rejects.toThrow(
      `No existe una reserva con id ${idInexistente}`
    );
  });
});