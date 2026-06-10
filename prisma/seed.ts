import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  // ── EstadoReserva (5 registros) ──────────────────────────────────────────
  const estadoPendienteConfirmacion = await prisma.estadoReserva.upsert({
    where: { nombre: "PendienteDeConfirmacion" },
    update: {},
    create: { nombre: "PendienteDeConfirmacion" },
  });
  const estadoPendienteReagendar = await prisma.estadoReserva.upsert({
    where: { nombre: "PendienteDeReagendar" },
    update: {},
    create: { nombre: "PendienteDeReagendar" },
  });
  const estadoConfirmada = await prisma.estadoReserva.upsert({
    where: { nombre: "Confirmada" },
    update: {},
    create: { nombre: "Confirmada" },
  });
  const estadoCancelada = await prisma.estadoReserva.upsert({
    where: { nombre: "Cancelada" },
    update: {},
    create: { nombre: "Cancelada" },
  });
  const estadoCompletada = await prisma.estadoReserva.upsert({
    where: { nombre: "Completada" },
    update: {},
    create: { nombre: "Completada" },
  });

  console.log("✓ Estados de reserva creados");

  // ── UsuarioAdministrador (3 registros) ───────────────────────────────────
  const admin1 = await prisma.usuarioAdministrador.create({
    data: {
      email: "maria.garcia@agendaya.com",
      nombre: "María García",
    },
  });
  const admin2 = await prisma.usuarioAdministrador.create({
    data: {
      email: "carlos.lopez@agendaya.com",
      nombre: "Carlos López",
    },
  });
  const admin3 = await prisma.usuarioAdministrador.create({
    data: {
      email: "ana.martinez@agendaya.com",
      nombre: "Ana Martínez",
    },
  });

  console.log("✓ Administradores creados");

  // ── TipoEvento (9 registros, 3 por admin) ────────────────────────────────
  const tiposEventoData = [
    // Admin 1
    { nombre: "Reunión", duracion: 30, descripcion: "Reunión general", confirmacion: "AUTOMATICA" as const, antelacionMinima: 1, administradorId: admin1.id },
    { nombre: "Consulta", duracion: 60, descripcion: "Consulta técnica", confirmacion: "MANUAL" as const, antelacionMinima: 2, administradorId: admin1.id },
    { nombre: "Asesoría", duracion: 45, descripcion: "Asesoría personalizada", confirmacion: "AUTOMATICA" as const, antelacionMinima: 1, administradorId: admin1.id },
    // Admin 2
    { nombre: "Capacitación", duracion: 90, descripcion: "Capacitación grupal", confirmacion: "MANUAL" as const, antelacionMinima: 3, administradorId: admin2.id },
    { nombre: "Auditoría", duracion: 120, descripcion: "Auditoría de procesos", confirmacion: "MANUAL" as const, antelacionMinima: 5, administradorId: admin2.id },
    { nombre: "Seguimiento", duracion: 30, descripcion: "Seguimiento de proyecto", confirmacion: "AUTOMATICA" as const, antelacionMinima: 1, administradorId: admin2.id },
    // Admin 3
    { nombre: "Workshop", duracion: 180, descripcion: "Taller práctico", confirmacion: "MANUAL" as const, antelacionMinima: 7, administradorId: admin3.id },
    { nombre: "Mentoría", duracion: 45, descripcion: "Sesión de mentoría", confirmacion: "AUTOMATICA" as const, antelacionMinima: 2, administradorId: admin3.id },
    { nombre: "Evaluación", duracion: 60, descripcion: "Evaluación de desempeño", confirmacion: "MANUAL" as const, antelacionMinima: 3, administradorId: admin3.id },
  ];

  await prisma.tipoEvento.createMany({ data: tiposEventoData });
  const tiposEvento = await prisma.tipoEvento.findMany();

  console.log("✓ Tipos de evento creados");

  // ── DisponibilidadSemanal (15 registros, 5 días × 3 admins) ─────────────
  const diasSemana = [1, 2, 3, 4, 5]; // Lunes a Viernes
  const horariosAdmins = [
    { administradorId: admin1.id, horaInicio: 480, horaFin: 1020 }, // 08:00–17:00
    { administradorId: admin2.id, horaInicio: 540, horaFin: 1080 }, // 09:00–18:00
    { administradorId: admin3.id, horaInicio: 600, horaFin: 1140 }, // 10:00–19:00
  ];

  const disponibilidadData = horariosAdmins.flatMap(({ administradorId, horaInicio, horaFin }) =>
    diasSemana.map((diaSemana) => ({ diaSemana, horaInicio, horaFin, administradorId }))
  );

  await prisma.disponibilidadSemanal.createMany({ data: disponibilidadData });

  console.log("✓ Disponibilidades semanales creadas");

  // ── Reserva (6 registros, 2 por admin) ───────────────────────────────────
  const ahora = new Date();
  const manana = new Date(ahora);
  manana.setDate(ahora.getDate() + 1);
  manana.setHours(10, 0, 0, 0);
  const pasadoManana = new Date(ahora);
  pasadoManana.setDate(ahora.getDate() + 2);
  pasadoManana.setHours(14, 0, 0, 0);
  const enUnaSemana = new Date(ahora);
  enUnaSemana.setDate(ahora.getDate() + 7);
  enUnaSemana.setHours(9, 0, 0, 0);
  const enDosSemanas = new Date(ahora);
  enDosSemanas.setDate(ahora.getDate() + 14);
  enDosSemanas.setHours(11, 0, 0, 0);
  const enTresSemanas = new Date(ahora);
  enTresSemanas.setDate(ahora.getDate() + 21);
  enTresSemanas.setHours(15, 0, 0, 0);

  const reservaData = [
    // Admin 1
    { fechaHoraInicio: manana, duracion: 30, nombreInvitado: "Juan Pérez", emailInvitado: "juan.perez@email.com", telefonoInvitado: "+5491155551234", notaInvitado: "Primera consulta", tipoEventoId: tiposEvento[0].id, administradorId: admin1.id, estadoReservaId: estadoConfirmada.id },
    { fechaHoraInicio: pasadoManana, duracion: 60, nombreInvitado: "Laura Silva", emailInvitado: "laura.silva@email.com", telefonoInvitado: "+5491155555678", notaInvitado: null, tipoEventoId: tiposEvento[1].id, administradorId: admin1.id, estadoReservaId: estadoPendienteConfirmacion.id },
    // Admin 2
    { fechaHoraInicio: enUnaSemana, duracion: 90, nombreInvitado: "Pedro Gómez", emailInvitado: "pedro.gomez@email.com", telefonoInvitado: "+5491155559012", notaInvitado: "Traer documentación", tipoEventoId: tiposEvento[3].id, administradorId: admin2.id, estadoReservaId: estadoConfirmada.id },
    { fechaHoraInicio: enDosSemanas, duracion: 120, nombreInvitado: "Sofía Ruiz", emailInvitado: "sofia.ruiz@email.com", telefonoInvitado: null, notaInvitado: "Auditoría anual", tipoEventoId: tiposEvento[4].id, administradorId: admin2.id, estadoReservaId: estadoCancelada.id },
    // Admin 3
    { fechaHoraInicio: enTresSemanas, duracion: 180, nombreInvitado: "Martín Díaz", emailInvitado: "martin.diaz@email.com", telefonoInvitado: "+5491155553456", notaInvitado: "Workshop de React", tipoEventoId: tiposEvento[6].id, administradorId: admin3.id, estadoReservaId: estadoPendienteReagendar.id },
    { fechaHoraInicio: new Date(enTresSemanas.getTime() + 86400000), duracion: 45, nombreInvitado: "Lucía Fernández", emailInvitado: "lucia.fernandez@email.com", telefonoInvitado: "+5491155557890", notaInvitado: null, tipoEventoId: tiposEvento[7].id, administradorId: admin3.id, estadoReservaId: estadoConfirmada.id },
  ];

  const reservas = [];
  for (const data of reservaData) {
    const reserva = await prisma.reserva.create({ data });
    reservas.push(reserva);
  }

  console.log("✓ Reservas creadas");

  // ── ReservaEstadoHistorial (6 registros, 1 por reserva) ─────────────────
  const historialData = [
    { reservaId: reservas[0].id, estadoReservaId: estadoConfirmada.id, motivo: "Confirmación automática" },
    { reservaId: reservas[1].id, estadoReservaId: estadoPendienteConfirmacion.id, motivo: "Reserva creada" },
    { reservaId: reservas[2].id, estadoReservaId: estadoConfirmada.id, motivo: "Aprobado por administrador" },
    { reservaId: reservas[3].id, estadoReservaId: estadoCancelada.id, motivo: "Cancelada por el invitado" },
    { reservaId: reservas[4].id, estadoReservaId: estadoPendienteReagendar.id, motivo: "Horario no disponible" },
    { reservaId: reservas[5].id, estadoReservaId: estadoConfirmada.id, motivo: "Confirmación automática" },
  ];

  await prisma.reservaEstadoHistorial.createMany({ data: historialData });

  console.log("✓ Historial de estados creado");

  // ── BloqueoAgenda (3 registros, 1 por admin) ────────────────────────────
  const inicioSemana = new Date(ahora);
  inicioSemana.setDate(ahora.getDate() - ahora.getDay() + 1);
  inicioSemana.setHours(12, 0, 0, 0);
  const finSemana = new Date(inicioSemana);
  finSemana.setHours(13, 0, 0, 0);

  const proximoViernes = new Date(ahora);
  proximoViernes.setDate(ahora.getDate() + (5 - ahora.getDay()));
  proximoViernes.setHours(9, 0, 0, 0);
  const finViernes = new Date(proximoViernes);
  finViernes.setHours(10, 0, 0, 0);

  const proximoLunes = new Date(ahora);
  proximoLunes.setDate(ahora.getDate() + ((8 - ahora.getDay()) % 7 || 7));
  proximoLunes.setHours(14, 0, 0, 0);
  const finLunes = new Date(proximoLunes);
  finLunes.setHours(16, 0, 0, 0);

  const bloqueosData = [
    { fechaInicio: inicioSemana, fechaFin: finSemana, motivo: "Almuerzo", administradorId: admin1.id },
    { fechaInicio: proximoViernes, fechaFin: finViernes, motivo: "Reunión interna de equipo", administradorId: admin2.id },
    { fechaInicio: proximoLunes, fechaFin: finLunes, motivo: "Mantenimiento de sistemas", administradorId: admin3.id },
  ];

  await prisma.bloqueoAgenda.createMany({ data: bloqueosData });

  console.log("✓ Bloqueos de agenda creados");

  console.log("\n🌱 Seed completado exitosamente");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error("❌ Error en el seed:", e);
    await prisma.$disconnect();
    process.exit(1);
  });
