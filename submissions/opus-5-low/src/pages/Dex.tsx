import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Empty, Loading, PokemonCard, TypeBadge, typeColor } from '../components/ui'
import { getIndex, getMeta } from '../lib/data'
import { useAsync, useDebounced, useInfinite } from '../lib/hooks'
import type { IndexEntry } from '../lib/types'
import { STAT_LABELS, STAT_SHORT, TYPE_ORDER, kilos, meters, padId, searchScore, title } from '../lib/util'
import { useStore } from '../store'

type Sort = 'id' | 'name' | 'bst' | 'hp' | 'attack' | 'defense' | 'special-attack' | 'special-defense' | 'speed' | 'height' | 'weight' | 'capture'

const SORTS: [Sort, string][] = [
  ['id', 'Dex number'], ['name', 'Name'], ['bst', 'Base stat total'],
  ['hp', 'HP'], ['attack', 'Attack'], ['defense', 'Defense'],
  ['special-attack', 'Sp. Atk'], ['special-defense', 'Sp. Def'], ['speed', 'Speed'],
  ['height', 'Height'], ['weight', 'Weight'], ['capture', 'Catch rate'],
]

const STAT_IDX: Record<string, number> = { hp: 0, attack: 1, defense: 2, 'special-attack': 3, 'special-defense': 4, speed: 5 }

