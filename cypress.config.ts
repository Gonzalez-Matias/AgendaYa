/// <reference types="node" />
import "dotenv/config";
import { exec } from "node:child_process";
import { defineConfig } from "cypress";
import { seedReservasPendientes, seedDisponibilidadEscenario } from "./cypress/support/db";

export default defineConfig({
  e2e: {
    baseUrl: "http://localhost:3000",
    supportFile: "cypress/support/e2e.ts",
    specPattern: "cypress/e2e/**/*.cy.{js,jsx,ts,tsx}",
    video: false,
    screenshotOnRunFailure: true,
    viewportWidth: 1440,
    viewportHeight: 900,
    reporter: "mochawesome",
    reporterOptions: {
      reportDir: "cypress/reports",
      overwrite: false,
      html: true,
      json: true,
    },
    setupNodeEvents(on) {
      // Cypress 16 eliminó cy.exec(): las tareas de Node se exponen vía cy.task().
      // Permite que un spec siembre la base para garantizar sus precondiciones.
      on("task", {
        seedReservasPendientes,
        seedDisponibilidadEscenario,
        seedDatabase() {
          return new Promise((resolve, reject) => {
            exec("npx prisma db seed", { timeout: 120000 }, (error, stdout) => {
              if (error) {
                reject(error);
                return;
              }
              resolve(stdout);
            });
          });
        },
        /**
         * Devuelve el historial de estados de una reserva.
         * La API no expone el historial (pertenece a otro requerimiento), por lo que se
         * consulta la base directamente para verificar el paso 4 del CP-US010-001.
         */
        getHistorial(reservaId: number) {
          return (async () => {
            const connectionString = process.env.DATABASE_URL;
            if (!connectionString) {
              throw new Error("DATABASE_URL no está definida");
            }

            const { Client } = await import("pg");
            const client = new Client({ connectionString });
            await client.connect();
            try {
              const { rows } = await client.query(
                `SELECT e.nombre AS estado, h.motivo, h."fechaCambio"
                 FROM reserva_estado_historial h
                 JOIN estado_reserva e ON e.id = h."estadoReservaId"
                 WHERE h."reservaId" = $1
                 ORDER BY h.id ASC`,
                [reservaId]
              );

              return rows.map((row) => ({
                estado: row.estado as string,
                motivo: row.motivo as string | null,
                fechaCambio: new Date(row.fechaCambio).toISOString(),
              }));
            } finally {
              await client.end();
            }
          })();
        },
      });
    },
  },
});
