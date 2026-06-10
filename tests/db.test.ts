import { prisma, seed } from "./helpers";

beforeAll(async () => {
  await seed();
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe("Verificación de seed", () => {
  it("debería haber 5 estados de reserva", async () => {
    const count = await prisma.estadoReserva.count();
    expect(count).toBe(5);
  });

  it("debería haber 3 administradores", async () => {
    const count = await prisma.usuarioAdministrador.count();
    expect(count).toBe(3);
  });

  it("debería haber 9 tipos de evento", async () => {
    const count = await prisma.tipoEvento.count();
    expect(count).toBe(9);
  });

  it("debería haber 15 disponibilidades semanales", async () => {
    const count = await prisma.disponibilidadSemanal.count();
    expect(count).toBe(15);
  });

  it("debería haber 6 reservas", async () => {
    const count = await prisma.reserva.count();
    expect(count).toBe(6);
  });

  it("debería haber 6 registros de historial", async () => {
    const count = await prisma.reservaEstadoHistorial.count();
    expect(count).toBe(6);
  });

  it("debería haber 3 bloqueos de agenda", async () => {
    const count = await prisma.bloqueoAgenda.count();
    expect(count).toBe(3);
  });

  it("debería haber 47 registros en total", async () => {
    const counts = await Promise.all([
      prisma.estadoReserva.count(),
      prisma.usuarioAdministrador.count(),
      prisma.tipoEvento.count(),
      prisma.disponibilidadSemanal.count(),
      prisma.reserva.count(),
      prisma.reservaEstadoHistorial.count(),
      prisma.bloqueoAgenda.count(),
    ]);
    const total = counts.reduce((sum, c) => sum + c, 0);
    expect(total).toBe(47);
  });
});
