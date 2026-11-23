(function () {
  if (!Auth.guard()) return;
  renderTopbar();

  const el = (id) => document.getElementById(id);
  const match = window.location.pathname.match(/\/admin\/categories\/edit\/([^/]+)$/);
  const editId = match ? match[1] : null;

  if (editId) el("page-heading").textContent = "Edit Category";

  async function loadParents() {
    const { status, body } = await api("GET", "/api/admin/categories/main");
    if (status !== 200) return;
    body.data
      .filter((c) => String(c.id) !== String(editId))
      .forEach((c) => {
        const opt = document.createElement("option");
        opt.value = c.id;
        opt.textContent = c.name;
        el("parent").appendChild(opt);
      });
  }

  async function loadCategory() {
    const { status, body } = await api("GET", "/api/admin/categories/" + editId);
    if (status !== 200) {
      Flash.show("error", body.message);
      el("save-btn").disabled = true;
      return;
    }
    el("name").value = body.data.name;
    el("parent").value = body.data.parentId === null ? "" : String(body.data.parentId);
  }

  function clearErrors() {
    ["name-error", "parent-error"].forEach((id) => (el(id).textContent = ""));
    el("flash").className = "flash";
  }

  el("category-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    clearErrors();
    const payload = { name: el("name").value, parentId: el("parent").value === "" ? null : Number(el("parent").value) };

    const { status, body } = editId
      ? await api("PUT", "/api/admin/categories/" + editId, payload)
      : await api("POST", "/api/admin/categories", payload);

    if (status === 200 || status === 201) {
      Flash.set("success", editId ? body.message : "Category created sucessfully");
      window.location.href = "/admin/categories";
      return;
    }
    if (body.errors) {
      Object.entries(body.errors).forEach(([field, msg]) => {
        const target = field === "parentId" ? "parent-error" : field + "-error";
        if (el(target)) el(target).textContent = msg;
      });
    } else {
      Flash.show("error", body.message);
    }
  });

  loadParents().then(() => (editId ? loadCategory() : undefined));
})();
