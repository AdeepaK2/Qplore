# Test cases

**`TestCaseDocument_QPlore_v0.1.xlsx`** is the full test case document: 93 cases on the assignment template. It has a Summary sheet, a Categories sheet (27 UI + 51 API) and a Catalog sheet (9 UI + 6 API). To run them, set Status from the drop-down and fill in Actual Results and Defect ID; the Summary counts update on their own.
`QPlore_TestCases_sample.csv` is a short starter version with the same columns.

Columns (assignment template): `Test Identifier | Test Title | Test Description | Precondition | Test Steps | Test Data | Expected Result | Actual Results | UI / API | Status | Tester | Defect ID`

Lecturer's rules (notes L3, L4, L7):
- **Title:** Verify + who + action + when. ❌ "Check category", "Category test".
- **Expected result:** starts with "Validate", exact SRS message, numbered per step (1.1, 1.2, 2.1). Never "works correctly" / "as expected".
- One check per test (atomic). Positive and negative cases written separately.
- **No login test cases**: login is only a precondition.
- Preconditions, steps and test data (JSON for API) are required.
- Actual Results stays empty until execution. Tester = your index number.
- BVA: boundary −1, boundary, boundary +1, each its own test.

Coverage ideas for QPlore (don't stop here):
- Name length 2/3/4 and 9/10/11, after trimming ("  Ab  ", "  Abc  ").
- Duplicates: same name same parent, different case, same name under a different parent (allowed).
- Every parent rule in SRS §5.3 (create **and** update).
- Delete: 0, 1, N sub-categories; 0, 1, N plants; both.
- List parameters: page 0/1, size 0/1/100/101, invalid sortBy/sortDir, each sort field in both directions, `%` and `_` in search.
- Access: no token, client token, logged-out token on **every** admin endpoint.
- Catalog badges for stock 0, 1, 4, 5 and the Buy button state.
