import path from "node:path";
import fs from "node:fs";
import express, { type NextFunction, type Request, type Response } from "express";
import swaggerUi from "swagger-ui-express";
import { config } from "./config";
import { resetData } from "./store";
import { fail, ok } from "./http";
import { adminAuthRouter, clientAuthRouter } from "./auth";
import { categoriesRouter } from "./categories";
import { adminPlantsRouter, publicPlantsRouter } from "./plants";

const FRONTEND = path.join(__dirname, "..", "frontend");
const openApi = JSON.parse(fs.readFileSync(path.join(__dirname, "openapi.json"), "utf8"));

resetData();

const app = express();
app.disable("x-powered-by");
app.use(express.json());

// ---------- API ----------
app.get("/api/health", (_req, res) =>
  ok(res, 200, "Application is running", { status: "UP", database: "UP", app: config.appName, version: config.version }),
);
app.post("/api/test/reset", (_req, res) => {
  resetData();
  return ok(res, 200, "Test data reset successfully");
});

app.use("/api/admin/auth", adminAuthRouter);
app.use("/api/admin/categories", categoriesRouter);
app.use("/api/admin/plants", adminPlantsRouter);
app.use("/api/client/public/plants", publicPlantsRouter);
app.use("/api/client", clientAuthRouter);

app.use("/api", (_req, res) => fail(res, 404, "Resource not found"));

// ---------- API docs ----------
app.get("/v3/api-docs", (_req, res) => res.json(openApi));
app.use("/swagger-ui", swaggerUi.serve, swaggerUi.setup(openApi, { customSiteTitle: "QPlore API" }));
app.get("/swagger-ui.html", (_req, res) => res.redirect("/swagger-ui/"));

// ---------- Admin App ----------
const adminPage = (file: string) => (_req: Request, res: Response) => res.sendFile(path.join(FRONTEND, "admin", file));
app.use("/admin/assets", express.static(path.join(FRONTEND, "admin")));
app.get(["/admin", "/admin/"], (_req, res) => res.redirect("/admin/categories"));
app.get("/admin/login", adminPage("login.html"));
app.get("/admin/categories", adminPage("categories.html"));
app.get(["/admin/categories/add", "/admin/categories/edit/:id"], adminPage("category-form.html"));

// ---------- Client App ----------
app.use("/client/assets", express.static(path.join(FRONTEND, "client")));
app.get(["/", "/client", "/client/"], (_req, res) => res.redirect("/client/plants"));
app.get("/client/plants", (_req, res) => res.sendFile(path.join(FRONTEND, "client", "catalog.html")));

app.get("/favicon.ico", (_req, res) => res.status(204).end());

// ---------- Errors ----------
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  if (err?.type === "entity.parse.failed") return fail(res, 400, "Malformed JSON request body");
  console.error(err);
  return fail(res, 500, "Internal server error");
});

app.listen(config.port, () => {
  console.log(`${config.appName} ${config.version} started on port ${config.port}`);
  console.log(`  Admin App : http://localhost:${config.port}/admin/login`);
  console.log(`  Client App: http://localhost:${config.port}/client/plants`);
  console.log(`  Swagger   : http://localhost:${config.port}/swagger-ui.html`);
});
