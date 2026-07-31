"use strict";

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const num = (n) => `#${String(n).padStart(4, "0")}`;
const cap = (s) => (s == null ? "" : String(s).replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()));


const TYPE_ORDER = [
  "normal", "fire", "water", "electric", "grass", "ice",
  "fighting", "poison", "ground", "flying", "psychic", "bug",
  "rock", "ghost", "dragon", "dark", "steel", "fairy",
];
const TYPE_COLOR = (t) => {
  const map = {
    normal: "#a8a77a", fire: "#ee8130", water: "#6390f0", electric: "#f7d02c",
    grass: "#7ac74c", ice: "#96d9d6", fighting: "#c22e28", poison: "#a33ea1",
    ground: "#e2bf65", flying: "#a98ff3", psychic: "#f95587", bug: "#a6b91a",
    rock: "#b6a136", ghost: "#735797", dragon: "#6f35fc", dark: "#705746",
    steel: "#b7b7ce", fairy: "#d685ad",
  };
  return map[t] || "#8b93ab";
};
const TYPE_DARK = (t) => {
  const map = {
    normal: "#6b6a4f", fire: "#a85a1f", water: "#3f64bd", electric: "#b39b1d",
    grass: "#569135", ice: "#5da9a4", fighting: "#8a201b", poison: "#6d2a6b",
    ground: "#ab8f43", flying: "#7a5fd0", psychic: "#c03a66", bug: "#7b8913",
    rock: "#8a7a29", ghost: "#503f6b", dragon: "#4d21c2", dark: "#4e3d30",
    steel: "#8888a3", fairy: "#b05f8b",
  };
  return map[t] || "#6a6f7d";
};
const TYPE_ICON = (t) => {
  const map = {
    normal: "●", fire: "▲", water: "▼", electric: "✦", grass: "❀", ice: "❄",
    fighting: "✊", poison: "☠", ground: "◈", flying: "✧", psychic: "✶", bug: "❁",
    rock: "◼", ghost: "✺", dragon: "✦", dark: "✩", steel: "⬢", fairy: "★",
  };
  return map[t] || "●";
};
const STAT_NAMES = {
  hp: "HP",
  attack: "Attack",
  defense: "Defense",
  "special-attack": "Sp. Atk",
  "special-defense": "Sp. Def",
  speed: "Speed",
};
const LANG_NAMES = {
  en: "English", ja: "Japanese", "zh-Hans": "Chinese (S)", fr: "Français",
  de: "Deutsch", es: "Español", it: "Italiano", ko: "한국어",
};
const LANG_ORDER = ["en", "ja", "zh-Hans", "fr", "de", "es", "it", "ko"];
const GROWTH_RATES = { "slow": "Slow", "medium": "Medium", "fast": "Fast", "medium-slow": "Medium-slow", "slow-then-very-fast": "Slow → Very fast", "fast-then-very-slow": "Fast → Very slow" };
const HABITATS = { "cave": "Cave", "forest": "Forest", "grassland": "Grassland", "mountain": "Mountain", "rare": "Rare", "rough-terrain": "Rough terrain", "sea": "Sea", "urban": "Urban", "waters-edge": "Water's edge" };
const EGG_GROUPS = { "monster": "Monster", "water1": "Water 1", "bug": "Bug", "flying": "Flying", "field": "Field", "fairy": "Fairy", "grass": "Grass", "human-like": "Human-like", "water3": "Water 3", "mineral": "Mineral", "amorphous": "Amorphous", "water2": "Water 2", "ditto": "Ditto", "dragon": "Dragon", "undiscovered": "Undiscovered" };
const METHOD_ORDER = { "level-up": 0, egg: 1, machine: 2, tutor: 3, other: 4 };
const METHOD_LABEL = { "level-up": "Level up", egg: "Egg", machine: "TM / TR", tutor: "Tutor", other: "Other" };
const STAT_GRADIENT = {
  hp: "linear-gradient(90deg,#3ecf7a,#7ce9a8)",
  attack: "linear-gradient(90deg,#ff5d6c,#ff8b96)",
  defense: "linear-gradient(90deg,#f5b84a,#ffd27a)",
  "special-attack": "linear-gradient(90deg,#b06dff,#d0a4ff)",
  "special-defense": "linear-gradient(90deg,#6d8dff,#9db4ff)",
  speed: "linear-gradient(90deg,#36c5c5,#7ce3e3)",
};


const COLLECTION_KEY = "dex.ultra.collection.v1";
const FILTER_KEY = "dex.ultra.filters.v1";
const state = {
  cards: [],
  meta: null,
  typesData: null,
  filters: { type: "all", gen: "all", special: "all", search: "", sort: "id" },
  page: 0,
  pageSize: 180,
  detail: null, // current pokemon detail
  detailMoves: new Map(), // name -> Move
  abilityCache: new Map(),
  itemCache: new Map(),
  spriteMode: "artwork",
  shiny: false,
  compare: { a: null, b: null },
};
const collection = loadCollection();
function loadCollection() {
  try { return JSON.parse(localStorage.getItem(COLLECTION_KEY)) || { caught: {}, shiny: {} }; }
  catch { return { caught: {}, shiny: {} }; }
}
function saveCollection() {
  localStorage.setItem(COLLECTION_KEY, JSON.stringify(collection));
  updateCollectionUI();
}
function isCaught(id) { return !!collection.caught[id]; }
function isShiny(id) { return !!collection.shiny[id]; }


const apiCache = new Map();
async function api(path) {
  if (apiCache.has(path)) return apiCache.get(path);
  const res = await fetch(path);
  if (!res.ok) throw new Error(`${path} → ${res.status}`);
  const data = await res.json();
  apiCache.set(path, data);
  return data;
}
const getCards = () => api("/api/pokemon");
const getMeta = () => api("/api/meta");
const getTypes = () => api("/api/types");
const getPokemon = (id) => api(`/api/pokemon/${id}`);
const getRandom = () => api("/api/random");
const getMoves = async (names) => {
  const need = [...names].filter((n) => !state.detailMoves.has(n));
  for (let i = 0; i < need.length; i += 40) {
    const batch = await api(`/api/moves?names=${encodeURIComponent(need.slice(i, i + 40).join(","))}`);
    for (const [k, v] of Object.entries(batch)) state.detailMoves.set(k, v);
  }
  return state.detailMoves;
};
const getAbilities = async (names) => {
  const need = [...names].filter((n) => !state.abilityCache.has(n));
  for (let i = 0; i < need.length; i += 40) {
    const batch = await api(`/api/abilities?names=${encodeURIComponent(need.slice(i, i + 40).join(","))}`);
    for (const [k, v] of Object.entries(batch)) state.abilityCache.set(k, v);
  }
  return state.abilityCache;
};
const getItems = async (names) => {
  const need = [...names].filter((n) => !state.itemCache.has(n));
  for (let i = 0; i < need.length; i += 40) {
    const batch = await api(`/api/items?names=${encodeURIComponent(need.slice(i, i + 40).join(","))}`);
    for (const [k, v] of Object.entries(batch)) state.itemCache.set(k, v);
  }
  return state.itemCache;
};


