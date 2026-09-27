/// <reference types="node" />
import { exec } from "node:child_process";
import { defineConfig } from "cypress";
import { seedReservasPendientes } from "./cypress/support/db";

export default defineConfig({
  e2e: {
    baseUrl: "http://localhost:3000",
    supportFile: "cypress/support/e2e.ts",
    specPattern: "cypress/e2e/**/*.cy.{js,jsx,ts,tsx}",
    video: false,
    screenshotOnRunFailure: true,
    viewportWidth: 1440,
    viewportHeight: 900,
    setupNodeEvents(on) {
      on("task", { seedReservasPendientes });
    },
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
      });
    },
  },
});