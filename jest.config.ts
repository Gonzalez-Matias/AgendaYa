import type { Config } from "jest";

const config: Config = {
  testMatch: ["<rootDir>/tests/**/*.test.ts"],
  transform: {
    "^.+\\.(ts|js|mjs)$": "@swc/jest",
  },
  transformIgnorePatterns: [
    "node_modules/(?!(@prisma|@swc)/)",
  ],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
  },
  verbose: true,
  testTimeout: 30000,
  reporters: [
    'default',
    ['jest-html-reporter', {
      pageTitle: 'AgendaYa - Test Report',
      outputPath: './test-report.html',
      includeFailureMsg: true,
      includeSuiteFailure: true,
      dateFormat: 'dd-mm-yyyy HH:MM:ss',
      sort: 'status',
      hidePassed: false,
      hidePending: false,
      hideSkipped: false,
    }]
  ],
};

export default config;