const audioCache = new Map();
let audioCtx = null;
async function playCry(url) {
  try {
    audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === "suspended") await audioCtx.resume();
    if (!audioCache.has(url)) {
      const res = await fetch(url);
      const buf = await res.arrayBuffer();
      audioCache.set(url, await audioCtx.decodeAudioData(buf));
    }
    const src = audioCtx.createBufferSource();
    src.buffer = audioCache.get(url);
    const gain = audioCtx.createGain();
    gain.gain.value = 0.8;
    src.connect(gain).connect(audioCtx.destination);
    src.start();
  } catch { /* audio not supported */ }
}


let toastTimer = null;
function toast(msg) {
  const el = $("#toast");
  el.textContent = msg;
  el.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove("show"), 2200);
}


function matchesSearch(card) {
  const q = state.filters.search.trim().toLowerCase();
  if (!q) return true;
  if (String(card.id) === q) return true;
  if (card.name.toLowerCase().includes(q)) return true;
  if (card.types.some((t) => t.includes(q))) return true;
  return false;
}

function filteredCards() {
  const { type, gen, special, search } = state.filters;
  let list = state.cards.filter((c) => {
    if (type !== "all" && !c.types.includes(type)) return false;
    if (gen !== "all" && c.generation !== Number(gen)) return false;
    if (special === "legendary" && !c.legendary) return false;
    if (special === "mythical" && !c.mythical) return false;
    if (special === "regular" && (c.legendary || c.mythical)) return false;
    if (special === "caught" && !isCaught(c.id)) return false;
    if (special === "uncaught" && isCaught(c.id)) return false;
    return true;
  });
  if (search) list = list.filter(matchesSearch);
  const s = state.filters.sort;
  list = [...list].sort((a, b) => {
    if (s === "name") return a.name.localeCompare(b.name);
    if (s === "statTotal") return b.baseStatTotal - a.baseStatTotal || a.id - b.id;
    if (s === "height") return a.height - b.height || a.id - b.id;
    if (s === "weight") return a.weight - b.weight || a.id - b.id;
    return a.id - b.id;
  });
  return list;
}

function setFilter(partial) {
  Object.assign(state.filters, partial);
  persistFilters();
  state.page = 0;
  renderGrid();
  updateFilterUI();
}

function persistFilters() {
  try { localStorage.setItem(FILTER_KEY, JSON.stringify(state.filters)); } catch {}
}


const grid = $("#grid");
const sentinel = $("#sentinel");
let obs = null;

function renderGrid() {
  const list = filteredCards();
  const count = list.length;
  $("#result-count").textContent = `${count} Pokémon`;
  $("#reset-filters").hidden = isDefaultFilters();

  const total = list.length;
  state.page = 0;
  grid.innerHTML = "";
  if (total === 0) {
    grid.innerHTML = `<div class="grid-loading">No Pokémon match — try clearing filters.</div>`;
    sentinel.hidden = true;
    return;
  }
  sentinel.hidden = false;
  window.scrollTo({ top: 0 });
  appendPage(list);
}

function appendPage(list) {
  const start = state.page * state.pageSize;
  const end = Math.min(start + state.pageSize, list.length);
  const frag = document.createDocumentFragment();
  for (let i = start; i < end; i++) frag.appendChild(cardEl(list[i]));
  grid.appendChild(frag);
  state.page++;
}

function cardEl(card) {
  const el = document.createElement("article");
  const types = card.types.map((t) => `<span class="type-badge" style="background:${TYPE_DARK(t)}">${cap(t)}</span>`).join("");
  const marks = [
    isCaught(card.id) ? `<span class="mark on" title="Caught">✓</span>` : "",
    isShiny(card.id) ? `<span class="mark on" title="Shiny">✨</span>` : "",
  ].join("");
  el.className = "card";
  el.tabIndex = 0;
  el.setAttribute("role", "button");
  el.setAttribute("aria-label", `${card.name}, ${num(card.id)}, ${card.types.join(" and ")}`);
  el.style.setProperty("--type-color", TYPE_COLOR(card.types[0]));
  el.style.setProperty("--type-glow", TYPE_COLOR(card.types[0]) + "44");
  el.innerHTML = `
    <div class="card-top">
      <span class="card-num">${num(card.id)}</span>
      <span class="card-marks">${marks}</span>
    </div>
    <div class="card-art">
      <img loading="lazy" decoding="async" src="${esc(card.artwork)}"
           alt="${esc(card.name)}" onerror="this.onerror=null;this.src='${esc(card.sprite)}'" />
    </div>
    <div class="card-name">${esc(card.name.replace(/-/g, " "))}</div>
    <div class="card-sub">${types}</div>
    <div class="card-extra">
      <span><b>${card.baseStatTotal}</b> BST</span>
      <span>${(card.height / 10).toFixed(1)} m</span>
      <span>${(card.weight / 10).toFixed(1)} kg</span>
    </div>`;
  el.addEventListener("click", () => openPokemon(card.id));
  el.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openPokemon(card.id); }
  });
  return el;
}

function setupInfiniteScroll() {
  if (obs) obs.disconnect();
  obs = new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting) {
      const list = filteredCards();
      if (state.page * state.pageSize < list.length) appendPage(list);
    }
  }, { rootMargin: "600px" });
  obs.observe(sentinel);
}


function buildTypeChips() {
  const wrap = $("#type-filter");
  wrap.innerHTML = TYPE_ORDER.map((t) => `
    <button class="type-chip ${state.filters.type === t ? "active" : ""}" data-type="${t}"
            style="background:${TYPE_COLOR(t)}" role="checkbox" aria-checked="${state.filters.type === t}">
      <span class="dot"></span>${cap(t)}
    </button>`).join("");
}

