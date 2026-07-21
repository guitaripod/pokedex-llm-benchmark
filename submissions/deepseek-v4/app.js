const API = '/api';

const TYPE_COLORS = {
  normal:'#A8A77A',fire:'#EE8130',water:'#6390F0',electric:'#F7D02C',
  grass:'#7AC74C',ice:'#96D9D6',fighting:'#C22E28',poison:'#A33EA1',
  ground:'#E2BF65',flying:'#A98FF3',psychic:'#F95587',bug:'#A6B91A',
  rock:'#B6A136',ghost:'#735797',dragon:'#6F35FC',dark:'#705746',
  steel:'#B7B7CE',fairy:'#D685AD',
};

const STAT_COLORS = {
  hp:'var(--stat-hp)',attack:'var(--stat-attack)',defense:'var(--stat-defense)',
  'special-attack':'var(--stat-spattack)','special-defense':'var(--stat-spdefense)',
  speed:'var(--stat-speed)',
};

const STAT_LABELS = {
  hp:'HP',attack:'Atk',defense:'Def','special-attack':'SpA','special-defense':'SpD',
  speed:'Spd',
};

const TYPES = Object.keys(TYPE_COLORS);
const PAGE_SIZE = 48;

const state = {
  allPokemon: [],
  pokemonCache: {},
  speciesCache: {},
  evolutionCache: {},
  typeCache: {},
  selectedTypes: new Set(),
  searchTerm: '',
  displayedCount: 0,
  loading: false,
  loadingDetail: false,
};

function $(sel, ctx=document) { return ctx.querySelector(sel); }
function $$(sel, ctx=document) { return [...ctx.querySelectorAll(sel)]; }

function idFromUrl(url) {
  const parts = url.replace(/\/$/,'').split('/');
  return parseInt(parts[parts.length-1], 10);
}

function padNum(n) { return String(n).padStart(4,'0'); }

function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }

