const STORAGE_KEY = "my-copilot-workshop-todos";
const todoForm = document.querySelector("#todo-form");
const todoInput = document.querySelector("#todo-input");
const todoList = document.querySelector("#todo-list");
const emptyState = document.querySelector("#empty-state");
const remainingCount = document.querySelector("#remaining-count");
const themeToggle = document.querySelector("#theme-toggle");
const filterBar = document.querySelector(".filter-bar");
const themeStorageKey = "my-copilot-workshop-theme";
const colorSchemeQuery = window.matchMedia("(prefers-color-scheme: dark)");

let activeFilter = "all";
let themePreference = loadThemePreference();

function loadThemePreference() {
  try {
    const savedTheme = localStorage.getItem(themeStorageKey);
    return savedTheme === "light" || savedTheme === "dark" ? savedTheme : null;
  } catch {
    return null;
  }
}

function applyTheme() {
  const theme = themePreference || (colorSchemeQuery.matches ? "dark" : "light");
  document.documentElement.dataset.theme = theme;
  themeToggle.setAttribute("aria-pressed", String(theme === "dark"));
  themeToggle.innerHTML = theme === "dark"
    ? '<span aria-hidden="true">☀️</span><span>淺色模式</span>'
    : '<span aria-hidden="true">🌙</span><span>深色模式</span>';
}

// 載入本機待辦資料；資料格式不正確時以空清單開始。
function loadTodos() {
  try {
    const savedTodos = localStorage.getItem(STORAGE_KEY);
    const parsedTodos = savedTodos ? JSON.parse(savedTodos) : [];

    if (!Array.isArray(parsedTodos)) {
      return [];
    }

    return parsedTodos.filter((todo) =>
      todo &&
      typeof todo.id === "string" &&
      typeof todo.text === "string" &&
      typeof todo.completed === "boolean"
    );
  } catch {
    return [];
  }
}

let todos = loadTodos();

function saveTodos() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
  } catch {
    // 瀏覽器停用本機儲存時，清單仍可在目前頁面操作。
  }
}

function renderTodos() {
  todoList.replaceChildren();

  const visibleTodos = todos.filter((todo) => {
    if (activeFilter === "active") {
      return !todo.completed;
    }

    if (activeFilter === "completed") {
      return todo.completed;
    }

    return true;
  });

  for (const todo of visibleTodos) {
    const item = document.createElement("li");
    item.className = `todo-item${todo.completed ? " is-complete" : ""}`;
    item.dataset.id = todo.id;

    const checkbox = document.createElement("input");
    checkbox.className = "todo-checkbox";
    checkbox.type = "checkbox";
    checkbox.checked = todo.completed;
    checkbox.dataset.action = "toggle";
    checkbox.setAttribute("aria-label", `標示「${todo.text}」為${todo.completed ? "未完成" : "已完成"}`);

    const text = document.createElement("span");
    text.className = "todo-text";
    text.textContent = todo.text;

    const deleteButton = document.createElement("button");
    deleteButton.className = "delete-button";
    deleteButton.type = "button";
    deleteButton.dataset.action = "delete";
    deleteButton.textContent = "刪除";
    deleteButton.setAttribute("aria-label", `刪除「${todo.text}」`);

    item.append(checkbox, text, deleteButton);
    todoList.append(item);
  }

  const remaining = todos.filter((todo) => !todo.completed).length;
  remainingCount.textContent = `未完成:${remaining} 項`;
  emptyState.hidden = visibleTodos.length > 0;

  if (todos.length === 0) {
    emptyState.textContent = "還沒有任何待辦事項，新增一個吧！";
  } else if (activeFilter === "active") {
    emptyState.textContent = "沒有未完成的待辦事項。";
  } else if (activeFilter === "completed") {
    emptyState.textContent = "目前沒有已完成的事項。篩選只會隱藏項目，並未刪除；可切換「全部」或「未完成」查看。";
  } else {
    emptyState.textContent = "沒有符合條件的待辦事項。";
  }
}

themeToggle.addEventListener("click", () => {
  const currentTheme = document.documentElement.dataset.theme;
  themePreference = currentTheme === "dark" ? "light" : "dark";

  try {
    localStorage.setItem(themeStorageKey, themePreference);
  } catch {
    // 瀏覽器停用本機儲存時，主題仍可在目前頁面切換。
  }

  applyTheme();
});

colorSchemeQuery.addEventListener("change", () => {
  if (!themePreference) {
    applyTheme();
  }
});

filterBar.addEventListener("click", (event) => {
  const button = event.target.closest("[data-filter]");

  if (!button) {
    return;
  }

  activeFilter = button.dataset.filter;

  for (const filterButton of filterBar.querySelectorAll("[data-filter]")) {
    const isActive = filterButton === button;
    filterButton.classList.toggle("is-active", isActive);
    filterButton.setAttribute("aria-pressed", String(isActive));
  }

  renderTodos();
});

todoForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const text = todoInput.value.trim();

  if (!text) {
    todoInput.focus();
    return;
  }

  todos.unshift({
    id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    text,
    completed: false,
  });

  todoInput.value = "";
  saveTodos();
  renderTodos();
  todoInput.focus();
});

todoList.addEventListener("change", (event) => {
  if (!event.target.matches('[data-action="toggle"]')) {
    return;
  }

  const item = event.target.closest(".todo-item");
  const todo = todos.find((entry) => entry.id === item.dataset.id);

  if (todo) {
    todo.completed = event.target.checked;
    saveTodos();
    renderTodos();
  }
});

todoList.addEventListener("click", (event) => {
  const deleteButton = event.target.closest('[data-action="delete"]');

  if (!deleteButton) {
    return;
  }

  const item = deleteButton.closest(".todo-item");
  todos = todos.filter((todo) => todo.id !== item.dataset.id);
  saveTodos();
  renderTodos();
});

applyTheme();
renderTodos();
