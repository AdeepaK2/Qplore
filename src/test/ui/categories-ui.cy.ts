import { CategoriesPage } from "../pages/CategoriesPage";
import { CategoryFormPage } from "../pages/CategoryFormPage";

describe("Category Management UI", () => {
  const apiUrl = Cypress.expose("apiUrl");

  // Page objects are created once and reused (not created again in every test)
  const categoriesPage = new CategoriesPage();
  const categoryFormPage = new CategoryFormPage();

  // Hook: common preconditions for every test.
  // 1. Fresh seed data  2. Admin logged in (token from the API – login is a precondition, not a test)
  // 3. Browser on /admin/categories
  beforeEach(() => {
    cy.request("POST", `${apiUrl}/test/reset`);
    cy.env(["adminPassword"]).then(({ adminPassword }) => {
      cy.request("POST", `${apiUrl}/admin/auth/login`, {
        username: Cypress.expose("adminUsername"),
        password: adminPassword,
      })
        .its("body.data.token")
        .then((token) => {
          categoriesPage.visit({
            onBeforeLoad(win) {
              win.localStorage.setItem("qplore_admin_token", token);
              win.localStorage.setItem("qplore_admin_user", Cypress.expose("adminUsername"));
            },
          });
        });
    });
  });

  it("TC_UI_CAT_003 - Verify Admin can create a sub-category when a main category is selected as the parent", () => {
    // Arrange
    const subCategory = { name: "Bonsai", parent: "Outdoor" };

    // Act
    categoriesPage.clickAddCategory();
    categoryFormPage.enterName(subCategory.name);
    categoryFormPage.selectParent(subCategory.parent);
    categoryFormPage.save();

    // Assert
    cy.location("pathname").should("eq", "/admin/categories");
    categoriesPage.parentOf(subCategory.name).should("have.text", subCategory.parent);
  });

  it("TC_UI_CAT_004 - Verify Admin sees a validation message when saving a category without a name", () => {
    // Act
    categoriesPage.clickAddCategory();
    categoryFormPage.save();

    // Assert
    cy.location("pathname").should("eq", "/admin/categories/add");
    categoryFormPage.nameError().should("have.text", "Category name is required");
  });

  it("TC_UI_CAT_021 - Verify the category is kept when Admin cancels the delete confirmation", () => {
    // Arrange
    const categoryName = "Seasonal";

    // Act
    categoriesPage.clickDeleteFor(categoryName);

    // Assert
    categoriesPage.confirmationText().should("have.text", `Are you sure you want to delete ${categoryName}?`);

    // Act
    categoriesPage.cancelDelete();

    // Assert
    categoriesPage.rowFor(categoryName).should("be.visible");
  });
});
