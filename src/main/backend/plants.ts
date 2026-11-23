import { Router } from "express";
import { store, type Plant } from "./store";
import { fail, includesText, ok, parseId, requireJson, requireRole, validationFailed, type FieldErrors } from "./http";

function categoryPath(categoryId: number) {
  const category = store.findCategory(categoryId);
  const parent = category?.parentId != null ? store.findCategory(category.parentId) : undefined;
  return { categoryName: category?.name ?? null, parentCategoryName: parent?.name ?? null };
}

function toAdminDto(p: Plant) {
  return { id: p.id, name: p.name, price: p.price.toFixed(2), quantity: p.quantity, categoryId: p.categoryId, ...categoryPath(p.categoryId), lowStock: p.quantity < 5 };
}

function toPublicDto(p: Plant) {
  const stockStatus = p.quantity === 0 ? "OUT_OF_STOCK" : p.quantity < 5 ? "LOW_STOCK" : "IN_STOCK";
  return {
    id: p.id,
    name: p.name,
    price: p.price.toFixed(2),
    ...categoryPath(p.categoryId),
    stockStatus,
    ...(stockStatus === "LOW_STOCK" ? { stock: p.quantity } : {}),
  };
}

function validatePlant(body: any): { plant?: Omit<Plant, "id">; errors: FieldErrors } {
  const errors: FieldErrors = {};

  const name = typeof body?.name === "string" ? body.name.trim() : body?.name;
  if (name === undefined || name === null || name === "") errors.name = "Plant name is required";
  else if (typeof name !== "string") errors.name = "Plant name must be text";
  else if (name.length < 3 || name.length > 25) errors.name = "Plant name must be between 3 and 25 characters";

  const rawPrice = body?.price;
  const price = Number(rawPrice);
  if (rawPrice === undefined || rawPrice === null || rawPrice === "") errors.price = "Price is required";
  else if (typeof rawPrice === "boolean" || Number.isNaN(price)) errors.price = "Price must be a number";
  else if (price <= 0) errors.price = "Price must be greater than 0";
  else if (price > 10000) errors.price = "Price cannot exceed 10000.00";
  else if (!/^\d+(\.\d{1,2}0*)?$/.test(String(rawPrice))) errors.price = "Price can have at most 2 decimal places";

  const rawQty = body?.quantity;
  const quantity = Number(rawQty);
  if (rawQty === undefined || rawQty === null || rawQty === "") errors.quantity = "Quantity is required";
  else if (typeof rawQty === "boolean" || !Number.isInteger(quantity)) errors.quantity = "Quantity must be a whole number";
  else if (quantity < 0) errors.quantity = "Quantity cannot be negative";

  const rawCategory = body?.categoryId;
  const categoryId = parseId(rawCategory);
  if (rawCategory === undefined || rawCategory === null || rawCategory === "") errors.categoryId = "Category is required";
  else if (categoryId === undefined) errors.categoryId = "Category must be a valid category ID";
  else if (!store.findCategory(categoryId)) errors.categoryId = "Category not found";
  else if (store.findCategory(categoryId)!.parentId === null) errors.categoryId = "Category must be a sub-category";

  if (Object.keys(errors).length) return { errors };
  return { plant: { name, price: Math.round(price * 100) / 100, quantity, categoryId: categoryId! }, errors };
}

export const adminPlantsRouter = Router();

adminPlantsRouter.get("/", requireRole("ADMIN"), (_req, res) => {
  const rows = [...store.plants].sort((a, b) => a.name.localeCompare(b.name)).map(toAdminDto);
  return ok(res, 200, "Plants retrieved successfully", rows);
});

adminPlantsRouter.post("/", requireRole("ADMIN"), requireJson, (req, res) => {
  const { plant, errors } = validatePlant(req.body);
  if (!plant) return validationFailed(res, errors);
  if (store.plants.some((p) => p.name.toLowerCase() === plant.name.toLowerCase())) {
    return fail(res, 409, "Plant name already exists", { name: "Plant name already exists" });
  }
  const created: Plant = { id: store.nextPlantId(), ...plant };
  store.plants.push(created);
  return ok(res, 201, "Plant created successfully", toAdminDto(created));
});

adminPlantsRouter.delete("/:id", requireRole("ADMIN"), (req, res) => {
  const id = Number(req.params.id);
  if (!store.plants.some((p) => p.id === id)) return fail(res, 404, "Plant not found");
  store.removePlant(id);
  return ok(res, 200, "Plant deleted successfully");
});

export const publicPlantsRouter = Router();

publicPlantsRouter.get("/", (req, res) => {
  const search = typeof req.query.search === "string" ? req.query.search.trim() : "";
  let rows = [...store.plants].sort((a, b) => a.name.localeCompare(b.name));
  if (search) rows = rows.filter((p) => includesText(p.name, search));
  return ok(res, 200, "Plants retrieved successfully", rows.map(toPublicDto));
});
