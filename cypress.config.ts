import { defineConfig } from "cypress";

export default defineConfig({
  // Public settings – read in tests with Cypress.expose("name")
  expose: {
    apiUrl: "http://localhost:8080/api",
    adminUsername: "admin",
  },
  // Secrets – read in tests with cy.env(["name"]) (kept out of the browser until asked for)
  env: {
    adminPassword: "Admin@123",
  },
  e2e: {
    baseUrl: "http://localhost:8080",
    specPattern: "src/test/**/*.cy.ts",
    supportFile: "src/test/support/e2e.ts",
    fixturesFolder: "src/test/fixtures",
    video: false,
  },
});
