/**
 * Page Object: Admin App > Categories list (/admin/categories)
 * - All locators for this page live here, so a changed locator is fixed in one place.
 * - Methods only perform actions or return elements. NO assertions in page classes.
 */
export class CategoriesPage {
  private readonly url = "/admin/categories";

  private readonly addCategoryButton = "#add-category-btn";
  private readonly searchInput = "#search";
  private readonly searchButton = "#search-btn";
  private readonly tableRows = "#categories-table tbody tr";
  private readonly nameCell = ".col-name";
  private readonly parentCell = ".col-parent";
  private readonly deleteButton = ".delete-btn";
  private readonly confirmationMessage = "#confirm-text";
  private readonly confirmCancelButton = "#confirm-no";
  private readonly emptyListMessage = "#empty-message";

  visit(options?: Partial<Cypress.VisitOptions>) {
    cy.visit(this.url, options);
  }

  clickAddCategory() {
    cy.get(this.addCategoryButton).click();
  }

  searchFor(text: string) {
    cy.get(this.searchInput).clear().type(text);
    cy.get(this.searchButton).click();
  }

  /** The table row whose Name cell is exactly `name`. */
  rowFor(name: string) {
    return cy.contains(`${this.tableRows} ${this.nameCell}`, new RegExp(`^${name}$`)).parents("tr");
  }

  parentOf(name: string) {
    return this.rowFor(name).find(this.parentCell);
  }

  clickDeleteFor(name: string) {
    this.rowFor(name).find(this.deleteButton).click();
  }

  confirmationText() {
    return cy.get(this.confirmationMessage);
  }

  cancelDelete() {
    cy.get(this.confirmCancelButton).click();
  }

  emptyMessage() {
    return cy.get(this.emptyListMessage);
  }
}
