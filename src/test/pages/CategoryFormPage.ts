/**
 * Page Object: Admin App > Add / Edit Category (/admin/categories/add, /admin/categories/edit/{id})
 * Methods only perform actions or return elements. NO assertions in page classes.
 */
export class CategoryFormPage {
  private readonly nameInput = "#name";
  private readonly nameErrorMessage = "#name-error";
  private readonly parentSelect = "#parent";
  private readonly saveButton = "#save-btn";

  enterName(name: string) {
    cy.get(this.nameInput).clear().type(name);
  }

  selectParent(parentName: string) {
    // Options load from the API, so wait for the option to exist before selecting it
    cy.contains(`${this.parentSelect} option`, parentName);
    cy.get(this.parentSelect).select(parentName);
  }

  save() {
    cy.get(this.saveButton).click();
  }

  nameError() {
    return cy.get(this.nameErrorMessage);
  }
}