function buildGenSelect() {
  const sel = $("#gen-filter");
  sel.innerHTML = `<option value="all">All generations</option>` +
    (state.meta?.generations || []).map((g) => `<option value="${g}">Generation ${g}</option>`).join("");
  sel.value = state.filters.gen;
}

function isDefaultFilters() {
  const f = state.filters;
  return f.type === "all" && f.gen === "all" && f.special === "all" && !f.search.trim() && f.sort === "id";
}

function updateFilterUI() {
  $$(".type-chip").forEach((ch) => {
    const on = ch.dataset.type === state.filters.type;
    ch.classList.toggle("active", on);
    ch.setAttribute("aria-checked", String(on));
  });
  $("#gen-filter").value = state.filters.gen;
  $("#sort-select").value = state.filters.sort;
  $("#special-filter").value = state.filters.special;
  $("#search").value = state.filters.search;
  $("#search-clear").hidden = !state.filters.search;
  $("#reset-filters").hidden = isDefaultFilters();
}


const detailRoot = $("#detail-root");
let currentTab = "about";

function openPokemon(id) {
  if (location.hash !== `#/pokemon/${id}`) location.hash = `#/pokemon/${id}`;
  else showPokemon(id);
}

async function showPokemon(id) {
  detailRoot.innerHTML = `<div class="overlay"><div class="detail"><div class="spinner"></div></div></div>`;
  try {
    const detail = await getPokemon(id);
    state.detail = detail;
    state.shiny = isShiny(id);
    currentTab = "about";
    renderDetail(detail);
  } catch {
    detailRoot.innerHTML = `<div class="overlay"><div class="detail"><div class="grid-loading">Failed to load ${num(id)}.</div></div></div>`;
  }
}

function closeDetail() {
  if (location.hash.startsWith("#/pokemon/")) history.pushState(null, "", "#/");
  detailRoot.innerHTML = "";
  state.detail = null;
  document.body.style.overflow = "";
}

function renderDetail(d) {
  const sprites = state.shiny ? d.sprites.artworkShiny : d.sprites.artwork;
  const types = d.types.map((t) => `<span class="type-badge" style="background:${TYPE_DARK(t)}">${cap(t)}</span>`).join("");
  const rarity = [
    d.species.isLegendary ? `<span class="rarity-badge legendary">Legendary</span>` : "",
    d.species.isMythical ? `<span class="rarity-badge mythical">Mythical</span>` : "",
    d.species.isBaby ? `<span class="rarity-badge baby">Baby</span>` : "",
  ].join("");
  const localNames = (d.names && Object.keys(d.names).length
    ? Object.entries(d.names).filter(([l]) => l !== "en").map(([l, n]) => `${n} (${LANG_NAMES[l] || l})`).join(" · ")
    : "");

  const typeBg = d.types.map((t) => `${TYPE_COLOR(t)}1f`).join(", ");
  const idx = state.cards.findIndex((c) => c.id === d.id);
  const prevId = idx > 0 ? state.cards[idx - 1].id : null;
  const nextId = idx < state.cards.length - 1 ? state.cards[idx + 1].id : null;

  detailRoot.innerHTML = `
  <div class="overlay" role="dialog" aria-modal="true" aria-label="${esc(d.name)}">
    <div class="overlay-backdrop" data-close></div>
    <div class="detail" data-detail>
      <div class="detail-head">
        <div class="detail-nav">
          <button class="icon-btn" data-close aria-label="Close">✕</button>
          <span class="title">${esc(cap(d.name))}</span>
        </div>
        <div class="detail-nav">
          ${prevId !== null ? `<button class="btn btn-sm btn-ghost" data-nav="${prevId}" aria-label="Previous">← ${num(prevId)}</button>` : ""}
          ${nextId !== null ? `<button class="btn btn-sm btn-ghost" data-nav="${nextId}" aria-label="Next">${num(nextId)} →</button>` : ""}
          <button class="btn btn-sm btn-ghost" data-copy aria-label="Copy link">🔗</button>
          <button class="btn btn-sm btn-ghost" data-compare aria-label="Compare">⚖</button>
        </div>
      </div>

      <div class="detail-hero">
        <div class="detail-art ${state.shiny ? "shiny" : ""}" style="--type-bg:radial-gradient(circle at 50% 40%, ${typeBg}, transparent 70%)">
          <span class="shiny-badge">Shiny</span>
          <img id="detail-art-img" src="${esc(sprites)}" alt="${esc(d.name)}"
               onerror="this.onerror=null;this.src='${state.shiny ? esc(d.sprites.shiny) : esc(d.sprites.default)}'" />
        </div>
        <div class="detail-identity">
          <div class="num">${num(d.id)} · ${d.species.isMythical ? "Mythical" : d.species.isLegendary ? "Legendary" : ""}</div>
          <h2>${esc(cap(d.name))}</h2>
          ${d.genus ? `<div class="genus">${esc(d.genus)}</div>` : ""}
          ${localNames ? `<div class="local-names">${localNames}</div>` : ""}
          <div class="badges">${types}${rarity}</div>
          <div class="hero-actions">
            <button class="btn btn-sm" data-shiny>${state.shiny ? "✨ Shiny: On" : "✨ Shiny: Off"}</button>
            <button class="btn btn-sm" data-cry>🔊 Cry</button>
            <button class="btn btn-sm" data-catch>${isCaught(d.id) ? "✓ Caught" : "☐ Mark caught"}</button>
            <span class="btn btn-sm btn-ghost sprite-switch">
              <label class="sr-only" style="display:none" for="sprite-mode">Sprite</label>
              <select id="sprite-mode" class="select" style="padding:4px 8px;font-size:12px">
                <option value="artwork" ${state.spriteMode === "artwork" ? "selected" : ""}>Official</option>
                <option value="home" ${state.spriteMode === "home" ? "selected" : ""}>Home</option>
                <option value="dream" ${state.spriteMode === "dream" ? "selected" : ""}>Dream</option>
                <option value="pixel" ${state.spriteMode === "pixel" ? "selected" : ""}>Pixel</option>
              </select>
            </span>
          </div>
        </div>
      </div>

      <div class="detail-tabs" role="tablist">
        ${["about", "stats", "evolution", "moves", "matchups"].map((t) =>
          `<button class="tab-btn ${t === currentTab ? "active" : ""}" role="tab" data-tab="${t}">${cap(t)}</button>`).join("")}
      </div>

      <div class="detail-body" data-body></div>
    </div>
  </div>`;

  document.body.style.overflow = "hidden";
  detailRoot.scrollTop = 0;
  bindDetailEvents(d);
  renderTab(d);
}

