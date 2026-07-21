const SPRITES = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon'
const CRIES = 'https://raw.githubusercontent.com/PokeAPI/cries/main/cries/pokemon/latest'

const TYPE_COLORS = {
  normal: '#a8a29e', fire: '#ff7b3e', water: '#4aa3ff', electric: '#ffd23e',
  grass: '#5dc466', ice: '#7fd8d4', fighting: '#e0455c', poison: '#b45fd0',
  ground: '#dfa856', flying: '#9aa8f0', psychic: '#ff6aa2', bug: '#a8c437',
  rock: '#c8b558', ghost: '#7e6bc8', dragon: '#7a5cf0', dark: '#8a7466',
  steel: '#9aa8b8', fairy: '#f4a0c8',
}
const STAT_NAMES = ['HP', 'ATK', 'DEF', 'SP.ATK', 'SP.DEF', 'SPD']
const GEN_ROMAN = ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX']
const DMG_ICON = { physical: '💥', special: '🌀', status: '◎' }

const app = document.getElementById('app')
let DEX = [], EVO = {}, TYPES = {}, ABILITIES = {}, MOVES = null
let byId = new Map()
const favs = new Set(JSON.parse(localStorage.getItem('pokedex-favs') || '[]'))

const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))
const cap = s => String(s ?? '').split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
const pad = id => '#' + String(id).padStart(4, '0')
const artUrl = (id, shiny = false) => `${SPRITES}/other/official-artwork/${shiny ? 'shiny/' : ''}${id}.png`
const spriteUrl = id => `${SPRITES}/${id}.png`
const animUrl = (id, shiny = false) => `${SPRITES}/other/showdown/${shiny ? 'shiny/' : ''}${id}.gif`
const imgUrl = p => (p.has_art ? artUrl(p.id) : spriteUrl(p.id))
const tc = t => TYPE_COLORS[t] || '#888'

const formLabel = p => {
  if (p.default) return ''
  return cap(p.name.slice(p.name.indexOf('-') + 1))
}
const displayName = p => p.default ? p.label : `${p.label} · ${formLabel(p)}`

function badge(t, lg = false) {
  return `<span class="badge${lg ? ' lg' : ''}" style="--tc:${tc(t)}">${t}</span>`
}

function saveFavs() {
  localStorage.setItem('pokedex-favs', JSON.stringify([...favs]))
  const el = document.getElementById('fav-count')
  el.textContent = favs.size ? `[${favs.size}]` : ''
}

function toggleFav(id, btn) {
  favs.has(id) ? favs.delete(id) : favs.add(id)
  saveFavs()
  if (btn) { btn.classList.toggle('on', favs.has(id)); btn.textContent = favs.has(id) ? '★' : '☆' }
}

function defensiveEffectiveness(defTypes) {
  const mult = {}
  for (const atk of Object.keys(TYPES)) {
    let m = 1
    for (const d of defTypes) {
      const rel = TYPES[atk]
      if (rel.double_to.includes(d)) m *= 2
      else if (rel.half_to.includes(d)) m *= 0.5
      else if (rel.no_to.includes(d)) m *= 0
    }
    mult[atk] = m
  }
  return mult
}

function evoConditionText(d) {
  if (!d) return ''
  const parts = []
  if (d.min_level) parts.push(`Lv ${d.min_level}`)
  if (d.item) parts.push(cap(d.item))
  if (d.held_item) parts.push(`hold ${cap(d.held_item)}`)
  if (d.min_happiness) parts.push('friendship')
  if (d.min_affection) parts.push('affection')
  if (d.min_beauty) parts.push('beauty')
  if (d.known_move) parts.push(`knows ${cap(d.known_move)}`)
  if (d.known_move_type) parts.push(`${d.known_move_type} move`)
  if (d.location) parts.push(`at ${cap(d.location)}`)
  if (d.time_of_day) parts.push(d.time_of_day)
  if (d.trade_species) parts.push(`for ${cap(d.trade_species)}`)
  if (d.needs_overworld_rain) parts.push('rain')
  if (d.gender === 1) parts.push('♀'); if (d.gender === 2) parts.push('♂')
  if (d.trigger === 'trade' && !parts.some(p => p.startsWith('for'))) parts.unshift('trade')
  if (d.trigger === 'use-item' && parts.length === 0) parts.push('use item')
  if (!parts.length && d.trigger) parts.push(cap(d.trigger))
  return parts.join(' · ')
}

const state = { q: '', types: new Set(), gen: 0, sort: 'id', rarity: '', forms: false }
let renderCount = 0
let observer = null

