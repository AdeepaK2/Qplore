# QPlore – a deliberately buggy plant store for test practice

QPlore is a small clone of the IS4600 **QA Training App**: Admin App + Client App + REST API + Swagger. Its rules and messages follow the same style as the assignment SRS (Category Management §6.3).
It has **17 seeded bugs**: 14 in the API and 3 in the UI. Find them with manual testing first, then automate with **Cypress + Cucumber (TypeScript)**.

> The real assignment app is a Spring Boot `.jar`. QPlore's backend is a small Node/TypeScript server, so it runs with one command and has no database. Data lives in memory and resets on restart or `POST /api/test/reset`.

## Project structure
```
QPlore/
├── src/
│   ├── main/                       # The application under test
│   │   ├── backend/                # REST API (Express + TypeScript)
│   │   │   ├── server.ts           #   entry point, routes, Swagger
│   │   │   ├── auth.ts  categories.ts  plants.ts  http.ts  store.ts  config.ts
│   │   │   ├── application.yml     #   port, token lifetime
│   │   │   ├── seed.json           #   seed data (replaces reset_db.sql)
│   │   │   └── openapi.json        #   Swagger / OpenAPI spec
│   │   └── frontend/
│   │       ├── admin/              # Admin App (login, categories list, add/edit)
│   │       └── client/             # Client App (plant catalog, Guest)
│   └── test/                       # Test automation (Cypress + Cucumber)
│       ├── api/                    #   API tests (empty, to be set up)
│       └── ui/                     #   UI tests (empty, to be set up)
├── docs/
│   ├── srs/QPlore_SRS_v1.0.md      # READ THIS FIRST: the specification
│   ├── test-cases/                 # sample test cases (CSV) + writing rules
│   └── defect-reports/             # bug report template, example, answer key
├── docker-compose.yml  cypress.config.ts  package.json  tsconfig.json
```

## Setup (Windows)
1. Install **Node.js 20+** (`node -v`).
2. In this folder run:
   ```
   npm install
   ```
   The first install also downloads the Cypress app (~500 MB).
3. Start the app (leave this terminal open):
   ```
   npm run start:app
   ```
   - Admin App: http://localhost:8080/admin/login (`admin` / `Admin@123`)
   - Client App: http://localhost:8080/client/plants (Guest)
   - Swagger: http://localhost:8080/swagger-ui.html
   - Health: http://localhost:8080/api/health
   - Client API login: `user` / `User@123` (inactive client: `kamala` / `Kamala@123`)

   Alternatively, run `docker compose up`.

## Run the automated tests (second terminal, app running)
| Command | What it does |
|---|---|
| `npm run cy:open` | Cypress UI: pick a feature and watch it run |
| `npm test` | All features, headless |
| `npm run test:api` / `npm run test:ui` | Only API or only UI features |
| `npm run test:ci` | Starts the app, waits for `/api/health`, runs everything (useful later for Jenkins) |
| `npm run typecheck` | TypeScript check of app + tests |

The HTML report is written to `reports/cucumber-report.html`, and failure screenshots go to `reports/screenshots/`.

**The sample features fail on purpose in 4 scenarios.** Each failure is a real seeded bug, which shows what a test catching a bug looks like. Write a bug report for each, then tag the scenario with its bug ID (e.g. `@known-bug @QPL-001`) instead of deleting it or flipping the assertion.

## Practice plan (mirrors the assignment tasks)
1. **Read** `docs/srs/QPlore_SRS_v1.0.md`. List the gaps and questions you find (static testing).
2. **Design** test cases for Category Management (API + UI) in the assignment template, following `docs/test-cases/README.md`. Use EP, BVA, decision tables and state transitions.
3. **Execute** them by hand: Swagger or Postman for the API, the browser for the UI. Record actual results and Pass / Fail / Blocked.
4. **Explore** with a charter for 30–45 min (e.g. *"Explore category create/edit with boundary and whitespace names to discover validation errors"*).
5. **Report** each bug with `docs/defect-reports/BUG_REPORT_TEMPLATE.md` (see `QPL-000_example.md`).
6. **Automate**: extend the features and steps for the cases you wrote. Keep to the conventions below.
7. **Check yourself**: `npm run reveal-bugs -- --yes` prints the answer key. The 4 bugs the samples catch don't count, so try to find the other 13 first.

## Automation conventions used here (lecturer's best practices)
- **Feature → step definitions → page objects / API helpers** (middle layer). There are no assertions in page classes.
- **Config, not hard-coding:** base URL and credentials are in `cypress.config.ts` `env`. Override them in a git-ignored `cypress.env.json` or with `CYPRESS_adminPassword=...`.
- **Login is a precondition** (API token injected), never a test case.
- **Hooks:** `api/support/e2e.ts` resets the data before every scenario, so each test is independent and repeatable.
- **Custom commands** (`api/support/commands.ts`, `ui/support/commands.ts`): `cy.resetTestData()`, `cy.apiLogin(role)`, `cy.api(method, path, {token, body, qs})`, `cy.loginToAdminApp()`.
- **Strong assertions:** exact status, exact SRS message, and a follow-up GET to prove state changed. Don't use `cy.wait(ms)`, because Cypress retries assertions on its own.
- Test data comes from `api/fixtures/categories.json`. Step texts are unique across API and UI because all `*.steps.ts` files are loaded globally.

## Useful API calls
```
POST /api/test/reset
POST /api/admin/auth/login        {"username":"admin","password":"Admin@123"}
GET  /api/admin/categories?page=1&size=10&search=door&sortBy=name&sortDir=asc
POST /api/admin/categories        {"name":"Cacti","parentId":null}
PUT  /api/admin/categories/{id}   {"name":"Cactus","parentId":1}
DELETE /api/admin/categories/{id}
GET  /api/client/public/plants?search=fern
```
Header for protected calls: `Authorization: Bearer <token>`. In Swagger, use **Authorize** and paste the token without the word "Bearer".

## Next steps toward Task 2
- Add Allure reporting (lecturer requires it); the built-in Cucumber HTML report is a stand-in.
- Put the repo on GitHub with one branch per member, and add a `Jenkinsfile` that runs `npm ci` and `npm run test:ci`.
