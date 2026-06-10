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
};

export default config;
