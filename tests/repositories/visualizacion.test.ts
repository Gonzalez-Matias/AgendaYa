import { prisma, cleanDB } from "../helpers";
import {
  findReservasByAdmin,
  findReservasByAdminYPagina,
} from "../../src/repositories/visualizacion";

describe("visualizacion repository", () => {
  beforeEach(async () => {
    await cleanDB();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe("findReservasByAdmin", () => {
    it("debería retornar reservas de un administrador en un rango de fechas", async () => {
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
        data: { nombre: "Confirmada" },
      });

      const hoy = new Date();
      const mañana = new Date(hoy);
      mañana.setDate(mañana.getDate() + 1);
      mañana.setHours(10, 0, 0, 0);

      await prisma.reserva.create({
        data: {
          fechaHoraInicio: mañana,
          duracion: 30,
          nombreInvitado: "Juan Pérez",
          emailInvitado: "juan@email.com",
          tipoEventoId: tipoEvento.id,
          administradorId: admin.id,
          estadoReservaId: estado.id,
        },
      });

      const resultado = await findReservasByAdmin(admin.id, hoy, new Date(mañana.getTime() + 86400000));

      expect(resultado).toHaveLength(1);
      expect(resultado[0].nombreInvitado).toBe("Juan Pérez");
    });

    it("debería retornar array vacío si no hay reservas en el rango", async () => {
      const admin = await prisma.usuarioAdministrador.create({
        data: { email: "test@test.com", nombre: "Test Admin" },
      });

      const hoy = new Date();
      const mañana = new Date(hoy);
      mañana.setDate(mañana.getDate() + 1);

      const resultado = await findReservasByAdmin(admin.id, hoy, mañana);

      expect(resultado).toHaveLength(0);
    });

    it("debería filtrar solo las reservas del administrador especificado", async () => {
      const admin1 = await prisma.usuarioAdministrador.create({
        data: { email: "admin1@test.com", nombre: "Admin 1" },
      });
      const admin2 = await prisma.usuarioAdministrador.create({
        data: { email: "admin2@test.com", nombre: "Admin 2" },
      });

      const tipoEvento1 = await prisma.tipoEvento.create({
        data: {
          nombre: "Reunión",
          duracion: 30,
          antelacionMinima: 1,
          administradorId: admin1.id,
        },
      });
      const tipoEvento2 = await prisma.tipoEvento.create({
        data: {
          nombre: "Consulta",
          duracion: 60,
          antelacionMinima: 1,
          administradorId: admin2.id,
        },
      });

      const estado = await prisma.estadoReserva.create({
        data: { nombre: "Confirmada" },
      });

      const hoy = new Date();
      const mañana = new Date(hoy);
      mañana.setDate(mañana.getDate() + 1);
      mañana.setHours(10, 0, 0, 0);

      await prisma.reserva.create({
        data: {
          fechaHoraInicio: mañana,
          duracion: 30,
          nombreInvitado: "Reserva Admin 1",
          emailInvitado: "r1@email.com",
          tipoEventoId: tipoEvento1.id,
          administradorId: admin1.id,
          estadoReservaId: estado.id,
        },
      });

      await prisma.reserva.create({
        data: {
          fechaHoraInicio: mañana,
          duracion: 60,
          nombreInvitado: "Reserva Admin 2",
          emailInvitado: "r2@email.com",
          tipoEventoId: tipoEvento2.id,
          administradorId: admin2.id,
          estadoReservaId: estado.id,
        },
      });

      const resultado = await findReservasByAdmin(admin1.id, hoy, new Date(mañana.getTime() + 86400000));

      expect(resultado).toHaveLength(1);
      expect(resultado[0].nombreInvitado).toBe("Reserva Admin 1");
    });

    it("debería incluir el estado y tipo de evento de cada reserva", async () => {
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
        data: { nombre: "Confirmada" },
      });

      const hoy = new Date();
      const mañana = new Date(hoy);
      mañana.setDate(mañana.getDate() + 1);
      mañana.setHours(10, 0, 0, 0);

      await prisma.reserva.create({
        data: {
          fechaHoraInicio: mañana,
          duracion: 30,
          nombreInvitado: "Juan Pérez",
          emailInvitado: "juan@email.com",
          tipoEventoId: tipoEvento.id,
          administradorId: admin.id,
          estadoReservaId: estado.id,
        },
      });

      const resultado = await findReservasByAdmin(admin.id, hoy, new Date(mañana.getTime() + 86400000));

      expect(resultado[0].estadoReserva.nombre).toBe("Confirmada");
      expect(resultado[0].tipoEvento.nombre).toBe("Reunión");
    });
  });

  describe("findReservasByAdminYPagina", () => {
    it("debería retornar solo las reservas de la página solicitada", async () => {
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
        data: { nombre: "Confirmada" },
      });

      const hoy = new Date();
      const mañana = new Date(hoy);
      mañana.setDate(mañana.getDate() + 1);

      for (let i = 0; i < 15; i++) {
        const fecha = new Date(mañana);
        fecha.setHours(8 + i, 0, 0, 0);
        await prisma.reserva.create({
          data: {
            fechaHoraInicio: fecha,
            duracion: 30,
            nombreInvitado: `Invitado ${i}`,
            emailInvitado: `invitado${i}@email.com`,
            tipoEventoId: tipoEvento.id,
            administradorId: admin.id,
            estadoReservaId: estado.id,
          },
        });
      }

      const pagina1 = await findReservasByAdminYPagina(admin.id, hoy, new Date(mañana.getTime() + 86400000), 1, 10);
      const pagina2 = await findReservasByAdminYPagina(admin.id, hoy, new Date(mañana.getTime() + 86400000), 2, 10);

      expect(pagina1).toHaveLength(10);
      expect(pagina2).toHaveLength(5);
    });

    it("debería retornar array vacío si la página no existe", async () => {
      const admin = await prisma.usuarioAdministrador.create({
        data: { email: "test@test.com", nombre: "Test Admin" },
      });

      const hoy = new Date();
      const mañana = new Date(hoy);
      mañana.setDate(mañana.getDate() + 1);

      const resultado = await findReservasByAdminYPagina(admin.id, hoy, mañana, 5, 10);

      expect(resultado).toHaveLength(0);
    });
  });
});