// --- API ---
async function apiFetch(path) {
  const res = await fetch(`${API}/${path}`);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

async function fetchAllPokemon() {
  const data = await apiFetch('pokemon?limit=100000&offset=0');
  state.allPokemon = data.results.map(r => ({
    id: idFromUrl(r.url),
    name: r.name,
  }));
  return state.allPokemon;
}

function cacheWithResolve(cache, key, fetcher) {
  if (!cache[key]) {
    const promise = fetcher().then(data => { cache[key] = data; return data; });
    cache[key] = promise;
  }
  const entry = cache[key];
  if (entry instanceof Promise) return entry;
  return entry;
}

async function getPokemon(id) { return cacheWithResolve(state.pokemonCache, id, () => apiFetch(`pokemon/${id}`)); }
async function getSpecies(id) {
  try {
    return await cacheWithResolve(state.speciesCache, id, () => apiFetch(`pokemon-species/${id}`));
  } catch { return null; }
}
async function getEvolutionChain(id) { return cacheWithResolve(state.evolutionCache, id, () => apiFetch(`evolution-chain/${id}`)); }
async function getTypeData(id) { return cacheWithResolve(state.typeCache, id, () => apiFetch(`type/${id}`)); }

// --- Filtering ---
function getFilteredPokemon() {
  let list = [...state.allPokemon];
  const term = state.searchTerm.toLowerCase().trim();
  if (term) {
    list = list.filter(p => {
      if (p.id === parseInt(term)) return true;
      return p.name.toLowerCase().includes(term);
    });
  }
  if (state.selectedTypes.size > 0) {
    list = list.filter(p => {
      const detail = state.pokemonCache[p.id];
      if (!detail || typeof detail !== 'object' || !detail.types || !Array.isArray(detail.types)) return false;
      return detail.types.some(t => t?.type?.name && state.selectedTypes.has(t.type.name));
    });
  }
  return list;
}

// --- Rendering: Type Filters ---
function renderTypeFilters() {
  const container = $('#typeFilters');
  container.innerHTML = '';
  const allBtn = document.createElement('button');
  allBtn.className = `type-filter-btn btn-all${state.selectedTypes.size === 0 ? ' active' : ''}`;
  allBtn.textContent = 'All';
  allBtn.addEventListener('click', () => {
    state.selectedTypes.clear();
    state.displayedCount = 0;
    $('#pokemonGrid').innerHTML = '';
    renderTypeFilters();
    renderGrid();
  });
  container.appendChild(allBtn);
  TYPES.forEach(type => {
    const btn = document.createElement('button');
    btn.className = `type-filter-btn${state.selectedTypes.has(type) ? ' active' : ''}`;
    btn.innerHTML = `<span class="type-dot" style="background:${TYPE_COLORS[type]}"></span>${type}`;
    if (state.selectedTypes.has(type)) {
      btn.style.background = `${TYPE_COLORS[type]}33`;
      btn.style.borderColor = TYPE_COLORS[type];
      btn.style.color = TYPE_COLORS[type];
    }
    btn.addEventListener('click', () => {
      if (state.selectedTypes.has(type)) {
        state.selectedTypes.delete(type);
      } else {
        state.selectedTypes.add(type);
      }
      state.displayedCount = 0;
      $('#pokemonGrid').innerHTML = '';
      renderTypeFilters();
      renderGrid();
    });
    container.appendChild(btn);
  });
}

// --- Rendering: Grid ---
function renderGrid() {
  const grid = $('#pokemonGrid');
  const filtered = getFilteredPokemon();
  const loadMore = $('#loadMore');
  const empty = $('#emptyState');

  if (state.loading && state.displayedCount === 0) {
    grid.innerHTML = `<div class="loading-state"><div class="loader"></div><p>Loading Pokédex…</p></div>`;
    return;
  }

  if (filtered.length === 0 && !state.loading) {
    empty.classList.add('visible');
    loadMore.classList.remove('visible');
    grid.innerHTML = '';
    $('#resultCount').textContent = '0 Pokémon';
    return;
  }

  empty.classList.remove('visible');

  const toShow = filtered.slice(0, state.displayedCount || PAGE_SIZE);
  if (state.displayedCount === 0) state.displayedCount = toShow.length;

  const existingIds = new Set();
  $$('.pokemon-card', grid).forEach(el => {
    existingIds.add(parseInt(el.dataset.id));
  });

  toShow.forEach((p, i) => {
    if (!existingIds.has(p.id)) {
      grid.appendChild(createCard(p, i));
      fetchCardTypes(p.id);
    }
  });

  if (filtered.length > state.displayedCount) {
    loadMore.classList.add('visible');
  } else {
    loadMore.classList.remove('visible');
  }

  $('#resultCount').textContent = `${toShow.length} / ${filtered.length} Pokémon`;
  $('#totalCount').textContent = `${filtered.length}`;
}

function createCard(p, index) {
  const artwork = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${p.id}.png`;
  const fallback = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${p.id}.png`;
  const card = document.createElement('div');
  card.className = 'pokemon-card';
  card.dataset.id = p.id;
  card.style.animationDelay = `${(index % PAGE_SIZE) * 20}ms`;
  card.innerHTML = `
    <div class="card-number">#${padNum(p.id)}</div>
    <div class="card-image-wrap">
      <img class="card-image" src="${artwork}" alt="${p.name}" loading="lazy" onerror="this.src='${fallback}'">
    </div>
    <div class="card-name">${p.name}</div>
    <div class="card-types" id="types-${p.id}">
      <span class="card-type-placeholder">—</span>
    </div>
  `;
  card.addEventListener('click', () => openDetail(p.id));
  return card;
}

async function fetchCardTypes(id) {
  try {
    const p = await getPokemon(id);
    const types = p.types || [];
    const container = $(`#types-${id}`);
    if (!container || !container.isConnected) return;
    const typeNames = types.map(t => t.type.name);
    const primaryColor = typeNames.length > 0 ? TYPE_COLORS[typeNames[0]] : '';
    container.innerHTML = typeNames.map(t =>
      `<span class="card-type" style="background:${TYPE_COLORS[t]}">${t}</span>`
    ).join('');
    const card = container.closest('.pokemon-card');
    card.style.setProperty('--card-accent', primaryColor);
    card.style.borderColor = primaryColor ? primaryColor + '44' : '';
  } catch (e) {
    // silently fail, card shows without types
  }
}

// --- Detail Modal ---
async function openDetail(id) {
  if (state.loadingDetail) return;
  state.loadingDetail = true;
  const modal = $('#detailModal');
  const body = $('#modalBody');
  modal.classList.add('open');
  document.body.style.overflow = 'hidden';
  body.innerHTML = `<div class="modal-loader"><div class="loader"></div></div>`;

  try {
    const [pokemon, species] = await Promise.all([getPokemon(id), getSpecies(id)]);
    body.innerHTML = '';
    body.appendChild(createDetailContent(pokemon, species));
    animateStats();

    // Fetch evolution chain
    if (species?.evolution_chain?.url) {
      const evoId = idFromUrl(species.evolution_chain.url);
      const evoData = await getEvolutionChain(evoId);
      renderEvolution(evoData, id);
    }

    // Fetch type data for effectiveness
    const typeNames = pokemon.types.map(t => t.type.name);
    renderEffectiveness(pokemon);
  } catch (e) {
    body.innerHTML = `<div style="padding:40px;text-align:center;color:var(--danger)"><p>Failed to load Pokémon data</p></div>`;
  } finally {
    state.loadingDetail = false;
  }
}

function createDetailContent(pokemon, species) {
  const id = pokemon.id;
  const name = pokemon.name;
  const types = pokemon.types.map(t => t.type.name);
  const primaryColor = TYPE_COLORS[types[0]] || '#888';
  const artwork = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`;
  const shinyArtwork = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/shiny/${id}.png`;

  const flavorEntry = species?.flavor_text_entries?.find(e => e.language.name === 'en');
  const flavorText = flavorEntry ? flavorEntry.flavor_text.replace(/[\n\f]/g, ' ') : 'No description available.';
  const genus = species?.genera?.find(g => g.language.name === 'en')?.genus || '';

  const stats = pokemon.stats || [];
  const statTotal = stats.reduce((s, st) => s + st.base_stat, 0);
  const abilities = pokemon.abilities || [];
  const height = (pokemon.height / 10).toFixed(1);
  const weight = (pokemon.weight / 10).toFixed(1);

  const genderRate = species?.gender_rate ?? -1;
  const genderStr = genderRate === -1 ? 'Genderless'
    : `${((1 - genderRate/8)*100).toFixed(0)}% ♂ / ${((genderRate/8)*100).toFixed(0)}% ♀`;

  const container = document.createElement('div');
  container.innerHTML = `
    <div class="detail-header" style="background:linear-gradient(180deg,${primaryColor}22,transparent)">
      <div class="detail-header-bg" style="background:radial-gradient(circle at 50% 40%,${primaryColor}33,transparent 70%)"></div>
      <div class="detail-artwork-wrap">
        <img class="detail-artwork" id="detailArtwork" src="${artwork}" alt="${name}">
      </div>
      <div class="detail-artwork-controls">
        <button class="shiny-toggle" id="shinyToggle" data-normal="${artwork}" data-shiny="${shinyArtwork}">✨ Shiny</button>
      </div>
      <div class="detail-number">#${padNum(id)}</div>
      <div class="detail-name">${name}</div>
      <div class="detail-types">${types.map(t => `<span class="detail-type-badge" style="background:${TYPE_COLORS[t]}">${t}</span>`).join('')}</div>
      ${genus ? `<div style="font-size:13px;color:var(--text-muted);margin-top:-6px;margin-bottom:4px">${genus}</div>` : ''}
      <div class="detail-flavor">"${flavorText}"</div>
    </div>
    <div class="detail-info">
      <div class="detail-meta">
        <div class="meta-item"><div class="meta-label">Height</div><div class="meta-value">${height} m</div></div>
        <div class="meta-item"><div class="meta-label">Weight</div><div class="meta-value">${weight} kg</div></div>
        <div class="meta-item"><div class="meta-label">Gender</div><div class="meta-value" style="font-size:13px">${genderStr}</div></div>
        <div class="meta-item"><div class="meta-label">Base Exp</div><div class="meta-value">${pokemon.base_experience ?? '—'}</div></div>
        <div class="meta-item"><div class="meta-label">Catch Rate</div><div class="meta-value">${species?.capture_rate ?? '—'}</div></div>
        <div class="meta-item"><div class="meta-label">Egg Groups</div><div class="meta-value" style="font-size:12px;text-transform:capitalize">
          ${(species?.egg_groups?.map(e => e.name).join(', ')) || '—'}
        </div></div>
      </div>

      <div class="detail-stats">
        <div class="detail-section-title">Base Stats</div>
        ${stats.map(st => {
          const label = STAT_LABELS[st.stat.name] || st.stat.name;
          const val = st.base_stat;
          const maxStat = 255;
          const pct = clamp((val / maxStat) * 100, 2, 100);
          const color = STAT_COLORS[st.stat.name] || 'var(--accent)';
          return `
            <div class="stat-row">
              <div class="stat-label" style="color:${color}">${label}</div>
              <div class="stat-bar-bg"><div class="stat-bar-fill" data-stat="${st.stat.name}" style="background:${color};--fill:${pct}%"></div></div>
              <div class="stat-value">${val}</div>
            </div>`;
        }).join('')}
        <div class="stat-row stat-total-row">
          <div class="stat-label" style="color:var(--stat-total)">Total</div>
          <div style="flex:1;text-align:center;font-weight:800;font-size:16px;color:var(--stat-total)">${statTotal}</div>
        </div>
      </div>

      <div class="detail-abilities">
        <div class="detail-section-title">Abilities</div>
        ${abilities.map(a => `
          <div class="ability-item">
            <span class="ability-name">${a.ability.name.replace(/-/g,' ')}</span>
            ${a.is_hidden ? '<span class="ability-hidden">Hidden</span>' : ''}
          </div>
        `).join('')}
      </div>

      <div class="detail-evolution">
        <div class="detail-section-title">Evolution Chain</div>
        <div class="evolution-chain" id="evoChain">
          <div style="color:var(--text-muted);font-size:13px">Loading…</div>
        </div>
      </div>

      <div class="detail-effectiveness">
        <div class="detail-section-title">Type Effectiveness</div>
        <div class="effectiveness-grid" id="effGrid">
          <div style="color:var(--text-muted);font-size:13px">Loading…</div>
        </div>
      </div>
    </div>
  `;

  return container;
}

function animateStats() {
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      $$('.stat-bar-fill').forEach(el => {
        el.classList.add('animated');
      });
    });
  });
}

