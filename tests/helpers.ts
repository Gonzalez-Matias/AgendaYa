import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error("DATABASE_URL no está definida en las variables de entorno");
}
const adapter = new PrismaPg({ connectionString: databaseUrl });
export const prisma = new PrismaClient({ adapter });

export async function cleanDB() {
  await prisma.reservaEstadoHistorial.deleteMany();
  await prisma.reserva.deleteMany();
  await prisma.disponibilidadSemanal.deleteMany();
  await prisma.bloqueoAgenda.deleteMany();
  await prisma.tipoEvento.deleteMany();
  await prisma.usuarioAdministrador.deleteMany();
  await prisma.estadoReserva.deleteMany();
}

export async function seed() {
  await cleanDB();

  // EstadoReserva (5)
  await prisma.estadoReserva.upsert({ where: { nombre: "PendienteDeConfirmacion" }, update: {}, create: { nombre: "PendienteDeConfirmacion" } });
  await prisma.estadoReserva.upsert({ where: { nombre: "PendienteDeReagendar" }, update: {}, create: { nombre: "PendienteDeReagendar" } });
  await prisma.estadoReserva.upsert({ where: { nombre: "Confirmada" }, update: {}, create: { nombre: "Confirmada" } });
  await prisma.estadoReserva.upsert({ where: { nombre: "Cancelada" }, update: {}, create: { nombre: "Cancelada" } });
  await prisma.estadoReserva.upsert({ where: { nombre: "Completada" }, update: {}, create: { nombre: "Completada" } });

  // UsuarioAdministrador (3)
  const admin1 = await prisma.usuarioAdministrador.create({ data: { email: "maria.garcia@agendaya.com", nombre: "María García" } });
  const admin2 = await prisma.usuarioAdministrador.create({ data: { email: "carlos.lopez@agendaya.com", nombre: "Carlos López" } });
  const admin3 = await prisma.usuarioAdministrador.create({ data: { email: "ana.martinez@agendaya.com", nombre: "Ana Martínez" } });

  // TipoEvento (9)
  await prisma.tipoEvento.createMany({ data: [
    { nombre: "Reunión", duracion: 30, confirmacion: "AUTOMATICA", antelacionMinima: 1, administradorId: admin1.id },
    { nombre: "Consulta", duracion: 60, confirmacion: "MANUAL", antelacionMinima: 2, administradorId: admin1.id },
    { nombre: "Asesoría", duracion: 45, confirmacion: "AUTOMATICA", antelacionMinima: 1, administradorId: admin1.id },
    { nombre: "Capacitación", duracion: 90, confirmacion: "MANUAL", antelacionMinima: 3, administradorId: admin2.id },
    { nombre: "Auditoría", duracion: 120, confirmacion: "MANUAL", antelacionMinima: 5, administradorId: admin2.id },
    { nombre: "Seguimiento", duracion: 30, confirmacion: "AUTOMATICA", antelacionMinima: 1, administradorId: admin2.id },
    { nombre: "Workshop", duracion: 180, confirmacion: "MANUAL", antelacionMinima: 7, administradorId: admin3.id },
    { nombre: "Mentoría", duracion: 45, confirmacion: "AUTOMATICA", antelacionMinima: 2, administradorId: admin3.id },
    { nombre: "Evaluación", duracion: 60, confirmacion: "MANUAL", antelacionMinima: 3, administradorId: admin3.id },
  ] });
  const tiposEvento = await prisma.tipoEvento.findMany();

  // DisponibilidadSemanal (15)
  const diasSemana = [1, 2, 3, 4, 5];
  await prisma.disponibilidadSemanal.createMany({ data: [
    ...diasSemana.map((d) => ({ diaSemana: d, horaInicio: 480, horaFin: 1020, administradorId: admin1.id })),
    ...diasSemana.map((d) => ({ diaSemana: d, horaInicio: 540, horaFin: 1080, administradorId: admin2.id })),
    ...diasSemana.map((d) => ({ diaSemana: d, horaInicio: 600, horaFin: 1140, administradorId: admin3.id })),
  ] });

  // Reserva (6)
  const ahora = new Date();
  const f = (d: number, h: number) => { const dt = new Date(ahora); dt.setDate(ahora.getDate() + d); dt.setHours(h, 0, 0, 0); return dt; };
  const estadoConfirmada = await prisma.estadoReserva.findUnique({ where: { nombre: "Confirmada" } });
  const estadoPendiente = await prisma.estadoReserva.findUnique({ where: { nombre: "PendienteDeConfirmacion" } });
  const estadoReagendar = await prisma.estadoReserva.findUnique({ where: { nombre: "PendienteDeReagendar" } });
  const estadoCancelada = await prisma.estadoReserva.findUnique({ where: { nombre: "Cancelada" } });

  const r0 = await prisma.reserva.create({ data: { fechaHoraInicio: f(1, 10), duracion: 30, nombreInvitado: "Juan Pérez", emailInvitado: "juan@email.com", tipoEventoId: tiposEvento[0].id, administradorId: admin1.id, estadoReservaId: estadoConfirmada!.id } });
  const r1 = await prisma.reserva.create({ data: { fechaHoraInicio: f(2, 14), duracion: 60, nombreInvitado: "Laura Silva", emailInvitado: "laura@email.com", tipoEventoId: tiposEvento[1].id, administradorId: admin1.id, estadoReservaId: estadoPendiente!.id } });
  const r2 = await prisma.reserva.create({ data: { fechaHoraInicio: f(7, 9), duracion: 90, nombreInvitado: "Pedro Gómez", emailInvitado: "pedro@email.com", tipoEventoId: tiposEvento[3].id, administradorId: admin2.id, estadoReservaId: estadoConfirmada!.id } });
  const r3 = await prisma.reserva.create({ data: { fechaHoraInicio: f(14, 11), duracion: 120, nombreInvitado: "Sofía Ruiz", emailInvitado: "sofia@email.com", tipoEventoId: tiposEvento[4].id, administradorId: admin2.id, estadoReservaId: estadoCancelada!.id } });
  const r4 = await prisma.reserva.create({ data: { fechaHoraInicio: f(21, 15), duracion: 180, nombreInvitado: "Martín Díaz", emailInvitado: "martin@email.com", tipoEventoId: tiposEvento[6].id, administradorId: admin3.id, estadoReservaId: estadoReagendar!.id } });
  const r5 = await prisma.reserva.create({ data: { fechaHoraInicio: f(22, 15), duracion: 45, nombreInvitado: "Lucía Fernández", emailInvitado: "lucia@email.com", tipoEventoId: tiposEvento[7].id, administradorId: admin3.id, estadoReservaId: estadoConfirmada!.id } });

  // ReservaEstadoHistorial (6)
  await prisma.reservaEstadoHistorial.createMany({ data: [
    { reservaId: r0.id, estadoReservaId: estadoConfirmada!.id, motivo: "Confirmación automática" },
    { reservaId: r1.id, estadoReservaId: estadoPendiente!.id, motivo: "Reserva creada" },
    { reservaId: r2.id, estadoReservaId: estadoConfirmada!.id, motivo: "Aprobado por administrador" },
    { reservaId: r3.id, estadoReservaId: estadoCancelada!.id, motivo: "Cancelada por el invitado" },
    { reservaId: r4.id, estadoReservaId: estadoReagendar!.id, motivo: "Horario no disponible" },
    { reservaId: r5.id, estadoReservaId: estadoConfirmada!.id, motivo: "Confirmación automática" },
  ] });

  // BloqueoAgenda (3)
  await prisma.bloqueoAgenda.createMany({ data: [
    { fechaInicio: f(0, 12), fechaFin: f(0, 13), motivo: "Almuerzo", administradorId: admin1.id },
    { fechaInicio: f(5, 9), fechaFin: f(5, 10), motivo: "Reunión interna", administradorId: admin2.id },
    { fechaInicio: f(8, 14), fechaFin: f(8, 16), motivo: "Mantenimiento", administradorId: admin3.id },
  ] });
}
