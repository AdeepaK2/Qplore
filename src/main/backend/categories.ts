import { Router } from "express";
import { store, type Category } from "./store";
import {
  fail,
  includesText,
  ok,
  paginate,
  parseId,
  parsePaging,
  requireAuth,
  requireJson,
  requireRole,
  validationFailed,
  type FieldErrors,
} from "./http";

const SORT_FIELDS = ["id", "name", "parent"] as const;

function toDto(c: Category) {
  const parent = c.parentId === null ? undefined : store.findCategory(c.parentId);
  return {
    id: c.id,
    name: c.name,
    parentId: c.parentId,
    parentName: parent ? parent.name : null,
    subCategoryCount: store.subCategoriesOf(c.id).length,
    plantCount: store.plantsIn(c.id).length,
  };
}

function plural(count: number, singular: string, pluralWord: string) {
  return `${count} ${count === 1 ? singular : pluralWord}`;
}

/** Validates the name field and returns the value to store. */
function validateName(body: any, errors: FieldErrors): string | undefined {
  const name = body?.name;
  if (name === undefined || name === null || (typeof name === "string" && name.trim() === "")) {
    errors.name = "Category name is required";
    return undefined;
  }
  if (typeof name !== "string") {
    errors.name = "Category name must be text";
    return undefined;
  }
  if (name.length < 3 || name.length > 11) {
    errors.name = "Category name must be between 3 and 10 characters";
    return undefined;
  }
  return name;
}

/** Validates parentId. Returns null for a main category, the parent ID otherwise. */
function validateParent(body: any, errors: FieldErrors): number | null | undefined {
  const raw = body?.parentId;
  if (raw === undefined || raw === null || raw === "") return null;
  const parentId = parseId(raw);
  if (parentId === undefined) {
    errors.parentId = "Parent category must be a valid category ID";
    return undefined;
  }
  if (!store.findCategory(parentId)) {
    errors.parentId = "Parent category not found";
    return undefined;
  }
  return parentId;
}

function isDuplicate(name: string, parentId: number | null, exceptId?: number) {
  return store.categories.some((c) => c.id !== exceptId && c.parentId === parentId && c.name === name);
}

export const categoriesRouter = Router();

// List with search, parent filter, sort and paging
categoriesRouter.get("/", requireAuth, (req, res) => {
  const { page, size, errors } = parsePaging(req.query);
  const sortBy = String(req.query.sortBy ?? "id");
  const sortDir = String(req.query.sortDir ?? "asc");
  if (!SORT_FIELDS.includes(sortBy as (typeof SORT_FIELDS)[number])) {
    errors.sortBy = `Invalid sortBy value. Allowed: ${SORT_FIELDS.join(", ")}`;
  }
  if (sortDir !== "asc" && sortDir !== "desc") errors.sortDir = "Invalid sortDir value. Allowed: asc, desc";

  let parentFilter: number | undefined;
  if (req.query.parentId !== undefined && req.query.parentId !== "") {
    parentFilter = parseId(req.query.parentId);
    if (parentFilter === undefined) errors.parentId = "Parent category must be a valid category ID";
  }
  if (Object.keys(errors).length) return validationFailed(res, errors);

  const search = typeof req.query.search === "string" ? req.query.search.trim() : "";
  let rows = store.categories.map(toDto);
  if (search) rows = rows.filter((c) => includesText(c.name, search));
  if (parentFilter !== undefined) rows = rows.filter((c) => c.parentId === parentFilter);

  const dir = sortDir === "desc" ? -1 : 1;
  rows.sort((a, b) => {
    if (sortBy === "name") return a.name.localeCompare(b.name) || a.id - b.id;
    if (sortBy === "parent") {
      const pa = a.parentName ?? "";
      const pb = b.parentName ?? "";
      return dir * (pa.localeCompare(pb) || a.id - b.id);
    }
    return dir * (a.id - b.id);
  });

  return ok(res, 200, "Categories retrieved successfully", paginate(rows, page, size));
});

// Main categories only (used by the parent drop-down)
categoriesRouter.get("/main", requireRole("ADMIN"), (_req, res) => {
  const mains = store.categories.filter((c) => c.parentId === null).map(toDto);
  mains.sort((a, b) => a.name.localeCompare(b.name));
  return ok(res, 200, "Categories retrieved successfully", mains);
});

categoriesRouter.get("/:id", requireRole("ADMIN"), (req, res) => {
  const category = store.findCategory(Number(req.params.id));
  return ok(res, 200, "Category retrieved successfully", toDto(category as Category));
});

categoriesRouter.post("/", requireRole("ADMIN"), requireJson, (req, res) => {
  const errors: FieldErrors = {};
  const name = validateName(req.body, errors);
  const parentId = validateParent(req.body, errors);
  if (Object.keys(errors).length) return validationFailed(res, errors);

  if (isDuplicate(name!, parentId!)) return validationFailed(res, { name: "Category name already exists" });

  const category: Category = { id: store.nextCategoryId(), name: name!, parentId: parentId! };
  store.categories.push(category);
  return ok(res, 201, "Category created successfully", toDto(category));
});

categoriesRouter.put("/:id", requireRole("ADMIN"), requireJson, (req, res) => {
  const category = store.findCategory(Number(req.params.id));
  if (!category) return fail(res, 404, "Category not found");

  const errors: FieldErrors = {};
  const name = validateName(req.body, errors);
  const parentId = validateParent(req.body, errors);
  if (parentId !== undefined && parentId !== null && !errors.parentId) {
    const parent = store.findCategory(parentId)!;
    if (parent.parentId !== null) {
      errors.parentId = "Parent category must be a main category";
    } else if (category.parentId === null && store.subCategoriesOf(category.id).length > 0) {
      errors.parentId = "A category with sub-categories cannot be moved under another category";
    }
  }
  if (parentId === null && category.parentId !== null && store.plantsIn(category.id).length > 0) {
    errors.parentId = "A category with plants must stay a sub-category";
  }
  if (Object.keys(errors).length) return validationFailed(res, errors);

  if (isDuplicate(name!, parentId!, category.id)) return validationFailed(res, { name: "Category name already exists" });

  category.name = name!;
  category.parentId = parentId!;
  return ok(res, 200, "Category updated successfully", toDto(category));
});

categoriesRouter.delete("/:id", requireRole("ADMIN"), (req, res) => {
  const category = store.findCategory(Number(req.params.id));
  if (!category) return fail(res, 404, "Category not found");

  const subs = store.subCategoriesOf(category.id).length;
  if (subs > 0) {
    const plants = store.plantsIn(category.id).length;
    const subsText = `${subs} sub-categories`;
    const message =
      plants > 0
        ? `Category cannot be deleted because it has ${subsText} and ${plural(plants, "plant", "plants")}.`
        : `Category cannot be deleted because it has ${subsText}.`;
    return fail(res, 409, message);
  }

  store.removeCategory(category.id);
  return ok(res, 200, "Category deleted successfully");
});
