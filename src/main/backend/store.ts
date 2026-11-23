import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { config } from "./config";

export type Role = "ADMIN" | "CLIENT";

export interface User {
  id: number;
  username: string;
  password: string;
  fullName: string;
  role: Role;
  active: boolean;
}

export interface Category {
  id: number;
  name: string;
  parentId: number | null;
}

export interface Plant {
  id: number;
  name: string;
  price: number;
  quantity: number;
  categoryId: number;
}

interface Session {
  userId: number;
  expiresAt: number;
}

interface Db {
  users: User[];
  categories: Category[];
  plants: Plant[];
  sessions: Map<string, Session>;
}

const db: Db = { users: [], categories: [], plants: [], sessions: new Map() };

export function resetData(): void {
  const seed = JSON.parse(fs.readFileSync(path.join(__dirname, config.seedFile), "utf8"));
  db.users = seed.users;
  db.categories = seed.categories;
  db.plants = seed.plants;
  db.sessions.clear();
}

export const store = {
  get users() {
    return db.users;
  },
  get categories() {
    return db.categories;
  },
  get plants() {
    return db.plants;
  },

  nextCategoryId(): number {
    return db.categories.reduce((max, c) => Math.max(max, c.id), 0) + 1;
  },
  nextPlantId(): number {
    return db.plants.reduce((max, p) => Math.max(max, p.id), 0) + 1;
  },

  findCategory(id: number): Category | undefined {
    return db.categories.find((c) => c.id === id);
  },
  subCategoriesOf(id: number): Category[] {
    return db.categories.filter((c) => c.parentId === id);
  },
  plantsIn(categoryId: number): Plant[] {
    return db.plants.filter((p) => p.categoryId === categoryId);
  },
  removeCategory(id: number): void {
    db.categories = db.categories.filter((c) => c.id !== id);
  },
  removePlant(id: number): void {
    db.plants = db.plants.filter((p) => p.id !== id);
  },

  createSession(userId: number): { token: string; expiresAt: string } {
    const token = crypto.randomBytes(24).toString("hex");
    const expiresAt = Date.now() + config.tokenTtlHours * 60 * 60 * 1000;
    db.sessions.set(token, { userId, expiresAt });
    return { token, expiresAt: new Date(expiresAt).toISOString() };
  },
  userForToken(token: string): User | undefined {
    const session = db.sessions.get(token);
    if (!session || session.expiresAt < Date.now()) return undefined;
    return db.users.find((u) => u.id === session.userId);
  },
  endSession(token: string): void {
    db.sessions.delete(token);
  },
};
