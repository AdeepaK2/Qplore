# QPlore – Software Requirements Specification (v1.0)

> Training system. QPlore is a cut-down clone of the IS4600 *QA Training App* (plant store). Rules and messages follow the same style as QA Training App SRS v2.1 (§3–§4, §6.3), so practice here carries over.
> Use the **exact messages** below in expected results. Anything this SRS does not say is a **requirements gap**: raise a question, don't invent behaviour.

## 1. Introduction
### 1.1 Purpose
Defines the behaviour of QPlore release 1.0 so testers can design, execute and automate tests.
### 1.2 Scope of this release
| In scope | Out of scope (later releases) |
|---|---|
| Admin login / logout (UI + API) | Dashboard, Sales, User Management |
| Category Management (UI + API) | Client registration, Client UI login |
| Plant Management (**API only**) | Buying plants, My Purchases |
| Client Plant Catalog (Guest, UI + API) | Plant Management screens |

### 1.3 System overview
| Part | URL |
|---|---|
| Admin App | `http://localhost:8080/admin/login` |
| Client App | `http://localhost:8080/client/plants` |
| REST API | `http://localhost:8080/api/...` |
| Swagger UI | `http://localhost:8080/swagger-ui.html` (OpenAPI JSON: `/v3/api-docs`) |
| Test support | `POST /api/test/reset` – restores the seed data (§9) |

## 2. Users and roles
| Role | Can do |
|---|---|
| Admin | Use the Admin App and all `/api/admin/...` APIs |
| Client | Log in through the Client API; browse the catalog |
| Guest | Browse the catalog without logging in |

## 3. Authentication
| ID | Requirement |
|---|---|
| FR-AU-01 | Admin logs in at `/admin/login` with username and password and is taken to `/admin/categories`. |
| FR-AU-02 | Username and password are required: "Username is required", "Password is required". |
| FR-AU-03 | Username is **trimmed** and **case-insensitive**. Password is **not trimmed** and is case-sensitive. Password is masked. |
| FR-AU-04 | Wrong username or password: "Invalid username or password." (API 401). |
| FR-AU-05 | A Client on the Admin login: "You are not authorized to access the Admin App." (API 403). An Admin on the Client login API: "Please use the Admin App to sign in." (403). |
| FR-AU-06 | An inactive Client with the correct password: "Your account is inactive. Please contact support." (403). |
| FR-AU-07 | Logout shows "You have been logged out successfully." and returns the Admin to `/admin/login`. **Logout invalidates that token**; using it again gives 401 "Invalid or expired token". |
| FR-AU-08 | A user who is not logged in and opens any `/admin` page is sent to `/admin/login`. |
| FR-AU-09 | A token is valid for 8 hours. There is no refresh token. |

Login APIs: Admin `POST /api/admin/auth/login`, Client `POST /api/client/public/auth/login`, body `{"username": "...", "password": "..."}`; the token is in `data.token`. Send it as `Authorization: Bearer <token>`.

## 4. API general rules
### 4.1 Access
| API group | Base path | No token | Client token | Admin token |
|---|---|---|---|---|
| Admin | `/api/admin/...` (except login) | 401 | **403** | Allowed |
| Client Public | `/api/client/public/...` | Allowed | Allowed | Allowed |

| ID | Requirement |
|---|---|
| FR-API-01 | No token: 401 "Authentication required". Unknown, expired or logged-out token: 401 "Invalid or expired token". |
| FR-API-02 | Wrong role: 403 "You do not have permission to access this resource". |
| FR-API-03 | Every response is JSON: `{ "success": true/false, "message": "...", "data": ..., "errors": { "field": "message" } }`. |
| FR-API-04 | Status codes: 200 OK · 201 created · 400 validation / bad parameter / malformed body ("Malformed JSON request body") · 401 · 403 · 404 "<Thing> not found" · 409 duplicate or conflict · 415 "Content-Type must be application/json" · never 500 for bad input. |
| FR-API-05 | Validation returns one message per field. Order: required → length/range → format → other. **Uniqueness is checked last and returns 409.** |
| FR-API-06 | IDs and numbers may be sent as text ("3"). |

