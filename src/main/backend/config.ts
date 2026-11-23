import fs from "node:fs";
import path from "node:path";
import yaml from "js-yaml";

interface AppYaml {
  server?: { port?: number };
  app?: { name?: string; version?: string; "token-ttl-hours"?: number; "seed-file"?: string };
}

const raw = yaml.load(fs.readFileSync(path.join(__dirname, "application.yml"), "utf8")) as AppYaml;

export const config = {
  port: Number(process.env.PORT ?? raw.server?.port ?? 8080),
  appName: raw.app?.name ?? "QPlore",
  version: raw.app?.version ?? "1.0.0",
  tokenTtlHours: raw.app?.["token-ttl-hours"] ?? 8,
  seedFile: raw.app?.["seed-file"] ?? "seed.json",
};
