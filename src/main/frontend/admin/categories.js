(function () {
  if (!Auth.guard()) return;
  renderTopbar();
  Flash.showPending();

  const PAGE_SIZE = 10;
  const state = { page: 1, totalPages: 1, pendingDelete: null };
  const el = (id) => document.getElementById(id);

  async function loadParents() {
    const { status, body } = await api("GET", "/api/admin/categories/main");
    if (status !== 200) return;
    body.data.forEach((c) => {
      const opt = document.createElement("option");
      opt.value = c.id;
      opt.textContent = c.name;
      el("parent-filter").appendChild(opt);
    });
  }

  function query() {
    const params = new URLSearchParams({ page: state.page, size: PAGE_SIZE, sortBy: el("sort-by").value, sortDir: el("sort-dir").value });
    if (el("search").value.trim()) params.set("search", el("search").value.trim());
    if (el("parent-filter").value) params.set("parentId", el("parent-filter").value);
    return params.toString();
  }

  async function loadCategories() {
    const { status, body } = await api("GET", "/api/admin/categories?" + query());
    const tbody = el("categories-table").querySelector("tbody");
    tbody.innerHTML = "";
    if (status !== 200) {
      Flash.show("error", body.message);
      return;
    }
    const { items, totalPages } = body.data;
    state.totalPages = Math.max(totalPages, 1);
    el("empty-message").hidden = items.length > 0;
    el("categories-table").hidden = items.length === 0;

    items.forEach((c) => {
      const tr = document.createElement("tr");
      tr.dataset.id = c.id;
      tr.innerHTML = `
        <td class="col-id"></td>
        <td class="col-name"></td>
        <td class="col-parent"></td>
        <td class="actions">
          <a class="btn btn-secondary edit-btn" href="/admin/categories/edit/${c.id}">Edit</a>
          <button class="btn btn-danger delete-btn" type="button">Delete</button>
        </td>`;
      tr.querySelector(".col-id").textContent = c.id;
      tr.querySelector(".col-name").textContent = c.name;
      tr.querySelector(".col-parent").textContent = c.parentName || "-";
      tr.querySelector(".delete-btn").addEventListener("click", () => openConfirm(c));
      tbody.appendChild(tr);
    });

    el("page-info").textContent = `Page ${state.page} of ${state.totalPages}`;
    el("prev-page").disabled = state.page <= 1;
    el("next-page").disabled = state.page >= state.totalPages;
  }

  function openConfirm(category) {
    state.pendingDelete = category;
    el("confirm-text").textContent = `Are you sure you want to delete ${category.name}?`;
    el("confirm-modal").classList.add("open");
  }

  function closeConfirm() {
    state.pendingDelete = null;
    el("confirm-modal").classList.remove("open");
  }

  el("confirm-no").addEventListener("click", closeConfirm);
  el("confirm-yes").addEventListener("click", async () => {
    const category = state.pendingDelete;
    closeConfirm();
    const { status, body } = await api("DELETE", "/api/admin/categories/" + category.id);
    Flash.show(status === 200 ? "success" : "error", body.message);
    await loadCategories();
  });

  el("search-btn").addEventListener("click", () => {
    state.page = 1;
    loadCategories();
  });
  el("search").addEventListener("keydown", (e) => {
    if (e.key === "Enter") el("search-btn").click();
  });
  el("reset-btn").addEventListener("click", () => {
    el("search").value = "";
    el("parent-filter").value = "";
    el("sort-by").value = "id";
    el("sort-dir").value = "asc";
    state.page = 1;
    loadCategories();
  });
  el("prev-page").addEventListener("click", () => {
    state.page -= 1;
    loadCategories();
  });
  el("next-page").addEventListener("click", () => {
    state.page += 1;
    loadCategories();
  });

  loadParents().then(loadCategories);
})();