### 4.2 List parameters (all list APIs)
| ID | Parameter | Rule | Message (400) |
|---|---|---|---|
| FR-LST-01 | `page` | Integer ≥ 1, default 1 | "Page must be 1 or greater" |
| FR-LST-02 | `size` | Integer 1–100, default 10 | "Size must be between 1 and 100" |
| FR-LST-03 | `sortBy` | One of the allowed fields | "Invalid sortBy value. Allowed: id, name, parent" |
| FR-LST-04 | `sortDir` | `asc` or `desc`, default `asc` | "Invalid sortDir value. Allowed: asc, desc" |
| FR-LST-05 | `search` | Partial, case-insensitive. `%` and `_` are matched literally. | – |
| FR-LST-06 | – | A page past the end returns 200 with an empty list. Ties are ordered by ID. | – |

## 5. Category Management (Admin)
Categories have **two levels only**: main categories (no parent) and sub-categories (parent = a main category). Plants belong to sub-categories.

### 5.1 Category list – `/admin/categories`
| ID | Requirement |
|---|---|
| FR-CAT-01 | The list shows ID, Name, Parent ("-" for a main category) and Edit / Delete actions, 10 rows per page with Previous / Next. |
| FR-CAT-02 | Search by name (FR-LST-05). |
| FR-CAT-03 | Filter by parent: shows only the sub-categories of the chosen main category. "All" shows everything. |
| FR-CAT-04 | Sort by ID, Name or Parent, ascending or descending. Default: ID ascending. Sorting by Parent puts main categories first when ascending and last when descending. |
| FR-CAT-05 | When nothing matches: "No category found". |
| FR-CAT-06 | Reset clears the search, filter and sort. |

API: `GET /api/admin/categories?page&size&search&parentId&sortBy&sortDir` → `data: { items, page, size, totalItems, totalPages }`. `GET /api/admin/categories/main` returns the main categories for the parent drop-down.

### 5.2 Delete a category
| ID | Requirement |
|---|---|
| FR-CAT-07 | Delete asks "Are you sure you want to delete {name}?" with **Delete** and **Cancel**. Cancel changes nothing. |
| FR-CAT-08 | Success: "Category deleted successfully". |
| FR-CAT-09 | A category with sub-categories or plants **cannot be deleted** (409): "Category cannot be deleted because it has {N} sub-categories." / "Category cannot be deleted because it has {M} plants." / "Category cannot be deleted because it has {N} sub-categories and {M} plants." Use the singular for 1: "1 sub-category", "1 plant". |

API: `DELETE /api/admin/categories/{id}` → 200, 404 "Category not found", 409.

### 5.3 Add / Edit a category
Add: `/admin/categories/add` (page title and heading "Add Category"). Edit: `/admin/categories/edit/{id}` (page title and heading "Edit Category"). A missing ID shows "Category not found".

| ID | Requirement |
|---|---|
| FR-CAT-10 | Fields: Category name (text), Parent category (drop-down: "None (main category)" + main categories). |
| FR-CAT-11 | The name is **trimmed** before it is checked and saved. |
| FR-CAT-12 | Success messages: "Category created successfully" / "Category updated successfully", then back to the list. |
| FR-CAT-13 | Cancel returns to the list without saving. |
| FR-CAT-14 | A name must be unique **within the same parent**, case-insensitive. The same name under different parents is allowed. |

| Field | Rule | Message |
|---|---|---|
| Name | Required | Category name is required |
| Name | Length 3–10 (after trimming) | Category name must be between 3 and 10 characters |
| Name | Unique within the parent (409) | Category name already exists |
| Parent | Must exist | Parent category not found |
| Parent | Must be a main category | Parent category must be a main category |
| Parent | Not itself | A category cannot be its own parent |
| Parent | A main category with sub-categories stays a main category | A category with sub-categories cannot be moved under another category |
| Parent | A sub-category with plants stays a sub-category | A category with plants must stay a sub-category |