function filteredDex() {
  const q = state.q.trim().toLowerCase()
  let list = DEX.filter(p => {
    if (!state.forms && !p.default) return false
    if (state.gen && p.gen !== state.gen) return false
    if (state.types.size && ![...state.types].every(t => p.types.includes(t))) return false
    if (state.rarity === 'legendary' && !p.legendary) return false
    if (state.rarity === 'mythical' && !p.mythical) return false
    if (state.rarity === 'baby' && !p.baby) return false
    if (q) {
      if (/^#?\d+$/.test(q)) { if (p.id !== Number(q.replace('#', '')) && p.species !== Number(q.replace('#', ''))) return false }
      else if (!p.name.includes(q) && !p.label.toLowerCase().includes(q)) return false
    }
    return true
  })
  const total = p => p.stats.reduce((a, b) => a + b, 0)
  const sorts = {
    id: (a, b) => a.id - b.id,
    name: (a, b) => a.label.localeCompare(b.label),
    total: (a, b) => total(b) - total(a),
    hp: (a, b) => b.stats[0] - a.stats[0],
    attack: (a, b) => b.stats[1] - a.stats[1],
    defense: (a, b) => b.stats[2] - a.stats[2],
    speed: (a, b) => b.stats[5] - a.stats[5],
    height: (a, b) => b.height - a.height,
    weight: (a, b) => b.weight - a.weight,
  }
  return list.sort(sorts[state.sort] || sorts.id)
}

function cardHTML(p, i) {
  const rare = p.mythical ? 'MYTHICAL' : p.legendary ? 'LEGENDARY' : ''
  return `<a class="card" href="#/pokemon/${p.id}" style="--tc:${tc(p.types[0])}; animation-delay:${Math.min(i % 40, 20) * 18}ms">
    ${rare ? `<span class="rarity-tag">◆ ${rare}</span>` : ''}
    <button class="card-fav${favs.has(p.id) ? ' on' : ''}" data-fav="${p.id}" aria-label="favorite">${favs.has(p.id) ? '★' : '☆'}</button>
    <div class="card-img-wrap"><img class="card-img" loading="lazy" src="${imgUrl(p)}" alt="${esc(p.label)}" onerror="this.src='${spriteUrl(p.id)}'"></div>
    <span class="card-no">${pad(p.species)}${p.gen ? ` · GEN ${GEN_ROMAN[p.gen]}` : ''}</span>
    <div class="card-name">${esc(p.label)}${p.default ? '' : `<span class="card-form">${esc(formLabel(p))}</span>`}</div>
    <div class="card-types">${p.types.map(t => badge(t)).join('')}</div>
  </a>`
}

function dexView() {
  document.title = 'POKÉDEX // FABLE TERMINAL'
  const list = filteredDex()
  app.innerHTML = `
    <div class="controls">
      <div class="search-wrap"><input id="search" type="search" placeholder="NAME OR №…" value="${esc(state.q)}" autocomplete="off"></div>
      <select class="ctl" id="gen-sel">
        <option value="0">ALL GENS</option>
        ${GEN_ROMAN.slice(1).map((r, i) => `<option value="${i + 1}" ${state.gen === i + 1 ? 'selected' : ''}>GEN ${r}</option>`).join('')}
      </select>
      <select class="ctl" id="rarity-sel">
        <option value="">ALL RARITIES</option>
        <option value="legendary" ${state.rarity === 'legendary' ? 'selected' : ''}>LEGENDARY</option>
        <option value="mythical" ${state.rarity === 'mythical' ? 'selected' : ''}>MYTHICAL</option>
        <option value="baby" ${state.rarity === 'baby' ? 'selected' : ''}>BABY</option>
      </select>
      <select class="ctl" id="sort-sel">
        ${[['id', 'SORT: №'], ['name', 'SORT: NAME'], ['total', 'SORT: BST'], ['hp', 'SORT: HP'], ['attack', 'SORT: ATK'], ['defense', 'SORT: DEF'], ['speed', 'SORT: SPEED'], ['height', 'SORT: HEIGHT'], ['weight', 'SORT: WEIGHT']]
          .map(([v, l]) => `<option value="${v}" ${state.sort === v ? 'selected' : ''}>${l}</option>`).join('')}
      </select>
      <button class="ctl-btn${state.forms ? ' on' : ''}" id="forms-btn">FORMS ${state.forms ? 'ON' : 'OFF'}</button>
    </div>
    <div class="type-filter">
      ${Object.keys(TYPE_COLORS).map(t => `<button class="type-chip${state.types.has(t) ? ' on' : ''}" data-type="${t}" style="--tc:${tc(t)}">${t}</button>`).join('')}
    </div>
    <div class="result-line"><b>${list.length}</b> ENTRIES LOCATED</div>
    <div class="grid" id="grid"></div>
    <div class="load-sentinel" id="sentinel"></div>
    ${list.length ? '' : '<div class="empty">No entries match your query</div>'}
  `
  const grid = document.getElementById('grid')
  renderCount = 0
  const CHUNK = 60
  const renderChunk = () => {
    if (renderCount >= list.length) return
    const frag = list.slice(renderCount, renderCount + CHUNK).map((p, i) => cardHTML(p, i)).join('')
    grid.insertAdjacentHTML('beforeend', frag)
    renderCount += CHUNK
  }
  renderChunk()
  if (observer) observer.disconnect()
  observer = new IntersectionObserver(entries => { if (entries[0].isIntersecting) renderChunk() }, { rootMargin: '900px' })
  observer.observe(document.getElementById('sentinel'))

  const search = document.getElementById('search')
  let deb
  search.addEventListener('input', () => {
    clearTimeout(deb)
    deb = setTimeout(() => { state.q = search.value; refreshGrid() }, 160)
  })
  document.getElementById('gen-sel').onchange = e => { state.gen = Number(e.target.value); dexView() }
  document.getElementById('rarity-sel').onchange = e => { state.rarity = e.target.value; dexView() }
  document.getElementById('sort-sel').onchange = e => { state.sort = e.target.value; dexView() }
  document.getElementById('forms-btn').onclick = () => { state.forms = !state.forms; dexView() }
  document.querySelectorAll('.type-chip').forEach(chip => chip.onclick = () => {
    const t = chip.dataset.type
    state.types.has(t) ? state.types.delete(t) : state.types.add(t)
    dexView()
  })
  function refreshGrid() {
    const fresh = filteredDex()
    grid.innerHTML = ''
    renderCount = 0
    const line = document.querySelector('.result-line')
    line.innerHTML = `<b>${fresh.length}</b> ENTRIES LOCATED`
    list.length = 0; list.push(...fresh)
    renderChunk()
  }
}

let currentAudio = null
function playCry(id, btn) {
  if (currentAudio) currentAudio.pause()
  currentAudio = new Audio(`${CRIES}/${id}.ogg`)
  currentAudio.volume = .4
  btn.classList.add('on')
  currentAudio.play().catch(() => {})
  currentAudio.onended = () => btn.classList.remove('on')
}

function evoChainHTML(chainId, currentSpecies) {
  const root = EVO[chainId]
  if (!root) return '<div class="evo-solo">NO EVOLUTION DATA</div>'
  const stages = []
  let frontier = [root]
  while (frontier.length) {
    stages.push(frontier)
    frontier = frontier.flatMap(n => n.evolves_to)
  }
  if (stages.length === 1 && stages[0].length === 1) return '<div class="evo-solo">◆ DOES NOT EVOLVE ◆</div>'
  const nodeHTML = n => {
    const p = byId.get(n.species)
    if (!p) return ''
    return `<a class="evo-node${n.species === currentSpecies ? ' current' : ''}" href="#/pokemon/${n.species}">
      <img loading="lazy" src="${imgUrl(p)}" alt="${esc(p.label)}" onerror="this.src='${spriteUrl(p.id)}'">
      <span class="evo-no">${pad(n.species)}</span>
      <span class="evo-name">${esc(p.label)}</span>
    </a>`
  }
  let html = '<div class="evo-chain">'
  stages.forEach((stage, i) => {
    if (i > 0) {
      html += `<div class="evo-stage">${stage.map(n => `<div class="evo-arrow"><span class="arr">➜</span><span class="evo-cond">${esc(evoConditionText(n.details)) || 'special'}</span></div>`).join('')}</div>`
    }
    html += `<div class="evo-stage">${stage.map(nodeHTML).join('')}</div>`
  })
  return html + '</div>'
}

async function detailView(id) {
  const p = byId.get(id)
  if (!p) { app.innerHTML = '<div class="empty">Entry not found</div>'; return }
  document.title = `${displayName(p)} — POKÉDEX`
  const accent = tc(p.types[0])
  document.documentElement.style.setProperty('--accent', accent)
  document.documentElement.style.setProperty('--accent-soft', `color-mix(in srgb, ${accent} 13%, transparent)`)

  const defaults = DEX.filter(x => x.default)
  const idx = defaults.findIndex(x => x.species === p.species)
  const prev = defaults[idx - 1], next = defaults[idx + 1]

  const eff = defensiveEffectiveness(p.types)
  const effGroups = [
    ['WEAK TO (4×)', Object.keys(eff).filter(t => eff[t] === 4), '×4'],
    ['WEAK TO (2×)', Object.keys(eff).filter(t => eff[t] === 2), '×2'],
    ['RESISTS (½×)', Object.keys(eff).filter(t => eff[t] === 0.5), '×½'],
    ['RESISTS (¼×)', Object.keys(eff).filter(t => eff[t] === 0.25), '×¼'],
    ['IMMUNE (0×)', Object.keys(eff).filter(t => eff[t] === 0), '×0'],
  ].filter(([, list]) => list.length)

  const genderHTML = p.gender_rate === -1
    ? '<div class="gender-legend"><span>GENDERLESS</span></div>'
    : (() => {
        const f = p.gender_rate / 8 * 100, m = 100 - f
        return `<div class="gender-bar"><div class="gender-m" style="width:${m}%"></div><div class="gender-f" style="width:${f}%"></div></div>
        <div class="gender-legend"><span>♂ ${m.toFixed(1)}%</span><span>♀ ${f.toFixed(1)}%</span></div>`
      })()

  const total = p.stats.reduce((a, b) => a + b, 0)
  const varieties = p.varieties.map(v => byId.get(v)).filter(Boolean)

  app.innerHTML = `
  <div class="detail">
    <div class="detail-top">
      <a class="back-link" href="#/">← DEX</a>
      <div class="pn-links">
        ${prev ? `<a class="pn-link" href="#/pokemon/${prev.id}">← ${pad(prev.species)} ${esc(prev.label)}</a>` : ''}
        ${next ? `<a class="pn-link" href="#/pokemon/${next.id}">${esc(next.label)} ${pad(next.species)} →</a>` : ''}
      </div>
    </div>
    <section class="hero" data-no="${pad(p.species)}">
      <div class="hero-art">
        <div class="hero-ring"></div>
        <img class="art" id="hero-art" src="${imgUrl(p)}" alt="${esc(p.label)}" onerror="this.src='${spriteUrl(p.id)}'">
        ${p.has_anim ? `<img class="hero-anim" id="hero-anim" src="${animUrl(p.id)}" alt="">` : ''}
        <div class="art-tools">
          ${p.has_art ? '<button class="tool-btn" id="shiny-btn">✦ shiny</button>' : ''}
          ${p.cry ? '<button class="tool-btn" id="cry-btn">♪ cry</button>' : ''}
        </div>
      </div>
      <div class="hero-info">
        <span class="hero-kicker">${pad(p.species)} ${p.gen ? `// GENERATION ${GEN_ROMAN[p.gen]}` : ''} ${p.mythical ? '// MYTHICAL' : p.legendary ? '// LEGENDARY' : ''}</span>
        <h1 class="hero-name">${esc(displayName(p))}
          <button class="fav-toggle${favs.has(p.id) ? ' on' : ''}" id="fav-btn">${favs.has(p.id) ? '★' : '☆'}</button>
        </h1>
        <div class="hero-genus">${esc(p.genus)}</div>
        <div class="hero-types">${p.types.map(t => badge(t, true)).join('')}</div>
        ${p.flavor ? `<p class="hero-flavor">${esc(p.flavor)}</p>` : ''}
        <dl class="quick-facts">
          <div class="fact"><dt>Height</dt><dd>${(p.height / 10).toFixed(1)} <small>m</small></dd></div>
          <div class="fact"><dt>Weight</dt><dd>${(p.weight / 10).toFixed(1)} <small>kg</small></dd></div>
          <div class="fact"><dt>Base EXP</dt><dd>${p.base_exp ?? '—'}</dd></div>
          <div class="fact"><dt>Catch rate</dt><dd>${p.capture_rate ?? '—'} <small>/255</small></dd></div>
          <div class="fact"><dt>Happiness</dt><dd>${p.base_happiness ?? '—'}</dd></div>
          <div class="fact"><dt>Shape</dt><dd style="text-transform:capitalize">${esc(p.shape || '—')}</dd></div>
        </dl>
      </div>
    </section>

    <div class="panel-grid">
      <section class="panel">
        <h2>Base Stats</h2>
        ${p.stats.map((v, i) => `
          <div class="stat-row">
            <span class="stat-name">${STAT_NAMES[i]}</span>
            <span class="stat-val">${v}</span>
            <div class="stat-bar"><div class="stat-fill" data-w="${Math.min(v / 255 * 100, 100)}"></div></div>
          </div>`).join('')}
        <div class="stat-total"><span>BASE STAT TOTAL</span><span>${total}</span></div>
        ${p.evs.some(e => e) ? `<div class="result-line" style="padding-top:14px">EV YIELD: <b>${p.evs.map((e, i) => e ? `${e} ${STAT_NAMES[i]}` : '').filter(Boolean).join(', ')}</b></div>` : ''}
      </section>

      <section class="panel">
        <h2>Abilities</h2>
        ${p.abilities.map(a => `
          <div class="ability">
            <div class="ability-name">${esc(ABILITIES[a.n]?.name || cap(a.n))} ${a.h ? '<span class="hidden-tag">Hidden</span>' : ''}</div>
            <div class="ability-desc">${esc(ABILITIES[a.n]?.effect || '')}</div>
          </div>`).join('')}
      </section>

      <section class="panel">
        <h2>Type Matchups · Defense</h2>
        ${effGroups.map(([label, list]) => `
          <div class="eff-group">
            <div class="eff-label">${label}</div>
            <div class="eff-badges">${list.map(t => `<span class="eff">${badge(t)}</span>`).join('')}</div>
          </div>`).join('') || '<div class="eff-label">TAKES NEUTRAL DAMAGE FROM ALL TYPES</div>'}
      </section>

      <section class="panel">
        <h2>Breeding & Training</h2>
        <dl>
          <div class="kv"><dt>Egg groups</dt><dd>${p.egg_groups.map(cap).join(', ') || '—'}</dd></div>
          <div class="kv"><dt>Hatch cycles</dt><dd>${p.hatch_counter ?? '—'} <small class="mono">(${p.hatch_counter ? (p.hatch_counter + 1) * 255 : '—'} steps)</small></dd></div>
          <div class="kv"><dt>Growth rate</dt><dd>${cap(p.growth || '—')}</dd></div>
          <div class="kv"><dt>Habitat</dt><dd>${cap(p.habitat || 'Unknown')}</dd></div>
          <div class="kv"><dt>Color</dt><dd>${cap(p.color || '—')}</dd></div>
        </dl>
        <div style="margin-top:14px">
          <div class="eff-label">GENDER RATIO</div>
          ${genderHTML}
        </div>
      </section>

      <section class="panel wide">
        <h2>Evolution Line</h2>
        ${evoChainHTML(p.chain, p.species)}
      </section>

      ${varieties.length > 1 ? `
      <section class="panel wide">
        <h2>Forms & Variants</h2>
        <div class="forms-row">
          ${varieties.map(v => `
            <a class="form-card${v.id === p.id ? ' current' : ''}" href="#/pokemon/${v.id}">
              <img loading="lazy" src="${imgUrl(v)}" alt="" onerror="this.src='${spriteUrl(v.id)}'">
              <span>${esc(v.default ? 'Base' : formLabel(v))}</span>
            </a>`).join('')}
        </div>
      </section>` : ''}

      <section class="panel wide">
        <h2>Move Pool</h2>
        <div id="moves-box"><div class="moves-loading">DOWNLOADING MOVE DATA<span class="blink">▌</span></div></div>
      </section>
    </div>
  </div>`

  requestAnimationFrame(() => requestAnimationFrame(() => {
    document.querySelectorAll('.stat-fill').forEach(el => el.style.width = el.dataset.w + '%')
  }))

  document.getElementById('fav-btn').onclick = e => toggleFav(p.id, e.target)
  const cryBtn = document.getElementById('cry-btn')
  if (cryBtn) cryBtn.onclick = () => playCry(p.id, cryBtn)
  const shinyBtn = document.getElementById('shiny-btn')
  if (shinyBtn) {
    let shiny = false
    shinyBtn.onclick = () => {
      shiny = !shiny
      shinyBtn.classList.toggle('on', shiny)
      document.getElementById('hero-art').src = artUrl(p.id, shiny)
      const anim = document.getElementById('hero-anim')
      if (anim) anim.src = animUrl(p.id, shiny)
    }
  }
  loadMoves(p)
}

async function loadMoves(p) {
  const box = document.getElementById('moves-box')
  try {
    if (!MOVES) MOVES = await (await fetch('/data/moves.json')).json()
    const raw = await (await fetch(`https://pokeapi.co/api/v2/pokemon/${p.id}`)).json()
    if (!document.getElementById('moves-box')) return
    const methods = new Map()
    for (const m of raw.moves) {
      const latest = m.version_group_details[m.version_group_details.length - 1]
      const method = latest.move_learn_method.name
      if (!methods.has(method)) methods.set(method, [])
      methods.get(method).push({ name: m.move.name, level: latest.level_learned_at, ...(MOVES[m.move.name] || {}) })
    }
    if (!methods.size) { box.innerHTML = '<div class="moves-loading">NO MOVE DATA AVAILABLE</div>'; return }
    const order = ['level-up', 'machine', 'egg', 'tutor']
    const tabs = [...methods.keys()].sort((a, b) => (order.indexOf(a) + 99) % 99 - (order.indexOf(b) + 99) % 99)
    let active = tabs[0]
    const render = () => {
      const moves = methods.get(active).slice().sort((a, b) => active === 'level-up' ? a.level - b.level : a.name.localeCompare(b.name))
      box.innerHTML = `
        <div class="moves-controls">
          ${tabs.map(t => `<button class="ctl-btn${t === active ? ' on' : ''}" data-tab="${t}">${cap(t)} (${methods.get(t).length})</button>`).join('')}
        </div>
        <div class="table-scroll"><table class="moves-table">
          <thead><tr>${active === 'level-up' ? '<th>LV</th>' : ''}<th>MOVE</th><th>TYPE</th><th>CAT</th><th>PWR</th><th>ACC</th><th>PP</th><th>EFFECT</th></tr></thead>
          <tbody>
            ${moves.map(m => `<tr>
              ${active === 'level-up' ? `<td class="mono">${m.level || '—'}</td>` : ''}
              <td class="move-name">${cap(m.name)}</td>
              <td>${m.type ? badge(m.type) : '—'}</td>
              <td class="dmg-ico" title="${m.class || ''}">${DMG_ICON[m.class] || '—'}</td>
              <td class="mono">${m.power ?? '—'}</td>
              <td class="mono">${m.acc != null ? m.acc + '%' : '—'}</td>
              <td class="mono">${m.pp ?? '—'}</td>
              <td class="mono" style="max-width:340px">${esc(m.effect || '')}</td>
            </tr>`).join('')}
          </tbody>
        </table></div>`
      box.querySelectorAll('[data-tab]').forEach(b => b.onclick = () => { active = b.dataset.tab; render() })
    }
    render()
  } catch {
    if (box) box.innerHTML = '<div class="moves-loading">MOVE UPLINK FAILED — LIVE API UNREACHABLE</div>'
  }
}