async function bindDetailEvents(d) {
  const overlay = $(".overlay", detailRoot);
  const onClose = () => closeDetail();
  overlay.addEventListener("click", (e) => {
    if (e.target.closest("[data-close]")) onClose();
  });
  overlay.addEventListener("keydown", (e) => {
    if (e.key === "Escape") onClose();
  });

  const navBtns = $$("[data-nav]", overlay);
  navBtns.forEach((btn) => btn.addEventListener("click", () => openPokemon(Number(btn.dataset.nav))));

  $("[data-copy]", overlay).addEventListener("click", async () => {
    try { await navigator.clipboard.writeText(location.href); toast("Link copied"); }
    catch { toast(location.href); }
  });
  $("[data-compare]", overlay).addEventListener("click", () => openCompare(d.id));
  $("[data-cry]", overlay).addEventListener("click", () => playCry(d.cry));

  $("[data-catch]", overlay).addEventListener("click", (e) => {
    if (isCaught(d.id)) delete collection.caught[d.id];
    else collection.caught[d.id] = true;
    saveCollection();
    e.currentTarget.textContent = isCaught(d.id) ? "✓ Caught" : "☐ Mark caught";
    toast(isCaught(d.id) ? `Caught ${cap(d.name)}!` : `Released ${cap(d.name)}`);
    refreshCard(d.id);
  });

  $("[data-shiny]", overlay).addEventListener("click", (e) => {
    state.shiny = !state.shiny;
    if (state.shiny) collection.shiny[d.id] = true; else delete collection.shiny[d.id];
    saveCollection();
    e.currentTarget.textContent = state.shiny ? "✨ Shiny: On" : "✨ Shiny: Off";
    const img = $("#detail-art-img");
    img.onerror = () => { img.onerror = null; img.src = state.shiny ? d.sprites.shiny : d.sprites.default; };
    img.src = spriteFor(d, state.spriteMode);
    $(".detail-art", overlay).classList.toggle("shiny", state.shiny);
    toast(state.shiny ? `Shiny ${cap(d.name)}!` : "Shiny off");
    refreshCard(d.id);
  });

  $("#sprite-mode").addEventListener("change", (e) => {
    state.spriteMode = e.target.value;
    const img = $("#detail-art-img");
    img.onerror = () => { img.onerror = null; img.src = d.sprites.default; };
    img.src = spriteFor(d, state.spriteMode);
  });

  $$(".tab-btn", overlay).forEach((b) => {
    b.addEventListener("click", () => {
      currentTab = b.dataset.tab;
      $$(".tab-btn", overlay).forEach((x) => x.classList.toggle("active", x === b));
      renderTab(d);
    });
  });
}

function spriteFor(d, mode) {
  const s = d.sprites;
  const sh = state.shiny;
  switch (mode) {
    case "home": return sh ? s.homeShiny : s.home;
    case "dream": return s.dream;
    case "pixel": return sh ? s.shiny : s.default;
    default: return sh ? s.artworkShiny : s.artwork;
  }
}

function refreshCard(id) {
  const cards = $$(".card", grid);
  for (const c of cards) {
    if (c.querySelector(".card-num")?.textContent === num(id)) {
      c.querySelector(".card-marks").innerHTML = [
        isCaught(id) ? `<span class="mark on">✓</span>` : "",
        isShiny(id) ? `<span class="mark on">✨</span>` : "",
      ].join("");
    }
  }
}

function renderTab(d) {
  const body = $(".detail-body", detailRoot);
  if (!body) return;
  const t = currentTab;
  if (t === "about") body.innerHTML = aboutTab(d);
  else if (t === "stats") { body.innerHTML = statsTab(d); animateStatBars(); }
  else if (t === "evolution") { body.innerHTML = evolutionSkeleton(); loadEvolutionTab(d, body); }
  else if (t === "moves") { body.innerHTML = movesTabSkeleton(); loadMovesTab(d, body); }
  else if (t === "matchups") { body.innerHTML = matchupsTabSkeleton(); loadMatchupsTab(d, body); }

  const flavorLang = $("#flavor-lang", body);
  if (flavorLang) {
    flavorLang.addEventListener("change", () => {
      const ft = $("#flavor-text", body);
      if (ft && d.flavorText[flavorLang.value]) ft.textContent = d.flavorText[flavorLang.value];
    });
  }

  $$(".ability-row", body).forEach((row) => {
    row.addEventListener("click", async () => {
      const name = row.dataset.ability;
      const ability = (await getAbilities([name])).get(name);
      if (!ability) return;
      showAbilityPop(row, ability);
    });
  });
}


