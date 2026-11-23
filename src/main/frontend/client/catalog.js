(function () {
  const el = (id) => document.getElementById(id);

  const BADGES = {
    OUT_OF_STOCK: { text: () => "Out of Stock", cls: "badge-out" },
    LOW_STOCK: { text: (p) => `Only ${p.stock} left`, cls: "badge-low" },
    IN_STOCK: { text: () => "In Stock", cls: "badge-in" },
  };

  function card(plant) {
    const badge = BADGES[plant.stockStatus];
    const div = document.createElement("div");
    div.className = "plant-card";
    div.dataset.id = plant.id;
    div.innerHTML = `
      <div class="plant-name"></div>
      <div class="plant-category"></div>
      <div class="plant-price"></div>
      <span class="stock-badge ${badge.cls}"></span>
      <button class="btn btn-primary buy-btn" type="button">Buy</button>`;
    div.querySelector(".plant-name").textContent = plant.name;
    div.querySelector(".plant-category").textContent = [plant.parentCategoryName, plant.categoryName].filter(Boolean).join(" > ");
    div.querySelector(".plant-price").textContent = "Rs. " + plant.price;
    div.querySelector(".stock-badge").textContent = badge.text(plant);
    div.querySelector(".buy-btn").addEventListener("click", () => {
      const info = el("info");
      info.hidden = false;
      info.textContent = "Please log in to buy plants. Client login arrives in the next release.";
    });
    return div;
  }

  async function load() {
    const search = el("search").value.trim();
    const res = await fetch("/api/client/public/plants" + (search ? "?search=" + encodeURIComponent(search) : ""));
    const body = await res.json();
    const grid = el("plant-grid");
    grid.innerHTML = "";
    const plants = body.data || [];
    plants.forEach((p) => grid.appendChild(card(p)));
    el("empty-message").hidden = plants.length > 0;
  }

  el("search-btn").addEventListener("click", load);
  el("search").addEventListener("keydown", (e) => {
    if (e.key === "Enter") load();
  });
  load();
})();
