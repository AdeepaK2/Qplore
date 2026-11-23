import { Router } from "express";
import { store, type User } from "./store";
import { fail, ok, requireAuth, requireJson, validationFailed, type AuthedRequest, type FieldErrors } from "./http";

function readCredentials(body: any): { username: string; password: string; errors: FieldErrors } {
  const errors: FieldErrors = {};
  const username = typeof body?.username === "string" ? body.username.trim() : "";
  const password = typeof body?.password === "string" ? body.password : "";
  if (!username) errors.username = "Username is required";
  if (!password) errors.password = "Password is required";
  return { username, password, errors };
}

function loginResponse(user: User) {
  const session = store.createSession(user.id);
  return { token: session.token, expiresAt: session.expiresAt, username: user.username, role: user.role };
}

export const adminAuthRouter = Router();

adminAuthRouter.post("/login", requireJson, (req, res) => {
  const { username, password, errors } = readCredentials(req.body);
  if (Object.keys(errors).length) return validationFailed(res, errors);

  const user = store.users.find((u) => u.username === username);
  if (!user || user.password !== password) return fail(res, 401, "Invalid username or password.");
  if (user.role !== "ADMIN") return fail(res, 403, "You are not authorized to access the Admin App.");

  return ok(res, 200, "Login successful", loginResponse(user));
});

adminAuthRouter.post("/logout", requireAuth, (_req: AuthedRequest, res) => {
  return ok(res, 200, "You have been logged out successfully.");
});

export const clientAuthRouter = Router();

clientAuthRouter.post("/public/auth/login", requireJson, (req, res) => {
  const { username, password, errors } = readCredentials(req.body);
  if (Object.keys(errors).length) return validationFailed(res, errors);

  const user = store.users.find((u) => u.username.toLowerCase() === username.toLowerCase());
  if (!user || user.password !== password) return fail(res, 401, "Invalid username or password.");
  if (user.role === "ADMIN") return fail(res, 403, "Please use the Admin App to sign in.");
  if (!user.active) return fail(res, 403, "Your account is inactive. Please contact support.");

  return ok(res, 200, "Login successful", loginResponse(user));
});

clientAuthRouter.post("/auth/logout", requireAuth, (req: AuthedRequest, res) => {
  store.endSession(req.token!);
  return ok(res, 200, "You have been logged out successfully.");
});