function aboutTab(d) {
  const sp = d.species;
  const height = d.height / 10;
  const weight = d.weight / 10;
  const gender = sp.genderRate === -1 ? "Genderless" :
    `Male ${(100 - (sp.genderRate / 8) * 100).toFixed(1)}% · Female ${((sp.genderRate / 8) * 100).toFixed(1)}%`;
  const genderBar = sp.genderRate === -1 ? "" : `
    <div class="gender-bar"><div class="male" style="width:${100 - (sp.genderRate / 8) * 100}%"></div><div class="female" style="width:${(sp.genderRate / 8) * 100}%"></div></div>`;

  const abilities = d.abilities.map((a) => `
    <div class="ability-row" data-ability="${esc(a.name)}">
      <span class="name">${esc(cap(a.name))} ${a.isHidden ? `<span class="hidden-tag">Hidden</span>` : ""}</span>
      <span class="chevron">›</span>
    </div>`).join("");

  const langSelect = Object.keys(d.flavorText).length > 1
    ? `<select id="flavor-lang" class="select" style="padding:4px 8px;font-size:12px">${LANG_ORDER
        .filter((l) => d.flavorText[l])
        .map((l) => `<option value="${l}">${LANG_NAMES[l] || l}</option>`).join("")}</select>` : "";

  return `
    <p class="flavor-text" id="flavor-text">${esc(d.flavorText.en || Object.values(d.flavorText)[0] || "No data.")}</p>
    ${langSelect}

    <div class="info-grid">
      <div class="info-card"><div class="label">Height</div><div class="value">${height} m <small>(${d.height} dm)</small></div></div>
      <div class="info-card"><div class="label">Weight</div><div class="value">${weight} kg <small>(${d.weight} hg)</small></div></div>
      <div class="info-card"><div class="label">Base experience</div><div class="value">${d.baseExperience}</div></div>
      <div class="info-card"><div class="label">Gender</div><div class="value">${gender}</div>${genderBar}</div>
      <div class="info-card"><div class="label">Egg groups</div><div class="value">${sp.eggGroups.map((g) => EGG_GROUPS[g] || cap(g)).join(", ") || "—"}</div></div>
      <div class="info-card"><div class="label">Growth rate</div><div class="value">${GROWTH_RATES[sp.growthRate] || cap(sp.growthRate)}</div></div>
      <div class="info-card"><div class="label">Habitat</div><div class="value">${HABITATS[sp.habitat] || cap(sp.habitat) || "—"}</div></div>
      <div class="info-card"><div class="label">Capture rate</div><div class="value">${sp.captureRate} <small>(${Math.round((sp.captureRate / 255) * 100)}%)</small></div></div>
      <div class="info-card"><div class="label">Base friendship</div><div class="value">${sp.baseHappiness}</div></div>
      <div class="info-card"><div class="label">Hatch steps</div><div class="value">${(sp.hatchCounter * 255).toLocaleString()}</div></div>
      <div class="info-card"><div class="label">Body shape</div><div class="value">${cap(sp.shape) || "—"}</div></div>
      <div class="info-card"><div class="label">Pokédex color</div><div class="value"><span style="display:inline-block;width:14px;height:14px;border-radius:4px;background:${sp.color};vertical-align:-2px;margin-right:6px;border:1px solid rgba(255,255,255,0.2)"></span>${cap(sp.color)}</div></div>
    </div>

    <div class="section-title">Abilities</div>
    ${abilities || "<div class='info-card'>No abilities recorded.</div>"}
  `;
}


function statsTab(d) {
  const max = 255;
  const bars = d.stats.map((s) => {
    const pct = Math.max(4, (s.base / max) * 100);
    return `
      <div class="stat-row">
        <span class="stat-name">${STAT_NAMES[s.name] || cap(s.name)}</span>
        <div class="stat-bar"><div class="stat-fill" style="width:0;background:${STAT_GRADIENT[s.name] || "linear-gradient(90deg,#6d8dff,#9db4ff)"}" data-w="${pct}"></div></div>
        <span class="stat-val">${s.base}</span>
      </div>`;
  }).join("");
  const total = d.stats.reduce((s, x) => s + x.base, 0);

  return `
    <div class="radar-wrap">
      <div>${bars}
        <div class="stat-total-row">
          <span class="label">Base Stat Total</span>
          <span class="total">${total} <small>· avg ${(total / 6).toFixed(1)}</small></span>
        </div>
      </div>
      <div>${radarSVG(d)}</div>
    </div>`;
}

function animateStatBars() {
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      $$(".stat-fill", detailRoot).forEach((f) => { f.style.width = f.dataset.w + "%"; });
    });
  });
}

function radarSVG(d) {
  const size = 300, cx = 150, cy = 150, R = 108, rings = 4, max = 255;
  const point = (val, i, n) => {
    const r = (Math.min(val, max) / max) * R;
    const a = (Math.PI * 2 * i) / n - Math.PI / 2;
    return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
  };
  const ringPaths = [];
  for (let k = 1; k <= rings; k++) {
    const pts = [];
    for (let i = 0; i < 6; i++) {
      const [x, y] = point((max / rings) * k, i, 6);
      pts.push(`${x},${y}`);
    }
    ringPaths.push(`<polygon points="${pts.join(" ")}" fill="none" stroke="rgba(255,255,255,0.09)" stroke-width="1"/>`);
  }
  const axisLines = [];
  for (let i = 0; i < 6; i++) {
    const [x, y] = point(max, i, 6);
    axisLines.push(`<line x1="${cx}" y1="${cy}" x2="${x}" y2="${y}" stroke="rgba(255,255,255,0.06)"/>`);
  }
  const statPoly = d.stats.map((s, i) => point(s.base, i, 6).join(",")).join(" ");
  const labels = d.stats.map((s, i) => {
    const [x, y] = point(max * 1.16, i, 6);
    return `<text x="${x}" y="${y}" fill="#9aa3bd" font-size="11" font-weight="600" text-anchor="middle" dominant-baseline="middle" font-family="Inter,sans-serif">${STAT_NAMES[s.name] || cap(s.name)}</text>`;
  }).join("");
  return `
    <svg class="radar" viewBox="0 0 ${size} ${size}" role="img" aria-label="Stat radar chart">
      <defs>
        <linearGradient id="radarFill" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#6d8dff" stop-opacity="0.45"/>
          <stop offset="100%" stop-color="#b06dff" stop-opacity="0.45"/>
        </linearGradient>
      </defs>
      ${axisLines.join("")}
      ${ringPaths.join("")}
      <polygon points="${statPoly}" fill="url(#radarFill)" stroke="#8fa4ff" stroke-width="2" stroke-linejoin="round">
        <animate attributeName="opacity" from="0" to="1" dur="0.5s" fill="freeze"/>
      </polygon>
      ${labels}
    </svg>`;
}


function evolutionSkeleton() {
  return `<div class="spinner"></div>`;
}

async function loadEvolutionTab(d, body) {
  if (!d.evolution) {
    body.innerHTML = `<div class="info-card">This Pokémon does not evolve.</div>`;
    return;
  }
  const items = await getItems(collectItemNames(d.evolution));
  body.innerHTML = evoNodeHTML(d.evolution, items);
  $$(".evo-node", body).forEach((node) => {
    const id = Number(node.dataset.evoId);
    node.addEventListener("click", () => { if (id) openPokemon(id); });
  });
}

function collectItemNames(node) {
  const names = new Set();
  for (const t of node.triggers) { if (t.item) names.add(t.item); if (t.heldItem) names.add(t.heldItem); }
  for (const c of node.evolvesTo) for (const n of collectItemNames(c)) names.add(n);
  return names;
}

