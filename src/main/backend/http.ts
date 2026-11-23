import type { NextFunction, Request, Response } from "express";
import { store, type Role, type User } from "./store";

export type FieldErrors = Record<string, string>;

export function ok(res: Response, status: number, message: string, data?: unknown) {
  return res.status(status).json(data === undefined ? { success: true, message } : { success: true, message, data });
}

export function fail(res: Response, status: number, message: string, errors?: FieldErrors) {
  return res.status(status).json(errors ? { success: false, message, errors } : { success: false, message });
}

export function validationFailed(res: Response, errors: FieldErrors) {
  return fail(res, 400, "Validation failed", errors);
}

/** Rejects create/update bodies that are not JSON. */
export function requireJson(req: Request, res: Response, next: NextFunction) {
  if (!req.is("application/json")) return fail(res, 415, "Content-Type must be application/json");
  next();
}

export interface AuthedRequest extends Request {
  user?: User;
  token?: string;
}

function bearer(req: Request): string | undefined {
  const header = req.header("Authorization");
  if (!header || !header.startsWith("Bearer ")) return undefined;
  return header.slice("Bearer ".length).trim();
}

export function requireAuth(req: AuthedRequest, res: Response, next: NextFunction) {
  const token = bearer(req);
  if (!token) return fail(res, 401, "Authentication required");
  const user = store.userForToken(token);
  if (!user) return fail(res, 401, "Invalid or expired token");
  if (!user.active) return fail(res, 401, "Your account is inactive. Please contact support.");
  req.user = user;
  req.token = token;
  next();
}

export function requireRole(role: Role) {
  return (req: AuthedRequest, res: Response, next: NextFunction) =>
    requireAuth(req, res, () => {
      if (req.user!.role !== role) return fail(res, 403, "You do not have permission to access this resource");
      next();
    });
}

/** Parses an ID that may arrive as a number or numeric text ("3"). */
export function parseId(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isInteger(value)) return value;
  if (typeof value === "string" && /^\d+$/.test(value.trim())) return Number(value.trim());
  return undefined;
}

export function parsePaging(query: Request["query"], defaultSize = 10): { page: number; size: number; errors: FieldErrors } {
  const errors: FieldErrors = {};
  const page = query.page === undefined ? 1 : Number(query.page);
  const size = query.size === undefined ? defaultSize : Number(query.size);
  if (!Number.isInteger(page) || page < 0) errors.page = "Page must be 1 or greater";
  if (!Number.isInteger(size) || size < 1 || size > 100) errors.size = "Size must be between 1 and 100";
  return { page, size, errors };
}

export function paginate<T>(items: T[], page: number, size: number) {
  const start = (page - 1) * size;
  return {
    items: start < 0 ? [] : items.slice(start, start + size),
    page,
    size,
    totalItems: items.length,
    totalPages: Math.ceil(items.length / size),
  };
}

export function includesText(value: string, search: string): boolean {
  return value.toLowerCase().includes(search.toLowerCase());
}
