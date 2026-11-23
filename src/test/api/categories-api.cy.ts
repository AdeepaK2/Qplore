describe("Category Management API", () => {
  const apiUrl = Cypress.expose("apiUrl");
  const categoriesUrl = `${apiUrl}/admin/categories`;

  // Hook: common preconditions for every test (fresh data + a fresh Admin token).
  // Login is only a precondition here – never a test case.
  beforeEach(() => {
    cy.request("POST", `${apiUrl}/test/reset`);
    cy.env(["adminPassword"]).then(({ adminPassword }) => {
      cy.request("POST", `${apiUrl}/admin/auth/login`, {
        username: Cypress.expose("adminUsername"),
        password: adminPassword,
      })
        .its("body.data.token")
        .as("adminToken");
    });
  });

  // Common method: only sends the request. No assertions – those stay in the tests.
  const sendCreateCategoryRequest = (body: object) =>
    cy.get<string>("@adminToken").then((token) =>
      cy.request({
        method: "POST",
        url: categoriesUrl,
        headers: { Authorization: `Bearer ${token}` },
        body,
        failOnStatusCode: false, // let the test assert 4xx codes itself
      }),
    );

  it("TC_API_CAT_001 - Verify Admin can create a main category when a valid category name is sent with no parent", () => {
    // Arrange
    const newCategory = { name: "Cacti", parentId: null };

    // Act
    sendCreateCategoryRequest(newCategory).then((response) => {
      // Assert
      expect(response.status).to.eq(201);
      expect(response.body.message).to.eq("Category created successfully");
      expect(response.body.data.name).to.eq(newCategory.name);
      expect(response.body.data.parentId).to.eq(null);

      // Follow-up GET: prove the category was really saved
      cy.get<string>("@adminToken").then((token) => {
        cy.request({
          url: `${categoriesUrl}/${response.body.data.id}`,
          headers: { Authorization: `Bearer ${token}` },
        })
          .its("body.data.name")
          .should("eq", newCategory.name);
      });
    });
  });

  it("TC_API_CAT_007 - Verify Admin cannot create a category when the name field is missing", () => {
    // Arrange
    const categoryWithoutName = { parentId: null };

    // Act
    sendCreateCategoryRequest(categoryWithoutName).then((response) => {
      // Assert
      expect(response.status).to.eq(400);
      expect(response.body.errors.name).to.eq("Category name is required");
    });
  });

  it("TC_API_CAT_005 - Verify Admin cannot create a category when the category name has 2 characters", () => {
    // Arrange
    const twoCharacterName = { name: "Ab", parentId: null };

    // Act
    sendCreateCategoryRequest(twoCharacterName).then((response) => {
      // Assert
      expect(response.status).to.eq(400);
      expect(response.body.errors.name).to.eq("Category name must be between 3 and 10 characters");
    });
  });
});