function evoNodeHTML(node, items) {
  const chain = [
    `<div class="evo-node" data-evo-id="${node.id}" title="View ${cap(node.name)}">
      <span class="nnum">${node.id ? num(node.id) : ""}</span>
      <img loading="lazy" src="${esc(node.sprite || "")}" alt="${esc(node.name)}" onerror="this.style.display='none'"/>
      <span class="name">${esc(cap(node.name))}</span>
    </div>`,
  ];
  if (node.evolvesTo && node.evolvesTo.length) {
    const kids = node.evolvesTo.map((child) => {
      const triggers = child.triggers && child.triggers.length
        ? child.triggers.map((t) => {
            const item = t.item && items[t.item];
            const held = t.heldItem && items[t.heldItem];
            return `<div class="evo-trigger">
              <span class="arrow">▸</span>
              ${item?.sprite ? `<img src="${esc(item.sprite)}" alt="${esc(t.item)}" onerror="this.style.display='none'"/>` : ""}
              <span>${esc(t.label)}</span>
              ${held?.sprite ? `<img src="${esc(held.sprite)}" alt="holding ${esc(t.heldItem)}" onerror="this.style.display='none'"/>` : ""}
            </div>`;
          }).join("")
        : `<div class="evo-trigger"><span class="arrow">▸</span><span>Evolves</span></div>`;
      return `<div style="display:flex;align-items:center">${triggers}${evoNodeHTML(child, items)}</div>`;
    });
    chain.push(`<div class="evo-branch" style="display:flex;gap:8px;flex-wrap:wrap;align-items:center">${kids.join("")}</div>`);
  }
  return `<div class="evo-tree">${chain.join("")}</div>`;
}


function movesTabSkeleton() {
  return `<div class="move-toolbar">
      <input class="move-search" placeholder="Search moves…" />
      <div class="move-method-chips">
        <button class="method-chip active" data-method="all">All</button>
        <button class="method-chip" data-method="level-up">Level up</button>
        <button class="method-chip" data-method="machine">TM / TR</button>
        <button class="method-chip" data-method="egg">Egg</button>
        <button class="method-chip" data-method="tutor">Tutor</button>
      </div>
    </div>
    <div class="spinner"></div>`;
}

async function loadMovesTab(d, body) {
  const raw = await getMoves(d.moves.map((m) => m.name));
  const search = $(".move-search", body);
  const chips = $$(".method-chip", body);
  let filter = "all";
  let q = "";

  const grouped = { "level-up": [], egg: [], machine: [], tutor: [], other: [] };
  for (const m of d.moves) {
    const data = raw.get(m.name);
    if (!data) continue;
    const method = m.methods.includes("level-up") ? "level-up"
      : m.methods.includes("egg") ? "egg"
      : m.methods.includes("machine") ? "machine"
      : m.methods.includes("tutor") ? "tutor"
      : "other";
    grouped[method].push({ ...data, minLevel: m.minLevel });
  }
  for (const k of Object.keys(grouped)) grouped[k].sort((a, b) => {
    if (k === "level-up") return (a.minLevel ?? 999) - (b.minLevel ?? 999);
    return a.name.localeCompare(b.name);
  });

  function render() {
    let shown = false;
    let html = "";
    for (const method of ["level-up", "egg", "machine", "tutor", "other"]) {
      if (filter !== "all" && filter !== method) continue;
      const list = grouped[method].filter((m) => !q || m.name.includes(q));
      if (!list.length) continue;
      shown = true;
      html += `<div class="move-group-title">${METHOD_LABEL[method]}</div>`;
      html += `<table class="move-table">
        <thead><tr><th>${method === "level-up" ? "Lv." : ""}</th><th>Move</th><th>Type</th><th>Cat.</th><th>Power</th><th>Acc</th><th>PP</th></tr></thead><tbody>`;
      for (const m of list) {
        html += `<tr class="move-row" data-name="${esc(m.name)}">
          <td>${method === "level-up" ? (m.minLevel ?? "—") : ""}</td>
          <td><span class="mname">${esc(cap(m.name))}</span></td>
          <td>${m.type ? `<span class="type-badge" style="background:${TYPE_DARK(m.type)}">${cap(m.type)}</span>` : "—"}</td>
          <td style="color:${m.damageClass === "physical" ? "#ff8b96" : m.damageClass === "special" ? "#9db4ff" : "#9aa3bd"}">${cap(m.damageClass)}</td>
          <td>${m.power ?? "—"}</td>
          <td>${m.accuracy ?? "—"}</td>
          <td>${m.pp ?? "—"}</td>
        </tr>
        <tr class="move-detail" data-detail="${esc(m.name)}"><td colspan="7">${esc(m.shortEffect || m.effect || "No description.")}</td></tr>`;
      }
      html += `</tbody></table>`;
    }
    if (!shown) html = `<div class="move-empty">No moves match.</div>`;
    $(".move-results", body)?.remove();
    const wrap = document.createElement("div");
    wrap.className = "move-results";
    wrap.innerHTML = html;
    body.appendChild(wrap);

    $$(".move-row", body).forEach((row) => {
      row.addEventListener("click", () => {
        const det = $(`[data-detail="${CSS.escape(row.dataset.name)}"]`, body);
        if (det) det.classList.toggle("open");
      });
    });
  }

  search.addEventListener("input", () => { q = search.value.trim().toLowerCase(); render(); });
  chips.forEach((c) => c.addEventListener("click", () => {
    filter = c.dataset.method;
    chips.forEach((x) => x.classList.toggle("active", x === c));
    render();
  }));
  render();
}


function matchupsTabSkeleton() {
  return `<div class="spinner"></div>`;
}

async function loadMatchupsTab(d, body) {
  const types = await getTypes();
  renderMatchups(d, body, types);
}