function renderEvolution(evoData, currentId) {
  const chain = [];
  function walk(node) {
    chain.push({ name: node.species.name, id: idFromUrl(node.species.url) });
    if (node.evolves_to?.length > 0) {
      walk(node.evolves_to[0]);
    }
  }
  walk(evoData.chain);

  const container = $('#evoChain');
  if (!container) return;
  if (chain.length <= 1) {
    container.innerHTML = `
      <div class="evo-item active">
        <img class="evo-img" src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${chain[0].id}.png" alt="${chain[0].name}" loading="lazy" onerror="this.src='https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${chain[0].id}.png'">
        <div class="evo-name">${chain[0].name}</div>
      </div>
    `;
    return;
  }
  container.innerHTML = chain.map((evo, i) => `
    ${i > 0 ? '<span class="evo-arrow">›</span>' : ''}
    <div class="evo-item${evo.id === currentId ? ' active' : ''}" data-evo-id="${evo.id}">
      <img class="evo-img" src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${evo.id}.png" alt="${evo.name}" loading="lazy" onerror="this.src='https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${evo.id}.png'">
      <div class="evo-name">${evo.name}</div>
    </div>
  `).join('');
  container.querySelectorAll('.evo-item[data-evo-id]').forEach(el => {
    el.addEventListener('click', () => {
      const evoId = parseInt(el.dataset.evoId);
      if (evoId !== currentId) openDetail(evoId);
    });
  });
}

