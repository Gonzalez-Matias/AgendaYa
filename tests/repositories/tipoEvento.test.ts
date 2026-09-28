import { prisma, cleanDB } from "../helpers";
import { findTiposEventoByAdmin } from "../../src/repositories/tipoEvento";

describe("tipoEvento repository", () => {
  beforeEach(async () => {
    await cleanDB();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("debería retornar tipos de evento de un administrador", async () => {
    const admin = await prisma.usuarioAdministrador.create({
      data: { email: "test@test.com", nombre: "Test Admin" },
    });

    await prisma.tipoEvento.createMany({
      data: [
        { nombre: "Reunión", duracion: 30, antelacionMinima: 1, administradorId: admin.id },
        { nombre: "Consulta", duracion: 60, antelacionMinima: 2, administradorId: admin.id },
        { nombre: "Asesoría", duracion: 45, antelacionMinima: 1, administradorId: admin.id },
      ],
    });

    const resultado = await findTiposEventoByAdmin(admin.id);

    expect(resultado).toHaveLength(3);
    expect(resultado[0].nombre).toBe("Asesoría");
    expect(resultado[1].nombre).toBe("Consulta");
    expect(resultado[2].nombre).toBe("Reunión");
  });

  it("debería retornar array vacío si el admin no tiene tipos de evento", async () => {
    const admin = await prisma.usuarioAdministrador.create({
      data: { email: "test@test.com", nombre: "Test Admin" },
    });

    const resultado = await findTiposEventoByAdmin(admin.id);

    expect(resultado).toHaveLength(0);
  });

  it("debería filtrar solo los tipos de evento del administrador especificado", async () => {
    const admin1 = await prisma.usuarioAdministrador.create({
      data: { email: "admin1@test.com", nombre: "Admin 1" },
    });
    const admin2 = await prisma.usuarioAdministrador.create({
      data: { email: "admin2@test.com", nombre: "Admin 2" },
    });

    await prisma.tipoEvento.createMany({
      data: [
        { nombre: "Reunión", duracion: 30, antelacionMinima: 1, administradorId: admin1.id },
        { nombre: "Consulta", duracion: 60, antelacionMinima: 2, administradorId: admin1.id },
        { nombre: "Capacitación", duracion: 90, antelacionMinima: 3, administradorId: admin2.id },
      ],
    });

    const resultado = await findTiposEventoByAdmin(admin1.id);

    expect(resultado).toHaveLength(2);
    expect(resultado.every((t) => t.administradorId === admin1.id)).toBe(true);
  });

  it("debería retornar solo los tipos de evento activos", async () => {
    const admin = await prisma.usuarioAdministrador.create({
      data: { email: "test@test.com", nombre: "Test Admin" },
    });

    await prisma.tipoEvento.createMany({
      data: [
        { nombre: "Reunión", duracion: 30, antelacionMinima: 1, administradorId: admin.id, activo: true },
        { nombre: "Consulta", duracion: 60, antelacionMinima: 2, administradorId: admin.id, activo: false },
      ],
    });

    const resultado = await findTiposEventoByAdmin(admin.id);

    expect(resultado).toHaveLength(1);
    expect(resultado[0].nombre).toBe("Reunión");
  });
});
