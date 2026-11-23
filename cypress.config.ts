import { defineConfig } from "cypress";

export default defineConfig({
  // Public settings – read in tests with Cypress.expose("name")
  expose: {
    apiUrl: "http://localhost:8080/api",
    adminUsername: "admin",
  },
  // Secrets (e.g. adminPassword) are NOT stored here.
  // They live in cypress.env.json (git-ignored) and are read with cy.env(["name"]).
  e2e: {
    baseUrl: "http://localhost:8080",
    specPattern: "src/test/**/*.cy.ts",
    supportFile: "src/test/support/e2e.ts",
    fixturesFolder: "src/test/fixtures",
    video: false,
  },
});