function typesView(selected) {
  document.title = 'TYPE MATRIX — POKÉDEX'
  const types = Object.keys(TYPES)
  app.innerHTML = `
    <h1 class="page-title">TYPE MATRIX</h1>
    <p class="page-sub">FULL ATTACK ➜ DEFENSE EFFECTIVENESS CHART // TAP A TYPE FOR ITS PROFILE</p>
    <div class="type-page-grid">
      ${types.map(t => `<a class="type-tile${selected === t ? ' on' : ''}" href="#/types/${t}" style="--tc:${tc(t)}">${t}</a>`).join('')}
    </div>
    <div id="type-detail"></div>
    <div class="matrix-wrap">
      <table class="matrix">
        <thead><tr><th class="row-t">ATK ↓ / DEF →</th>${types.map(t => `<th class="rot" style="color:${tc(t)}">${t}</th>`).join('')}</tr></thead>
        <tbody>
          ${types.map(atk => `<tr><th class="row-t" style="color:${tc(atk)}">${atk}</th>
            ${types.map(def => {
              const rel = TYPES[atk]
              const m = rel.double_to.includes(def) ? 2 : rel.half_to.includes(def) ? .5 : rel.no_to.includes(def) ? 0 : 1
              return `<td class="m${String(m).replace('.', '')}" title="${atk} → ${def}: ×${m}">${m === 1 ? '·' : m === .5 ? '½' : m}</td>`
            }).join('')}
          </tr>`).join('')}
        </tbody>
      </table>
    </div>`
  if (selected && TYPES[selected]) {
    const r = TYPES[selected]
    const members = DEX.filter(p => p.default && p.types.includes(selected))
    const group = (label, list) => list.length ? `<div class="eff-group"><div class="eff-label">${label}</div><div class="eff-badges">${list.map(t => badge(t)).join('')}</div></div>` : ''
    document.getElementById('type-detail').innerHTML = `
      <section class="panel wide" style="margin-bottom:26px; --accent:${tc(selected)}">
        <h2>${selected} · Combat Profile</h2>
        <div class="panel-grid" style="gap:20px">
          <div>
            ${group('SUPER EFFECTIVE AGAINST (×2)', r.double_to)}
            ${group('NOT VERY EFFECTIVE AGAINST (×½)', r.half_to)}
            ${group('NO EFFECT ON (×0)', r.no_to)}
          </div>
          <div>
            ${group('WEAK TO (×2)', r.double_from)}
            ${group('RESISTS (×½)', r.half_from)}
            ${group('IMMUNE TO (×0)', r.no_from)}
          </div>
        </div>
        <div class="result-line" style="padding-top:16px"><b>${members.length}</b> ${selected.toUpperCase()}-TYPE POKÉMON REGISTERED</div>
        <div class="grid">${members.slice(0, 24).map((p, i) => cardHTML(p, i)).join('')}</div>
        ${members.length > 24 ? `<div class="result-line" style="padding-top:14px; text-align:center"><a href="#/" onclick="void 0" class="mono" style="color:var(--accent)" id="see-all-type">SEE ALL ${members.length} IN THE DEX →</a></div>` : ''}
      </section>`
    const seeAll = document.getElementById('see-all-type')
    if (seeAll) seeAll.onclick = e => {
      e.preventDefault()
      state.types = new Set([selected]); state.q = ''; state.gen = 0; state.rarity = ''
      location.hash = '#/'
    }
    document.querySelector('#type-detail .panel').scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
}

function pickerHTML(side) {
  return `<div class="picker">
    <input type="text" id="pick-${side}" placeholder="SEARCH POKÉMON…" autocomplete="off">
    <div class="picker-list" id="list-${side}"></div>
  </div>`
}

const cmp = { a: null, b: null }
function compareView() {
  document.title = 'COMPARE — POKÉDEX'
  app.innerHTML = `
    <h1 class="page-title">HEAD-TO-HEAD</h1>
    <p class="page-sub">SELECT TWO POKÉMON // STAT-BY-STAT BATTLE COMPARISON</p>
    <div class="compare-pickers">${pickerHTML('a')}<div class="compare-vs">VS</div>${pickerHTML('b')}</div>
    <div id="cmp-result"></div>`
  for (const side of ['a', 'b']) {
    const input = document.getElementById(`pick-${side}`)
    const list = document.getElementById(`list-${side}`)
    if (cmp[side]) input.value = displayName(cmp[side])
    input.addEventListener('input', () => {
      const q = input.value.trim().toLowerCase()
      if (q.length < 2) { list.classList.remove('open'); return }
      const hits = DEX.filter(p => p.name.includes(q) || p.label.toLowerCase().includes(q) || String(p.species) === q).slice(0, 12)
      list.innerHTML = hits.map(p => `<div class="picker-item" data-id="${p.id}"><img loading="lazy" src="${spriteUrl(p.id)}" onerror="this.style.visibility='hidden'"><span>${esc(displayName(p))}</span><span class="mono">${pad(p.species)}</span></div>`).join('')
      list.classList.toggle('open', hits.length > 0)
      list.querySelectorAll('.picker-item').forEach(item => item.onclick = () => {
        cmp[side] = byId.get(Number(item.dataset.id))
        input.value = displayName(cmp[side])
        list.classList.remove('open')
        renderCmp()
      })
    })
    input.addEventListener('focus', () => input.select())
  }
  renderCmp()
}

function renderCmp() {
  const box = document.getElementById('cmp-result')
  if (!box) return
  if (!cmp.a || !cmp.b) { box.innerHTML = '<div class="empty">Pick two combatants</div>'; return }
  const { a, b } = cmp
  const ta = a.stats.reduce((x, y) => x + y, 0), tb = b.stats.reduce((x, y) => x + y, 0)
  const card = (p, t) => `<div class="cmp-card">
    <a href="#/pokemon/${p.id}"><img src="${imgUrl(p)}" alt="${esc(p.label)}" onerror="this.src='${spriteUrl(p.id)}'"></a>
    <div class="cmp-name">${esc(displayName(p))}</div>
    <div class="card-types" style="justify-content:center">${p.types.map(x => badge(x)).join('')}</div>
    <div class="result-line" style="text-align:center; padding-top:10px">BST <b>${t}</b></div>
  </div>`
  box.innerHTML = `
    <section class="panel wide">
      <div class="cmp-grid">${card(a, ta)}${card(b, tb)}</div>
      <div class="cmp-stats">
        ${STAT_NAMES.map((n, i) => {
          const va = a.stats[i], vb = b.stats[i], max = 200
          return `<div class="cmp-row">
            <span class="cmp-val${va > vb ? ' win' : ''}" style="text-align:right">${va}</span>
            <div class="cmp-bar left"><i style="width:${Math.min(va / max * 100, 100)}%"></i></div>
            <span class="stat-name">${n}</span>
            <div class="cmp-bar right"><i style="width:${Math.min(vb / max * 100, 100)}%"></i></div>
            <span class="cmp-val${vb > va ? ' win' : ''}">${vb}</span>
          </div>`
        }).join('')}
        <div class="cmp-row">
          <span class="cmp-val${ta > tb ? ' win' : ''}" style="text-align:right">${ta}</span>
          <div></div><span class="stat-name">TOTAL</span><div></div>
          <span class="cmp-val${tb > ta ? ' win' : ''}">${tb}</span>
        </div>
      </div>
    </section>`
}

function favoritesView() {
  document.title = 'SAVED — POKÉDEX'
  const list = [...favs].map(id => byId.get(id)).filter(Boolean).sort((a, b) => a.id - b.id)
  app.innerHTML = `
    <h1 class="page-title">SAVED ENTRIES</h1>
    <p class="page-sub"><b>${list.length}</b> POKÉMON BOOKMARKED // STORED LOCALLY ON THIS TERMINAL</p>
    ${list.length ? `<div class="grid">${list.map((p, i) => cardHTML(p, i)).join('')}</div>` : '<div class="empty">Nothing saved yet — tap ☆ on any Pokémon</div>'}`
}

function route() {
  if (observer) { observer.disconnect(); observer = null }
  document.documentElement.style.setProperty('--accent', 'var(--red)')
  document.documentElement.style.setProperty('--accent-soft', 'rgba(227, 53, 13, .12)')
  const hash = location.hash || '#/'
  const [path] = hash.slice(1).split('?')
  const parts = path.split('/').filter(Boolean)
  document.querySelectorAll('[data-nav]').forEach(a => a.classList.remove('active'))
  const mark = k => document.querySelector(`[data-nav="${k}"]`)?.classList.add('active')
  window.scrollTo(0, 0)
  if (parts[0] === 'pokemon' && parts[1]) { mark('dex'); detailView(Number(parts[1])) }
  else if (parts[0] === 'types') { mark('types'); typesView(parts[1]) }
  else if (parts[0] === 'compare') { mark('compare'); compareView() }
  else if (parts[0] === 'favorites') { mark('favorites'); favoritesView() }
  else { mark('dex'); dexView() }
}

document.getElementById('random-btn').onclick = () => {
  const p = DEX[Math.floor(Math.random() * DEX.length)]
  location.hash = `#/pokemon/${p.id}`
}

document.addEventListener('click', e => {
  const favBtn = e.target.closest('[data-fav]')
  if (favBtn) { e.preventDefault(); e.stopPropagation(); toggleFav(Number(favBtn.dataset.fav), favBtn) }
  if (!e.target.closest('.picker')) document.querySelectorAll('.picker-list').forEach(l => l.classList.remove('open'))
})

document.addEventListener('keydown', e => {
  if (e.target.matches('input, select, textarea')) return
  if (e.key === '/') { e.preventDefault(); document.getElementById('search')?.focus() }
  if (e.key === 'r' || e.key === 'R') document.getElementById('random-btn').click()
  const m = location.hash.match(/^#\/pokemon\/(\d+)/)
  if (m && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')) {
    const defaults = DEX.filter(x => x.default)
    const cur = byId.get(Number(m[1]))
    if (!cur) return
    const idx = defaults.findIndex(x => x.species === cur.species)
    const target = defaults[idx + (e.key === 'ArrowRight' ? 1 : -1)]
    if (target) location.hash = `#/pokemon/${target.id}`
  }
})

async function boot() {
  try {
    const [dex, evo, types, abilities] = await Promise.all([
      fetch('/data/pokedex.json').then(r => r.json()),
      fetch('/data/evolution.json').then(r => r.json()),
      fetch('/data/types.json').then(r => r.json()),
      fetch('/data/abilities.json').then(r => r.json()),
    ])
    DEX = dex; EVO = evo; TYPES = types; ABILITIES = abilities
    byId = new Map(DEX.map(p => [p.id, p]))
    saveFavs()
    window.addEventListener('hashchange', route)
    route()
  } catch (e) {
    app.innerHTML = `<div class="empty">UPLINK FAILED — ${esc(e.message)}</div>`
  }
}
boot()