API: `POST /api/admin/categories` → 201; `PUT /api/admin/categories/{id}` → 200; `GET /api/admin/categories/{id}` → 200 / 404. Body: `{"name": "Cacti", "parentId": null}`.

## 6. Plant Management (API only in this release)
| ID | Requirement |
|---|---|
| FR-PL-01 | `GET /api/admin/plants` lists plants sorted by name; price has 2 decimals; `lowStock` is true when quantity < 5. |
| FR-PL-02 | `POST /api/admin/plants` creates a plant: "Plant created successfully" (201). Name trimmed, unique case-insensitive ("Plant name already exists", 409). |
| FR-PL-03 | `DELETE /api/admin/plants/{id}`: "Plant deleted successfully" / 404 "Plant not found". |

| Field | Rule | Message |
|---|---|---|
| name | Required / length 3–25 | Plant name is required / Plant name must be between 3 and 25 characters |
| price | Required / number / > 0 / ≤ 10000.00 / ≤ 2 decimals | Price is required / Price must be a number / Price must be greater than 0 / Price cannot exceed 10000.00 / Price can have at most 2 decimal places |
| quantity | Required / whole number / ≥ 0 | Quantity is required / Quantity must be a whole number / Quantity cannot be negative |
| categoryId | Required / valid ID / exists / sub-category | Category is required / Category must be a valid category ID / Category not found / Category must be a sub-category |

## 7. Client – Plant Catalog (`/client/plants`, Guest allowed)
| ID | Requirement |
|---|---|
| FR-CL-01 | Each plant shows name, category as "Parent > Sub-category", price as "Rs. 0.00" and a stock badge. |
| FR-CL-02 | Search by name. Nothing found: "No plants found". |
| FR-CL-03 | Stock badge and Buy button: |

| Stock | Badge | Colour | Buy |
|---|---|---|---|
| 0 | Out of Stock | Red | **Disabled** |
| 1–4 | Only {X} left | Orange | Enabled |
| ≥ 5 | In Stock | Green | Enabled |

| ID | Requirement |
|---|---|
| FR-CL-04 | Buy (enabled) shows "Please log in to buy plants. Client login arrives in the next release." |
| FR-CL-05 | `GET /api/client/public/plants?search=` returns `stockStatus` (OUT_OF_STOCK / LOW_STOCK / IN_STOCK). The exact `stock` is returned **only** for 1–4. |

## 8. Non-functional requirements
| ID | Requirement |
|---|---|
| NFR-PF-01 | Every API in this SRS responds within 2 seconds on the local machine. |
| NFR-SE-01 | Passwords are never returned by any API. |
| NFR-US-01 | Error messages appear next to the field they belong to. |
| NFR-CP-01 | The Admin and Client Apps work in current Chrome, Edge and Firefox at 1366×768. |

## 9. Seed data (restored by `POST /api/test/reset` and on every start)
| Users | Password | Role | Active |
|---|---|---|---|
| admin | Admin@123 | Admin | Yes |
| user | User@123 | Client | Yes |
| kamala | Kamala@123 | Client | **No** |

| ID | Category | Parent | Plants |
|---|---|---|---|
| 1 | Indoor | – | – |
| 2 | Outdoor | – | – |
| 3 | Succulents | Indoor | Aloe Vera (qty 12, 450.00), Jade Plant (qty 5, 650.00) |
| 4 | Ferns | Indoor | Boston Fern (qty 3, 1200.00) |
| 5 | Herbs | Outdoor | Basil (qty 0, 150.00), Mint (qty 1, 120.50) |
| 6 | Seasonal | – | – |
| 7 | Climbers | Indoor | – |