function renderMatchups(d, body, types) {
  const def = TYPE_ORDER.map((t) => {
    let mult = 1;
    for (const pt of d.types) {
      const rel = types[pt];
      if (!rel) continue;
      if (rel.noDamageFrom.includes(t)) mult = 0;
      else if (rel.doubleDamageFrom.includes(t)) mult *= 2;
      else if (rel.halfDamageFrom.includes(t)) mult *= 0.5;
    }
    return { t, mult };
  }).sort((a, b) => b.mult - a.mult);

  const off = TYPE_ORDER.map((defT) => {
    let mult = 1;
    for (const atk of d.types) {
      const rel = types[defT];
      if (!rel) continue;
      if (rel.noDamageFrom.includes(atk)) mult = 0;
      else if (rel.doubleDamageFrom.includes(atk)) mult *= 2;
      else if (rel.halfDamageFrom.includes(atk)) mult *= 0.5;
    }
    return { t: defT, mult };
  }).sort((a, b) => b.mult - a.mult);

  const cls = (m) => m === 0 ? "mu-zero" : m >= 4 ? "mu-x4" : m >= 2 ? "mu-x2" : m === 1 ? "mu-x1" : m >= 0.5 ? "mu-half" : "mu-quarter";
  const tag = (m) => `<span class="mu-tag"><span class="tbadge" style="background:${TYPE_DARK(m.t)}">${TYPE_ICON[m.t]}</span>${cap(m.t)}</span>`;
  const multText = (m) => m === 0 ? "0×" : m >= 4 ? "4×" : m >= 2 ? "2×" : m === 1 ? "1×" : m >= 0.5 ? "½×" : "¼×";

  const defRows = def.map(({ t, mult }) => `
    <tr><td>${tag(t)}</td><td style="text-align:right"><span class="${cls(mult)}" style="display:inline-block;padding:3px 12px;border-radius:8px;font-weight:700">${multText(mult)}</span></td></tr>`).join("");
  const offRows = off.map(({ t, mult }) => `
    <tr><td>${tag(t)}</td><td style="text-align:right"><span class="${cls(mult)}" style="display:inline-block;padding:3px 12px;border-radius:8px;font-weight:700">${multText(mult)}</span></td></tr>`).join("");

  const defN = def.filter((x) => x.mult >= 2).length;
  const offN = off.filter((x) => x.mult >= 2).length;

  body.innerHTML = `
    <div class="section-title">Resisting (damage taken) — ${defN} weaknesses</div>
    <table class="matchup-table"><tbody>${defRows}</tbody></table>
    <div class="section-title">Attacking (damage dealt) — super effective vs ${offN}</div>
    <table class="matchup-table"><tbody>${offRows}</tbody></table>`;
}


function openCompare(id) {
  closeDetail();
  const root = $("#compare-root");
  state.compare = { a: id, b: null };
  root.innerHTML = `
    <div class="overlay" role="dialog" aria-modal="true" aria-label="Compare Pokémon">
      <div class="overlay-backdrop" data-close></div>
      <div class="compare-panel">
        <div style="display:flex;justify-content:space-between;align-items:center">
          <h3 style="font-family:var(--font-display);margin:0">Compare Pokémon</h3>
          <button class="icon-btn" data-close aria-label="Close">✕</button>
        </div>
        <div class="compare-grid">
          <div class="compare-slot filled" data-slot="a"></div>
          <div class="compare-vs">VS</div>
          <div class="compare-slot" data-slot="b"></div>
        </div>
        <div class="compare-stats" data-compare-stats></div>
      </div>
    </div>`;
  document.body.style.overflow = "hidden";

  root.querySelector(".overlay-backdrop").addEventListener("click", closeCompare);
  root.querySelector(".compare-panel").addEventListener("click", (e) => {
    if (e.target.closest("[data-close]")) { closeCompare(); return; }
    const slotEl = e.target.closest("[data-slot]");
    if (slotEl && !e.target.closest(".compare-pick")) renderComparePicker(root, slotEl.dataset.slot);
  });

  renderCompareSlot(root, "a", id).then(() => renderCompareStats(root));
}

async function renderCompareSlot(root, slot, id) {
  const d = await getPokemon(id);
  state.compare[slot] = id;
  const el = root.querySelector(`[data-slot="${slot}"]`);
  el.classList.add("filled");
  el.innerHTML = `
    <div class="slot-art"><img loading="lazy" src="${esc(d.sprites.artwork)}" alt="${esc(d.name)}" onerror="this.src='${esc(d.sprites.default)}'"/></div>
    <div style="text-align:center;font-family:var(--font-display);font-weight:700">${esc(cap(d.name))} <small style="color:var(--text-faint)">${num(d.id)}</small></div>
    <div style="text-align:center;font-size:12px;color:var(--text-dim)">${d.types.map((t) => `<span class="type-badge" style="background:${TYPE_DARK(t)}">${cap(t)}</span>`).join(" ")}</div>
    <div style="text-align:center;margin-top:8px">
      <button class="btn btn-sm btn-ghost" data-change="${slot}">Change</button>
    </div>`;
  root.querySelector(`[data-slot="${slot}"] [data-change="${slot}"]`).addEventListener("click", () => renderComparePicker(root, slot));
  return d;
}

function renderComparePicker(root, slot) {
  const el = root.querySelector(`[data-slot="${slot}"]`);
  el.innerHTML = `
    <div class="compare-pick">
      <input placeholder="Search Pokémon…" />
    </div>
    <ul class="compare-picklist"></ul>`;
  const input = el.querySelector("input");
  const list = el.querySelector(".compare-picklist");
  input.focus();
  const update = () => {
    const q = input.value.trim().toLowerCase();
    const matches = state.cards.filter((c) => !q || c.name.includes(q) || String(c.id) === q).slice(0, 30);
    list.innerHTML = matches.map((c) => `<li data-id="${c.id}">${num(c.id)} ${esc(cap(c.name))}</li>`).join("");
  };
  input.addEventListener("input", update);
  update();
  list.addEventListener("click", async (e) => {
    const li = e.target.closest("li");
    if (!li) return;
    await renderCompareSlot(root, slot, Number(li.dataset.id));
    renderCompareStats(root);
  });
}