async function renderEffectiveness(pokemon) {
  const grid = $('#effGrid');
  if (!grid) return;
  try {
    const typeNames = pokemon.types.map(t => t.type.name);
    const typeData = await Promise.all(typeNames.map(t => getTypeData(t)));
    const multipliers = {};
    const key = t => t.name;
    for (const td of typeData) {
      for (const rel of td.damage_relations.double_damage_from || []) {
        multipliers[rel.name] = (multipliers[rel.name] || 1) * 2;
      }
      for (const rel of td.damage_relations.half_damage_from || []) {
        multipliers[rel.name] = (multipliers[rel.name] || 1) * 0.5;
      }
      for (const rel of td.damage_relations.no_damage_from || []) {
        multipliers[rel.name] = 0;
      }
    }
    const sorted = Object.entries(multipliers).sort((a, b) => b[1] - a[1]);
    if (sorted.length === 0) {
      grid.innerHTML = '<div style="color:var(--text-muted);font-size:13px">No type effectiveness data available.</div>';
      return;
    }
    grid.innerHTML = sorted.map(([type, mult]) => {
      let cls = '';
      let label = '';
      if (mult === 0) { cls = 'eff-0'; label = 'Immune'; }
      else if (mult >= 4) { cls = 'eff-4'; label = '4×'; }
      else if (mult === 2) { cls = 'eff-2'; label = '2×'; }
      else if (mult === 0.5) { cls = 'eff-half'; label = '½×'; }
      else if (mult === 0.25) { cls = 'eff-quarter'; label = '¼×'; }
      else return '';
      const color = TYPE_COLORS[type] || '#888';
      return `<div class="eff-item ${cls}"><span class="type-dot" style="background:${color}"></span><span class="eff-label">${type}</span><span class="eff-mult">${label}</span></div>`;
    }).filter(Boolean).join('');
  } catch (e) {
    grid.innerHTML = '<div style="color:var(--text-muted);font-size:13px">Failed to load effectiveness data.</div>';
  }
}

