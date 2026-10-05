import { prisma, cleanDB } from "../helpers";
import prismaRepo from "../../src/repositories/db";
import { reagendarReservaAction } from "../../src/actions/reserva";

describe("reagendarReservaAction", () => {
  beforeEach(async () => {
    await cleanDB();
  });

  afterAll(async () => {
    await prisma.$disconnect();
    await prismaRepo.$disconnect();
  });

  it("debería devolver success:false con el mensaje de error cuando la reserva no existe", async () => {
    const resultado = await reagendarReservaAction({
      reservaId: 9999,
      nuevaFechaHoraInicio: new Date("2026-08-01T14:00:00Z"),
    });

    expect(resultado).toEqual({ success: false, error: "La reserva no existe" });
  });
});