export default function Dex() {
  const { data: index } = useAsync(getIndex, [])
  const { data: meta } = useAsync(getMeta, [])
  const { favorites } = useStore()
  const [params, setParams] = useSearchParams()

  const [q, setQ] = useState(params.get('q') ?? '')
  const query = useDebounced(q)
  const [types, setTypes] = useState<string[]>(params.get('types')?.split(',').filter(Boolean) ?? [])
  const [typeMode, setTypeMode] = useState<'any' | 'all' | 'exact'>('any')
  const [gens, setGens] = useState<number[]>(params.get('gen')?.split(',').filter(Boolean).map(Number) ?? [])
  const [sort, setSort] = useState<Sort>((params.get('sort') as Sort) ?? 'id')
  const [dir, setDir] = useState<'asc' | 'desc'>((params.get('dir') as 'asc' | 'desc') ?? 'asc')
  const [view, setView] = useState<'grid' | 'table'>((params.get('view') as 'grid' | 'table') ?? 'grid')
  const [showForms, setShowForms] = useState(params.get('forms') === '1')
  const [rarity, setRarity] = useState<string>('')
  const [eggGroup, setEggGroup] = useState('')
  const [color, setColor] = useState('')
  const [shape, setShape] = useState('')
  const [habitat, setHabitat] = useState('')
  const [growth, setGrowth] = useState('')
  const [ability, setAbility] = useState('')
  const [bstMin, setBstMin] = useState(0)
  const [advanced, setAdvanced] = useState(false)

  const sync = (patch: Record<string, string>) => {
    const next = new URLSearchParams(params)
    for (const [k, v] of Object.entries(patch)) v ? next.set(k, v) : next.delete(k)
    setParams(next, { replace: true })
  }

  const filtered = useMemo(() => {
    if (!index) return []
    const lower = query.trim().toLowerCase()
    let out = index.filter((e) => {
      if (!showForms && !e.isDefault) return false
      if (types.length) {
        if (typeMode === 'any' && !e.types.some((t) => types.includes(t))) return false
        if (typeMode === 'all' && !types.every((t) => e.types.includes(t))) return false
        if (typeMode === 'exact' && (e.types.length !== types.length || !types.every((t) => e.types.includes(t)))) return false
      }
      if (gens.length && !gens.includes(e.generation)) return false
      if (rarity === 'legendary' && !e.legendary) return false
      if (rarity === 'mythical' && !e.mythical) return false
      if (rarity === 'baby' && !e.baby) return false
      if (rarity === 'ordinary' && (e.legendary || e.mythical || e.baby)) return false
      if (rarity === 'favorite' && !favorites.includes(e.id)) return false
      if (eggGroup && !e.eggGroups.includes(eggGroup)) return false
      if (color && e.color !== color) return false
      if (shape && e.shape !== shape) return false
      if (habitat && e.habitat !== habitat) return false
      if (growth && e.growthRate !== growth) return false
      if (ability && !e.abilities.includes(ability)) return false
      if (e.bst < bstMin) return false
      if (lower && searchScore(e, lower) === 0) return false
      return true
    })

    if (lower) {
      out = out.map((e) => ({ e, s: searchScore(e, lower) })).sort((a, b) => b.s - a.s || a.e.id - b.e.id).map((x) => x.e)
      if (sort === 'id' && dir === 'asc') return out
    }
    const val = (e: IndexEntry): number | string =>
      sort === 'id' ? e.id
        : sort === 'name' ? e.label
        : sort === 'bst' ? e.bst
        : sort === 'height' ? e.height
        : sort === 'weight' ? e.weight
        : sort === 'capture' ? e.captureRate
        : e.stats[STAT_IDX[sort]]
    const sorted = [...out].sort((a, b) => {
      const av = val(a); const bv = val(b)
      const c = typeof av === 'string' ? String(av).localeCompare(String(bv)) : (av as number) - (bv as number)
      return dir === 'asc' ? c : -c
    })
    return sorted
  }, [index, query, types, typeMode, gens, rarity, eggGroup, color, shape, habitat, growth, ability, bstMin, showForms, sort, dir, favorites])

  const { count, sentinel } = useInfinite(filtered.length, view === 'grid' ? 60 : 100)

  const colors = useMemo(() => [...new Set((index ?? []).map((e) => e.color).filter(Boolean))].sort() as string[], [index])
  const shapes = useMemo(() => [...new Set((index ?? []).map((e) => e.shape).filter(Boolean))].sort() as string[], [index])
  const habitats = useMemo(() => [...new Set((index ?? []).map((e) => e.habitat).filter(Boolean))].sort() as string[], [index])
  const abilityNames = useMemo(() => [...new Set((index ?? []).flatMap((e) => e.abilities))].sort(), [index])

  if (!index || !meta) return <Loading label="Loading Pokédex" />

  const toggleType = (t: string) => {
    const next = types.includes(t) ? types.filter((x) => x !== t) : [...types, t]
    setTypes(next); sync({ types: next.join(',') })
  }
  const toggleGen = (g: number) => {
    const next = gens.includes(g) ? gens.filter((x) => x !== g) : [...gens, g]
    setGens(next); sync({ gen: next.join(',') })
  }

  return (
    <div className="container" style={{ display: 'grid', gap: 18 }}>
      <div className="row" style={{ justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1 style={{ fontSize: 30 }}>Pokédex</h1>
          <div className="faint small">{filtered.length.toLocaleString()} of {index.filter((e) => showForms || e.isDefault).length.toLocaleString()} entries</div>
        </div>
      </div>

      <div className="card card-pad filters">
        <div className="toolbar">
          <input
            className="input"
            style={{ maxWidth: 320 }}
            placeholder="Search name, number, genus, ability…"
            value={q}
            onChange={(e) => { setQ(e.target.value); sync({ q: e.target.value }) }}
          />
          <select className="input" style={{ width: 170 }} value={sort} onChange={(e) => { setSort(e.target.value as Sort); sync({ sort: e.target.value }) }}>
            {SORTS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
          <button className="btn" onClick={() => { const d = dir === 'asc' ? 'desc' : 'asc'; setDir(d); sync({ dir: d }) }}>
            {dir === 'asc' ? '↑ Ascending' : '↓ Descending'}
          </button>
          <button className="btn" onClick={() => { const v = view === 'grid' ? 'table' : 'grid'; setView(v); sync({ view: v }) }}>
            {view === 'grid' ? '▤ Table view' : '▦ Grid view'}
          </button>
          <label className="chip" style={{ cursor: 'pointer' }}>
            <input type="checkbox" checked={showForms} onChange={(e) => { setShowForms(e.target.checked); sync({ forms: e.target.checked ? '1' : '' }) }} />
            Alternate forms
          </label>
          <button className="btn" onClick={() => setAdvanced((a) => !a)}>{advanced ? '▲ Fewer filters' : '▼ More filters'}</button>
          <span className="spacer" />
          <button
            className="btn sm"
            onClick={() => {
              setQ(''); setTypes([]); setGens([]); setRarity(''); setEggGroup(''); setColor('')
              setShape(''); setHabitat(''); setGrowth(''); setAbility(''); setBstMin(0)
              setParams(new URLSearchParams(), { replace: true })
            }}
          >Reset</button>
        </div>

        <div className="filter-group">
          <div className="row">
            <span className="filter-label">Types</span>
            <div className="row" style={{ gap: 4 }}>
              {(['any', 'all', 'exact'] as const).map((m) => (
                <button key={m} className={`chip${typeMode === m ? ' on' : ''}`} onClick={() => setTypeMode(m)}>{m}</button>
              ))}
            </div>
          </div>
          <div className="chips">
            {TYPE_ORDER.map((t) => (
              <button
                key={t}
                className={`chip${types.includes(t) ? ' type-on' : ''}`}
                style={{ ['--tc' as string]: typeColor(t) }}
                onClick={() => toggleType(t)}
              >{t}</button>
            ))}
          </div>
        </div>

        <div className="filter-group">
          <span className="filter-label">Generation</span>
          <div className="chips">
            {meta.generations.map((g) => (
              <button key={g.id} className={`chip${gens.includes(g.id) ? ' on' : ''}`} onClick={() => toggleGen(g.id)}>
                {g.label.replace('Generation ', 'Gen ')} · {title(g.region ?? '')}
              </button>
            ))}
          </div>
        </div>

        {advanced && (
          <>
            <div className="filter-group">
              <span className="filter-label">Rarity</span>
              <div className="chips">
                {['', 'ordinary', 'legendary', 'mythical', 'baby', 'favorite'].map((r) => (
                  <button key={r} className={`chip${rarity === r ? ' on' : ''}`} onClick={() => setRarity(r)}>{r === '' ? 'All' : title(r)}</button>
                ))}
              </div>
            </div>
            <div className="row" style={{ gap: 12 }}>
              <Select label="Egg group" value={eggGroup} onChange={setEggGroup} options={meta.eggGroups.map((g) => [g.name, `${g.label} (${g.count})`])} />
              <Select label="Colour" value={color} onChange={setColor} options={colors.map((c) => [c, title(c)])} />
              <Select label="Shape" value={shape} onChange={setShape} options={shapes.map((c) => [c, title(c)])} />
              <Select label="Habitat" value={habitat} onChange={setHabitat} options={habitats.map((c) => [c, title(c)])} />
              <Select label="Growth rate" value={growth} onChange={setGrowth} options={meta.growthRates.map((g) => [g.name, title(g.name)])} />
              <Select label="Ability" value={ability} onChange={setAbility} options={abilityNames.map((a) => [a, title(a)])} />
              <div style={{ minWidth: 200 }}>
                <div className="filter-label">Min. base stat total — {bstMin}</div>
                <input type="range" min={0} max={780} step={10} value={bstMin} onChange={(e) => setBstMin(Number(e.target.value))} />
              </div>
            </div>
          </>
        )}
      </div>

      {filtered.length === 0 && <Empty>No Pokémon match those filters.</Empty>}

      {view === 'grid' ? (
        <div className="grid">
          {filtered.slice(0, count).map((p) => <PokemonCard key={p.id} p={p} />)}
        </div>
      ) : (
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th className="plain" />
                <th className="plain">#</th>
                <th className="plain">Name</th>
                <th className="plain">Types</th>
                {Object.keys(STAT_LABELS).map((k) => <th key={k} className="plain" style={{ textAlign: 'right' }}>{STAT_SHORT[k]}</th>)}
                <th className="plain" style={{ textAlign: 'right' }}>BST</th>
                <th className="plain" style={{ textAlign: 'right' }}>Height</th>
                <th className="plain" style={{ textAlign: 'right' }}>Weight</th>
              </tr>
            </thead>
            <tbody>
              {filtered.slice(0, count).map((p) => (
                <tr key={p.id}>
                  <td style={{ width: 44 }}><img src={p.sprite ?? ''} width={40} height={40} alt="" loading="lazy" style={{ imageRendering: 'pixelated' }} /></td>
                  <td className="num faint">{padId(p.id)}</td>
                  <td><Link to={`/pokemon/${p.name}`} style={{ fontWeight: 600 }}>{p.label}</Link></td>
                  <td><div className="row" style={{ gap: 4 }}>{p.types.map((t) => <TypeBadge key={t} type={t} sm />)}</div></td>
                  {p.stats.map((s, i) => <td key={i} className="num">{s}</td>)}
                  <td className="num" style={{ fontWeight: 700 }}>{p.bst}</td>
                  <td className="num faint">{meters(p.height)}</td>
                  <td className="num faint">{kilos(p.weight)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <div ref={sentinel} style={{ height: 1 }} />
      {count < filtered.length && <div className="faint" style={{ textAlign: 'center' }}>Showing {count} of {filtered.length}…</div>}
    </div>
  )
}

function Select({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: [string, string][] }) {
  return (
    <div style={{ minWidth: 160 }}>
      <div className="filter-label">{label}</div>
      <select className="input" value={value} onChange={(e) => onChange(e.target.value)}>
        <option value="">Any</option>
        {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
      </select>
    </div>
  )
}