async function renderCompareStats(root) {
  const { a, b } = state.compare;
  const statsBox = root.querySelector("[data-compare-stats]");
  if (!a || !b) { statsBox.innerHTML = ""; return; }
  const [da, db] = await Promise.all([getPokemon(a), getPokemon(b)]);
  const names = ["hp", "attack", "defense", "special-attack", "special-defense", "speed"];
  const max = 255;
  const ta = da.stats.reduce((s, x) => s + x.base, 0);
  const tb = db.stats.reduce((s, x) => s + x.base, 0);

  const rows = names.map((n) => {
    const va = da.stats.find((s) => s.name === n)?.base ?? 0;
    const vb = db.stats.find((s) => s.name === n)?.base ?? 0;
    const clsA = va > vb ? "compare-winner" : va < vb ? "compare-loser" : "";
    const clsB = vb > va ? "compare-winner" : vb < va ? "compare-loser" : "";
    const pa = Math.max(2, (va / max) * 100);
    const pb = Math.max(2, (vb / max) * 100);
    return `<div class="compare-stat-row">
      <span class="name">${STAT_NAMES[n]}</span>
      <span class="bar left"><div style="width:${pa}%;background:${STAT_GRADIENT[n]}"></div></span>
      <span class="${clsA}" style="width:38px;text-align:center;font-weight:700">${va}</span>
      <span class="${clsB}" style="width:38px;text-align:center;font-weight:700">${vb}</span>
      <span class="bar"><div style="width:${pb}%;background:${STAT_GRADIENT[n]}"></div></span>
    </div>`;
  }).join("");

  statsBox.innerHTML = `
    <div class="section-title">Base stats</div>
    <div style="display:flex;justify-content:space-between;margin-bottom:8px;font-size:13px">
      <span><b>${esc(cap(da.name))}</b> <small style="color:var(--text-faint)">total ${ta}</small></span>
      <span><b>${esc(cap(db.name))}</b> <small style="color:var(--text-faint)">total ${tb}</small></span>
    </div>
    ${rows}
    <div style="display:flex;justify-content:space-between;margin-top:10px;font-size:12.5px;color:var(--text-dim)">
      <span>${(da.height / 10).toFixed(1)} m · ${(da.weight / 10).toFixed(1)} kg</span>
      <span>${(db.height / 10).toFixed(1)} m · ${(db.weight / 10).toFixed(1)} kg</span>
    </div>`;
}

function closeCompare() {
  $("#compare-root").innerHTML = "";
  if (!state.detail) document.body.style.overflow = "";
}


function showAbilityPop(anchor, ability) {
  const pop = $("#ability-pop");
  pop.innerHTML = `<div class="ap-title">${esc(cap(ability.name))}</div>
    <div class="ap-effect">${esc(ability.shortEffect || ability.effect || ability.flavorText || "No description.")}</div>`;
  pop.hidden = false;
  const r = anchor.getBoundingClientRect();
  const pr = pop.offsetWidth, ph = pop.offsetHeight;
  let x = r.left + r.width / 2 - pr / 2;
  let y = r.bottom + 10;
  x = Math.max(8, Math.min(x, window.innerWidth - pr - 8));
  if (y + ph > window.innerHeight - 8) y = r.top - ph - 10;
  pop.style.left = x + "px";
  pop.style.top = y + "px";
  const close = (e) => {
    if (e.target.closest(".ability-pop")) return;
    pop.hidden = true;
    document.removeEventListener("click", close);
    window.removeEventListener("scroll", close, true);
  };
  setTimeout(() => document.addEventListener("click", close), 0);
  window.addEventListener("scroll", close, { passive: true, capture: true });
}


function updateCollectionUI() {
  const caught = Object.keys(collection.caught).length;
  const shiny = Object.keys(collection.shiny).length;
  $("#collection-count").textContent = caught;
  const total = state.cards.length || 1025;
  $("#progress-text").textContent = `${caught} / ${total} caught · ${shiny} shiny`;
  const pct = total ? (caught / total) * 100 : 0;
  $("#progress-fill").style.width = pct + "%";
  $("#progress-card").hidden = caught === 0;
  $("#progress-label").textContent = caught === total ? "Pokédex complete!" : "Collection";
}


function handleRoute() {
  const m = location.hash.match(/^#\/pokemon\/(\d+)/);
  if (m) showPokemon(Number(m[1]));
  else closeDetail();
}


function setupKeyboard() {
  document.addEventListener("keydown", (e) => {
    const typing = /INPUT|SELECT|TEXTAREA/.test(document.activeElement.tagName);
    if (e.key === "/" && !typing) {
      e.preventDefault();
      $("#search").focus();
    }
    if (e.key === "Escape") {
      if (state.detail && location.hash.startsWith("#/pokemon/")) closeDetail();
      if ($("#compare-root").innerHTML) closeCompare();
    }
    if (e.key === "ArrowRight" && state.detail && !typing) {
      const idx = state.cards.findIndex((c) => c.id === state.detail.id);
      if (idx < state.cards.length - 1) openPokemon(state.cards[idx + 1].id);
    }
    if (e.key === "ArrowLeft" && state.detail && !typing) {
      const idx = state.cards.findIndex((c) => c.id === state.detail.id);
      if (idx > 0) openPokemon(state.cards[idx - 1].id);
    }
  });
}


async function init() {
  try { Object.assign(state.filters, JSON.parse(localStorage.getItem(FILTER_KEY)) || {}); } catch {}
  updateFilterUI();

  buildTypeChips();
  $("#type-filter").addEventListener("click", (e) => {
    const chip = e.target.closest(".type-chip");
    if (!chip) return;
    setFilter({ type: chip.dataset.type === state.filters.type ? "all" : chip.dataset.type });
  });

  $("#gen-filter").addEventListener("change", (e) => setFilter({ gen: e.target.value }));
  $("#sort-select").addEventListener("change", (e) => setFilter({ sort: e.target.value }));
  $("#special-filter").addEventListener("change", (e) => setFilter({ special: e.target.value }));
  $("#reset-filters").addEventListener("click", () => setFilter({ type: "all", gen: "all", special: "all", search: "", sort: "id" }));

  let searchTimer = null;
  $("#search").addEventListener("input", (e) => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => setFilter({ search: e.target.value }), 120);
  });
  $("#search-clear").addEventListener("click", () => { $("#search").value = ""; setFilter({ search: "" }); $("#search").focus(); });

  $("#random-btn").addEventListener("click", async () => {
    try {
      const r = await getRandom();
      openPokemon(r.card.id);
    } catch { toast("Couldn't roll a Pokémon"); }
  });

  $("#collection-btn").addEventListener("click", () => {
    setFilter({ special: state.filters.special === "uncaught" ? "all" : "uncaught" });
    toast(state.filters.special === "uncaught" ? "Showing uncaught only" : "Filter cleared");
    window.scrollTo({ top: 0, behavior: "smooth" });
  });

  buildTypeChips();
  const [cards, meta] = await Promise.all([getCards(), getMeta()]);
  state.cards = cards;
  state.meta = meta;

  buildGenSelect();
  renderGrid();
  setupInfiniteScroll();
  updateCollectionUI();
  setupKeyboard();

  window.addEventListener("hashchange", handleRoute);
  handleRoute();

  document.documentElement.classList.add("ready");
}

document.addEventListener("DOMContentLoaded", init);
