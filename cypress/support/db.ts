import "dotenv/config";
import { Client } from "pg";

const FIXTURE_EMAIL = "e2e-fixture@agendaya.test";
const ESTADO_PENDIENTE = "PendienteDeConfirmacion";

function connectionString(): string {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL no está definida para los fixtures de Cypress");
  }
  return url;
}

function timestampLocal(fecha: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${fecha.getFullYear()}-${pad(fecha.getMonth() + 1)}-${pad(fecha.getDate())} ${pad(fecha.getHours())}:${pad(fecha.getMinutes())}:00`;
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
          timestampLocal(inicio),
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

export { seedReservasPendientes };