// --- Close Modal ---
function closeDetail() {
  const modal = $('#detailModal');
  modal.classList.remove('open');
  document.body.style.overflow = '';
  $('#modalBody').innerHTML = '';
}

$('#modalClose').addEventListener('click', closeDetail);
$('#detailModal').addEventListener('click', e => {
  if (e.target.closest('.modal-content')) return;
  if (e.target.closest('.modal-backdrop')) closeDetail();
});
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeDetail();
});

// Shiny toggle (delegated — catches inline data-shiny buttons)
document.addEventListener('click', e => {
  const btn = e.target.closest('.shiny-toggle[data-shiny]');
  if (!btn) return;
  const img = btn.closest('.modal-body')?.querySelector('#detailArtwork');
  if (!img) return;
  const isShiny = btn.classList.toggle('active');
  img.src = isShiny ? btn.dataset.shiny : btn.dataset.normal;
  btn.textContent = isShiny ? '✨ Normal' : '✨ Shiny';
});

// --- Search ---
let searchTimeout;
$('#searchInput').addEventListener('input', () => {
  clearTimeout(searchTimeout);
  const input = $('#searchInput');
  const clearBtn = $('#searchClear');
  clearBtn.classList.toggle('visible', input.value.length > 0);
  searchTimeout = setTimeout(() => {
    state.searchTerm = input.value;
    state.displayedCount = 0;
    $('#pokemonGrid').innerHTML = '';
    renderGrid();
  }, 200);
});
$('#searchClear').addEventListener('click', () => {
  const input = $('#searchInput');
  input.value = '';
  state.searchTerm = '';
  state.displayedCount = 0;
  $('#searchClear').classList.remove('visible');
  $('#pokemonGrid').innerHTML = '';
  renderGrid();
  input.focus();
});

// --- Load More ---
$('#loadMoreBtn').addEventListener('click', () => {
  state.displayedCount += PAGE_SIZE;
  renderGrid();
});

// --- Infinite Scroll ---
const scrollObserver = new IntersectionObserver(entries => {
  const loadMore = $('#loadMore');
  if (entries[0].isIntersecting && loadMore.classList.contains('visible')) {
    state.displayedCount += PAGE_SIZE;
    renderGrid();
  }
}, { rootMargin: '400px' });

// --- Shuffle ---
$('#shuffleBtn').addEventListener('click', () => {
  const grid = $('#pokemonGrid');
  const cards = $$('.pokemon-card', grid);
  if (cards.length < 2) return;
  const ids = cards.map(c => parseInt(c.dataset.id));
  for (let i = ids.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [ids[i], ids[j]] = [ids[j], ids[i]];
  }
  grid.innerHTML = '';
  ids.forEach((id, i) => {
    const p = state.allPokemon.find(ap => ap.id === id);
    if (p) {
      grid.appendChild(createCard(p, i));
      fetchCardTypes(p.id);
    }
  });
  state.displayedCount = ids.length;
  showToast('Cards shuffled!');
});

// --- Scroll to Top ---
$('#scrollTopBtn').addEventListener('click', () => {
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

// --- Toast ---
function showToast(msg) {
  const container = $('#toastContainer');
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = msg;
  container.appendChild(toast);
  setTimeout(() => { toast.style.opacity = '0'; toast.style.transition = 'opacity 0.3s'; }, 2000);
  setTimeout(() => toast.remove(), 2500);
}

// --- Init ---
async function init() {
  renderTypeFilters();
  state.loading = true;
  renderGrid();

  try {
    await Promise.race([
      fetchAllPokemon(),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('PokeAPI request timed out after 15s')), 15000)
      ),
    ]);
    state.loading = false;
    state.displayedCount = 0;
    $('#pokemonGrid').innerHTML = '';
    renderGrid();
  } catch (e) {
    const grid = $('#pokemonGrid');
    grid.innerHTML = `<div class="empty-state visible"><div class="empty-icon">${e.message.includes('timed out') ? '⌛' : '⚠️'}</div><h3>${e.message.includes('timed out') ? 'Loading timed out' : 'Failed to load Pokédex'}</h3><p>${e.message.includes('timed out') ? 'PokeAPI might be slow — try refreshing' : 'Check your connection and try again'}</p></div>`;
  } finally {
    state.loading = false;
  }
  scrollObserver.observe($('#loadMore'));
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
