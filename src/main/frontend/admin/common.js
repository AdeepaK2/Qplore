// Shared helpers for the QPlore Admin App
const TOKEN_KEY = "qplore_admin_token";
const USER_KEY = "qplore_admin_user";
const FLASH_KEY = "qplore_flash";

const Auth = {
  token: () => localStorage.getItem(TOKEN_KEY),
  username: () => localStorage.getItem(USER_KEY) || "",
  save(token, username) {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, username);
  },
  clear() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  },
  /** Sends a not-logged-in user to the login page. */
  guard() {
    if (!Auth.token()) {
      window.location.replace("/admin/login");
      return false;
    }
    return true;
  },
};

async function api(method, url, body) {
  const headers = {};
  if (Auth.token()) headers.Authorization = "Bearer " + Auth.token();
  if (body !== undefined) headers["Content-Type"] = "application/json";
  const res = await fetch(url, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) });
  let json = {};
  try {
    json = await res.json();
  } catch (e) {
    json = { success: false, message: "Unexpected response from server" };
  }
  if (res.status === 401 && !url.includes("/auth/login")) {
    Auth.clear();
    window.location.replace("/admin/login");
  }
  return { status: res.status, body: json };
}

const Flash = {
  set(type, message) {
    sessionStorage.setItem(FLASH_KEY, JSON.stringify({ type, message }));
  },
  show(type, message) {
    const el = document.getElementById("flash");
    if (!el) return;
    el.className = "flash " + type;
    el.textContent = message;
  },
  showPending() {
    const raw = sessionStorage.getItem(FLASH_KEY);
    if (!raw) return;
    sessionStorage.removeItem(FLASH_KEY);
    const { type, message } = JSON.parse(raw);
    Flash.show(type, message);
  },
};

function renderTopbar() {
  const userEl = document.getElementById("current-user");
  if (userEl) userEl.textContent = Auth.username();
  const logout = document.getElementById("logout-btn");
  if (logout) {
    logout.addEventListener("click", async () => {
      await api("POST", "/api/admin/auth/logout");
      Auth.clear();
      Flash.set("success", "You have been logged out successfully.");
      window.location.href = "/admin/login";
    });
  }
}
