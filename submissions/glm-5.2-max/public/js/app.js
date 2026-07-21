import { store } from "./store.js";
import { getAllPokemonRefs, getPokemon, getCompositePokemon } from "./api.js";
import { capitalize, debounce, getTypeColor } from "./utils.js";
import { getOfficialArtwork, TOTAL_POKEMON, TYPE_LIST } from "./data.js";

import { renderPokedex } from "./views/pokedex.js";
import { renderDetail } from "./views/detail.js";
import { renderTypes } from "./views/types.js";
import { renderAbilities } from "./views/abilities.js";
import { renderMoves } from "./views/moves.js";
import { renderItems } from "./views/items.js";
import { renderBerries } from "./views/berries.js";
import { renderNatures } from "./views/natures.js";
import { renderGenerations } from "./views/generations.js";
import { renderCompare } from "./views/compare.js";
import { renderTeam } from "./views/team.js";
import { renderFavorites } from "./views/favorites.js";

const routes = {
  "/": renderPokedex,
  "/pokemon/:id": renderDetail,
  "/types": renderTypes,
  "/abilities": renderAbilities,
  "/moves": renderMoves,
  "/items": renderItems,
  "/berries": renderBerries,
  "/natures": renderNatures,
  "/generations": renderGenerations,
  "/compare": renderCompare,
  "/team": renderTeam,
  "/favorites": renderFavorites,
};

const viewContainer = document.getElementById("view-container");
let currentScrollY = 0;

function matchRoute(hash) {
  const path = hash.replace(/^#/, "") || "/";
  const parts = path.split("/").filter(Boolean);

  if (parts.length === 0) return { handler: routes["/"], params: {} };
  if (parts.length === 2 && parts[0] === "pokemon") {
    return { handler: routes["/pokemon/:id"], params: { id: parts[1] } };
  }
  const key = "/" + parts.join("/");
  if (routes[key]) return { handler: routes[key], params: {} };
  return { handler: routes["/"], params: {} };
}

async function navigate() {
  const hash = window.location.hash || "#/";
  const { handler, params } = matchRoute(hash);

  currentScrollY = window.scrollY;
  viewContainer.innerHTML = "";
  window.scrollTo(0, 0);

  updateActiveNav(hash);

  try {
    await handler(viewContainer, params);
  } catch (err) {
    console.error("Route error:", err);
    viewContainer.innerHTML = `
      <div class="error-state">
        <h3>Something went wrong</h3>
        <p>${err.message}</p>
        <button class="btn mt-4" onclick="location.hash='/'">Go Home</button>
      </div>`;
  }
}

function updateActiveNav(hash) {
  const path = hash.replace(/^#/, "") || "/";
  const parts = path.split("/").filter(Boolean);
  const currentKey = parts.length === 0 ? "/" : "/" + parts[0];

  document.querySelectorAll(".nav-link").forEach((link) => {
    const route = link.getAttribute("data-route");
    link.classList.toggle("active", route === currentKey);
  });
}

function setupNav() {
  const menuToggle = document.getElementById("nav-menu-toggle");
  const navLinks = document.querySelector(".nav-links");

  menuToggle.addEventListener("click", () => {
    navLinks.classList.toggle("open");
  });

  document.querySelectorAll(".nav-link").forEach((link) => {
    link.addEventListener("click", () => {
      navLinks.classList.remove("open");
    });
  });

  const themeToggle = document.getElementById("theme-toggle");
  themeToggle.addEventListener("click", () => {
    store.toggleTheme();
  });

  const searchBtn = document.getElementById("nav-search-btn");
  const searchOverlay = document.getElementById("search-overlay");
  const searchInput = document.getElementById("global-search");

  searchBtn.addEventListener("click", () => {
    searchOverlay.classList.remove("hidden");
    searchInput.focus();
    document.body.classList.add("no-scroll");
  });

  searchOverlay.addEventListener("click", (e) => {
    if (e.target === searchOverlay) closeSearch();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !searchOverlay.classList.contains("hidden")) {
      closeSearch();
    }
    if ((e.key === "/" || (e.key === "k" && (e.metaKey || e.ctrlKey))) && searchOverlay.classList.contains("hidden")) {
      if (e.target.tagName !== "INPUT" && e.target.tagName !== "TEXTAREA") {
        e.preventDefault();
        searchBtn.click();
      }
    }
  });

  setupGlobalSearch();
}

function closeSearch() {
  const searchOverlay = document.getElementById("search-overlay");
  const searchInput = document.getElementById("global-search");
  searchOverlay.classList.add("hidden");
  searchInput.value = "";
  document.getElementById("search-results").innerHTML = "";
  document.body.classList.remove("no-scroll");
}

let searchPokemonList = null;

async function ensureSearchList() {
  if (searchPokemonList) return searchPokemonList;
  const refs = await getAllPokemonRefs();
  searchPokemonList = refs;
  return searchPokemonList;
}

function setupGlobalSearch() {
  const searchInput = document.getElementById("global-search");
  const resultsContainer = document.getElementById("search-results");

  const performSearch = debounce(async (query) => {
    if (!query.trim()) {
      resultsContainer.innerHTML = "";
      return;
    }

    const list = await ensureSearchList();
    const q = query.toLowerCase().trim();
    const numMatch = q.match(/^\d+$/);

    let results;
    if (numMatch) {
      const id = parseInt(numMatch[0]);
      results = list.filter((p) => p.id === id);
    } else {
      results = list.filter((p) => p.name.startsWith(q) || p.name.includes(q)).slice(0, 20);
    }

    if (results.length === 0) {
      resultsContainer.innerHTML = `<div class="search-no-results">No Pokemon found for "${query}"</div>`;
      return;
    }

    resultsContainer.innerHTML = results
      .map(
        (p) => `
      <div class="search-result-item" data-id="${p.id}">
        <img class="search-result-sprite" src="${getOfficialArtwork(p.id)}" alt="${p.name}" loading="lazy" onerror="this.src='https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${p.id}.png'">
        <div class="search-result-info">
          <span class="search-result-name">${capitalize(p.name)}</span>
          <span class="search-result-id">#${String(p.id).padStart(4, "0")}</span>
        </div>
      </div>`,
      )
      .join("");

    resultsContainer.querySelectorAll(".search-result-item").forEach((item) => {
      item.addEventListener("click", () => {
        const id = item.getAttribute("data-id");
        closeSearch();
        window.location.hash = `#/pokemon/${id}`;
      });
    });
  }, 200);

  searchInput.addEventListener("input", (e) => {
    performSearch(e.target.value);
  });

  searchInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      const first = resultsContainer.querySelector(".search-result-item");
      if (first) first.click();
    }
  });
}

function setupFavoritesListener() {
  store.on("favorites", () => {
    document.querySelectorAll(".fav-btn").forEach((btn) => {
      const id = parseInt(btn.getAttribute("data-id"));
      if (id) {
        const isFav = store.isFavorite(id);
        btn.classList.toggle("active", isFav);
        btn.textContent = isFav ? "\u2665" : "\u2661";
      }
    });
  });
}

export function toast(message, duration = 2500) {
  const container = document.getElementById("toast-container");
  const el = document.createElement("div");
  el.className = "toast";
  el.textContent = message;
  container.appendChild(el);
  setTimeout(() => {
    el.classList.add("removing");
    setTimeout(() => el.remove(), 300);
  }, duration);
}

function init() {
  store.init();
  setupNav();
  setupFavoritesListener();
  window.addEventListener("hashchange", navigate);
  navigate();
}

init();
