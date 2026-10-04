import "dotenv/config";
import { Client } from "pg";

const FIXTURE_EMAIL = "e2e-fixture@agendaya.test";
const ESTADO_PENDIENTE = "PendienteDeConfirmacion";
const MARIA_EMAIL = "maria.garcia@agendaya.com";
const TIPO_REUNION = "Reunión";

interface BloqueoFixture {
  fechaInicio: string;
  fechaFin: string;
  motivo?: string;
}

interface DisponibilidadFixture {
  bloqueos?: BloqueoFixture[];
}

function connectionString(): string {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL no está definida para los fixtures de Cypress");
  }
  return url;
}

// Prisma guarda los DateTime como timestamp(3) en UTC, por eso el fixture
// también debe escribir el wall-clock UTC para que las horas coincidan.
function toDbTimestamp(valor: Date | string): string {
  const fecha = valor instanceof Date ? valor : new Date(valor);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${fecha.getUTCFullYear()}-${pad(fecha.getUTCMonth() + 1)}-${pad(fecha.getUTCDate())} ${pad(fecha.getUTCHours())}:${pad(fecha.getUTCMinutes())}:${pad(fecha.getUTCSeconds())}`;
}

async function withClient<T>(fn: (client: Client) => Promise<T>): Promise<T> {
  const client = new Client({ connectionString: connectionString() });
  await client.connect();
  try {
    return await fn(client);
  } finally {
    await client.end();
  }
}

async function obtenerAdminObjetivo(client: Client): Promise<number> {
  const { rows } = await client.query<{ id: number }>(
    `SELECT id FROM usuario_administrador ORDER BY nombre ASC LIMIT 1`
  );
  if (rows.length > 0) return rows[0].id;

  const insert = await client.query<{ id: number }>(
    `INSERT INTO usuario_administrador (email, nombre, "updatedAt")
     VALUES ($1, $2, now()) RETURNING id`,
    ["admin.e2e@agendaya.test", "Admin E2E"]
  );
  return insert.rows[0].id;
}

async function asegurarEstado(client: Client, nombre: string): Promise<number> {
  const { rows } = await client.query<{ id: number }>(
    `SELECT id FROM estado_reserva WHERE nombre = $1`,
    [nombre]
  );
  if (rows.length > 0) return rows[0].id;

  const insert = await client.query<{ id: number }>(
    `INSERT INTO estado_reserva (nombre) VALUES ($1) RETURNING id`,
    [nombre]
  );
  return insert.rows[0].id;
}

async function asegurarTipoEvento(client: Client, adminId: number): Promise<number> {
  const { rows } = await client.query<{ id: number }>(
    `SELECT id FROM tipo_evento WHERE "administradorId" = $1 ORDER BY id ASC LIMIT 1`,
    [adminId]
  );
  if (rows.length > 0) return rows[0].id;

  const insert = await client.query<{ id: number }>(
    `INSERT INTO tipo_evento (nombre, duracion, "antelacionMinima", "updatedAt", "administradorId")
     VALUES ($1, $2, $3, now(), $4) RETURNING id`,
    ["Reunión E2E", 30, 1, adminId]
  );
  return insert.rows[0].id;
}

/**
 * Busca un administrador por email o lo crea si no existe.
 */
async function obtenerOCrearAdminPorEmail(
  client: Client,
  email: string,
  nombre: string
): Promise<number> {
  const { rows } = await client.query<{ id: number }>(
    `SELECT id FROM usuario_administrador WHERE email = $1`,
    [email]
  );
  if (rows.length > 0) return rows[0].id;

  const insert = await client.query<{ id: number }>(
    `INSERT INTO usuario_administrador (email, nombre, "updatedAt")
     VALUES ($1, $2, now()) RETURNING id`,
    [email, nombre]
  );
  return insert.rows[0].id;
}

/**
 * Asegura el tipo de evento "Reunión" (30 min, antelación 1h, activo,
 * confirmación automática) del admin.
 */
async function asegurarTipoEventoReunion(client: Client, adminId: number): Promise<number> {
  const { rows } = await client.query<{ id: number }>(
    `SELECT id FROM tipo_evento WHERE "administradorId" = $1 AND nombre = $2 LIMIT 1`,
    [adminId, TIPO_REUNION]
  );

  if (rows.length > 0) {
    await client.query(
      `UPDATE tipo_evento
       SET duracion = 30, "antelacionMinima" = 1, activo = true, confirmacion = 'AUTOMATICA', "updatedAt" = now()
       WHERE id = $1`,
      [rows[0].id]
    );
    return rows[0].id;
  }

  const insert = await client.query<{ id: number }>(
    `INSERT INTO tipo_evento (nombre, duracion, "antelacionMinima", activo, confirmacion, "updatedAt", "administradorId")
     VALUES ($1, 30, 1, true, 'AUTOMATICA', now(), $2) RETURNING id`,
    [TIPO_REUNION, adminId]
  );
  return insert.rows[0].id;
}

/**
 * Prepara el escenario de disponibilidad de María García para M04-RF02:
 * disponibilidad solo lunes y martes (08:00–17:00) y los bloqueos indicados.
 * Resetea reservas, disponibilidad y bloqueos previos de María para ser determinista.
 */
async function seedDisponibilidadEscenario(input: DisponibilidadFixture = {}): Promise<null> {
  const bloqueos = input.bloqueos ?? [];

  await withClient(async (client) => {
    const adminId = await obtenerOCrearAdminPorEmail(client, MARIA_EMAIL, "María García");
    await asegurarTipoEventoReunion(client, adminId);

    await client.query(
      `DELETE FROM reserva_estado_historial
       WHERE "reservaId" IN (SELECT id FROM reserva WHERE "administradorId" = $1)`,
      [adminId]
    );
    await client.query(`DELETE FROM reserva WHERE "administradorId" = $1`, [adminId]);
    await client.query(`DELETE FROM disponibilidad_semanal WHERE "administradorId" = $1`, [
      adminId,
    ]);
    await client.query(`DELETE FROM bloqueo_agenda WHERE "administradorId" = $1`, [adminId]);

    await client.query(
      `INSERT INTO disponibilidad_semanal ("diaSemana", "horaInicio", "horaFin", "administradorId")
       VALUES (1, 480, 1020, $1), (2, 480, 1020, $1)`,
      [adminId]
    );

    for (const bloqueo of bloqueos) {
      await client.query(
        `INSERT INTO bloqueo_agenda ("fechaInicio", "fechaFin", motivo, "administradorId")
         VALUES ($1, $2, $3, $4)`,
        [
          toDbTimestamp(bloqueo.fechaInicio),
          toDbTimestamp(bloqueo.fechaFin),
          bloqueo.motivo ?? null,
          adminId,
        ]
      );
    }
  });

  return null;
}

/**
 * Prepara un estado determinista para el spec de gestión de reservas:
 * dos reservas PendienteDeConfirmacion del administrador que muestra la agenda,
 * fechadas hoy para que siempre sean visibles en la vista por defecto.
 */
async function seedReservasPendientes(): Promise<null> {
  await withClient(async (client) => {
    const adminId = await obtenerAdminObjetivo(client);
    const estadoId = await asegurarEstado(client, ESTADO_PENDIENTE);
    const tipoEventoId = await asegurarTipoEvento(client, adminId);

    await client.query(
      `DELETE FROM reserva_estado_historial
       WHERE "reservaId" IN (
         SELECT id FROM reserva WHERE "administradorId" = $1 AND "emailInvitado" = $2
       )`,
      [adminId, FIXTURE_EMAIL]
    );

    await client.query(
      `DELETE FROM reserva WHERE "administradorId" = $1 AND "emailInvitado" = $2`,
      [adminId, FIXTURE_EMAIL]
    );

    const hoy = new Date();
    for (const hora of [9, 10]) {
      const inicio = new Date(hoy);
      inicio.setHours(hora, 0, 0, 0);
      await client.query(
        `INSERT INTO reserva ("fechaHoraInicio", duracion, "nombreInvitado", "emailInvitado", "updatedAt", "tipoEventoId", "administradorId", "estadoReservaId")
         VALUES ($1, $2, $3, $4, now(), $5, $6, $7)`,
        [
          toDbTimestamp(inicio),
          30,
          `E2E Pendiente ${hora}hs`,
          FIXTURE_EMAIL,
          tipoEventoId,
          adminId,
          estadoId,
        ]
      );
    }
  });

  return null;
}

export { seedReservasPendientes, seedDisponibilidadEscenario };
