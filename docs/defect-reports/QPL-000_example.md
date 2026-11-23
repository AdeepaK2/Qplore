# QPL-000 : Duplicate category name returns 400 instead of 409

> Worked example of a good bug report. This bug is also caught by the sample API feature, so writing it here gives nothing extra away.

| Field | Value |
|---|---|
| Bug ID | QPL-000 |
| Reported by / date | 224110P / 2026-11-23 |
| Build / environment | QPlore 1.0.0, localhost:8080, Postman |
| Module | Category Management (API) |
| Linked test case | TC_API_CAT_0xx – Verify Admin cannot create a main category when a main category with the same name exists |
| Requirement | SRS §4.1 FR-API-05, §5.3 (Name – Unique within the parent → 409) |
| Severity | Minor (wrong status code, data is protected) |
| Priority | Medium (clients branch on 409) |
| Reproducible | Always (3 of 3) |

## Preconditions
- Data reset (`POST /api/test/reset`); main category "Indoor" exists (seed)
- Admin token from `POST /api/admin/auth/login`

## Steps to reproduce
1. Send `POST /api/admin/categories` with `Authorization: Bearer <admin token>`, `Content-Type: application/json` and the test data.

## Test data
```json
{ "name": "Indoor", "parentId": null }
```

## Expected result (from the SRS)
- Status **409**
- Message / error: "Category name already exists"

## Actual result
- Status **400**
- Body: `{"success":false,"message":"Validation failed","errors":{"name":"Category name already exists"}}`

## Evidence
Request and response copied above (Postman, 2026-11-23 17:40).

## Notes
The duplicate is still refused, so no data is corrupted; only the status code is wrong.
