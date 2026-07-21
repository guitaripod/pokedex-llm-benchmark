import { useMemo, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { apiGet, apiGetUrl, artworkUrl, artworkShinyUrl, cryUrl, englishText, padId, spriteUrl, titleCase } from '../lib/api'
import type { Ability, EvolutionChain as EvoChain, Pokemon, Species } from '../lib/types'
import { useAsync } from '../hooks/useAsync'
import { BY_ID, POKEDEX } from '../lib/data'
import { STAT_COLORS, STAT_LABELS, TYPE_COLORS, genForId } from '../lib/constants'
import { ErrorState, Loader, SectionTitle, StatBar, TypeBadge } from '../components/ui'
import { StatRadar } from '../components/StatRadar'
import { TypeDefenses } from '../components/TypeDefenses'
import { EvolutionChain } from '../components/EvolutionChain'
import { MovesTable } from '../components/MovesTable'

export function PokemonDetailPage() {
  const { id } = useParams()
  const pid = Number(id)

  const { data, loading, error } = useAsync(async () => {
    const pokemon = await apiGet<Pokemon>(`pokemon/${pid}`)
    const species = await apiGetUrl<Species>(pokemon.species.url)
    const evo = await apiGetUrl<EvoChain>(species.evolution_chain.url)
    return { pokemon, species, evo }
  }, [pid])

  if (loading) return <Loader label={`Loading ${BY_ID.get(pid)?.name ? titleCase(BY_ID.get(pid)!.name) : `#${pid}`}…`} />
  if (error || !data) return <ErrorState message={error?.message ?? 'Not found'} />

  return <Detail {...data} />
}

function Detail({ pokemon, species, evo }: { pokemon: Pokemon; species: Species; evo: EvoChain }) {
  const [shiny, setShiny] = useState(false)
  const audioRef = useRef<HTMLAudioElement>(null)
  const types = pokemon.types.map((t) => t.type.name)
  const c1 = TYPE_COLORS[types[0]] ?? TYPE_COLORS.unknown
  const c2 = TYPE_COLORS[types[1]] ?? c1
  const gen = genForId(pokemon.id)

  const statMap = Object.fromEntries(pokemon.stats.map((s) => [s.stat.name, s.base_stat]))
  const total = pokemon.stats.reduce((a, s) => a + s.base_stat, 0)
  const genus = species.genera.find((g) => g.language.name === 'en')?.genus ?? ''
  const flavor = englishText(species.flavor_text_entries.map((f) => ({ language: f.language, flavor_text: f.flavor_text })))

  const prev = POKEDEX.find((p) => p.id === pokemon.id - 1)
  const next = POKEDEX.find((p) => p.id === pokemon.id + 1)

  const art = shiny ? artworkShinyUrl(pokemon.id) : artworkUrl(pokemon.id)

  const genderRate = species.gender_rate
  const femalePct = genderRate < 0 ? null : (genderRate / 8) * 100

  const playCry = () => {
    const el = audioRef.current
    if (el) {
      el.volume = 0.4
      el.currentTime = 0
      el.play().catch(() => {})
    }
  }

  return (
    <div className="animate-fade-in space-y-6">
      <audio ref={audioRef} src={pokemon.cries?.latest ?? cryUrl(pokemon.id)} preload="none" />

      {/* Hero */}
      <div className="relative overflow-hidden rounded-3xl p-6 text-white shadow-xl sm:p-8" style={{ background: `linear-gradient(135deg, ${c1.solid}, ${c2.solid})` }}>
        <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-white/10 blur-2xl" />
        <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[10rem] font-black leading-none text-white/10">
          {padId(pokemon.id).replace('#', '')}
        </div>

        <div className="relative flex items-center justify-between text-sm font-bold">
          <Link to="/" className="rounded-full bg-white/20 px-3 py-1 backdrop-blur hover:bg-white/30">← Pokédex</Link>
          <div className="flex gap-2">
            {prev && (
              <Link to={`/pokemon/${prev.id}`} className="rounded-full bg-white/20 px-3 py-1 backdrop-blur hover:bg-white/30">
                ← {padId(prev.id)}
              </Link>
            )}
            {next && (
              <Link to={`/pokemon/${next.id}`} className="rounded-full bg-white/20 px-3 py-1 backdrop-blur hover:bg-white/30">
                {padId(next.id)} →
              </Link>
            )}
          </div>
        </div>

        <div className="relative mt-4 flex flex-col items-center gap-6 sm:flex-row sm:items-center">
          <div className="relative flex flex-col items-center">
            <img
              src={art}
              alt={pokemon.name}
              className="h-56 w-56 object-contain drop-shadow-2xl animate-float"
              onError={(e) => ((e.target as HTMLImageElement).src = spriteUrl(pokemon.id))}
            />
            <div className="mt-2 flex gap-2">
              <button onClick={() => setShiny((s) => !s)} className="rounded-full bg-white/20 px-4 py-1.5 text-xs font-bold backdrop-blur hover:bg-white/30">
                {shiny ? '★ Shiny' : '☆ Normal'}
              </button>
              <button onClick={playCry} className="rounded-full bg-white/20 px-4 py-1.5 text-xs font-bold backdrop-blur hover:bg-white/30">
                🔊 Cry
              </button>
            </div>
          </div>

          <div className="flex-1 text-center sm:text-left">
            <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
              <span className="text-sm font-black tabular-nums text-white/80">{padId(pokemon.id)}</span>
              {gen && <span className="rounded-full bg-white/20 px-2.5 py-0.5 text-xs font-bold backdrop-blur">Gen {gen.id} · {gen.name}</span>}
              {species.is_legendary && <span className="rounded-full bg-yellow-400/90 px-2.5 py-0.5 text-xs font-black text-yellow-950">LEGENDARY</span>}
              {species.is_mythical && <span className="rounded-full bg-fuchsia-400/90 px-2.5 py-0.5 text-xs font-black text-fuchsia-950">MYTHICAL</span>}
              {species.is_baby && <span className="rounded-full bg-sky-300/90 px-2.5 py-0.5 text-xs font-black text-sky-950">BABY</span>}
            </div>
            <h1 className="mt-1 text-4xl font-black tracking-tight sm:text-5xl">{titleCase(pokemon.name)}</h1>
            {genus && <p className="text-lg font-semibold text-white/90">{genus}</p>}
            <div className="mt-3 flex flex-wrap justify-center gap-2 sm:justify-start">
              {types.map((t) => (
                <TypeBadge key={t} type={t} size="lg" />
              ))}
            </div>
            {flavor && <p className="mt-4 max-w-xl text-sm font-medium leading-relaxed text-white/90">{flavor}</p>}
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left column */}
        <div className="space-y-6 lg:col-span-2">
          {/* Stats */}
          <div className="card p-6">
            <SectionTitle icon="📊">Base Stats</SectionTitle>
            <div className="grid gap-6 sm:grid-cols-[1fr_240px] sm:items-center">
              <div className="space-y-2.5">
                {pokemon.stats.map((s) => (
                  <StatBar key={s.stat.name} label={STAT_LABELS[s.stat.name] ?? s.stat.name} value={s.base_stat} color={STAT_COLORS[s.stat.name] ?? c1.solid} />
                ))}
                <div className="mt-2 flex items-center gap-3 border-t border-slate-200/60 pt-2 dark:border-white/10">
                  <span className="w-14 text-xs font-black uppercase text-slate-500">Total</span>
                  <span className="w-9 text-right text-base font-black tabular-nums">{total}</span>
                </div>
              </div>
              <div className="mx-auto h-60 w-60">
                <StatRadar stats={statMap} color={c1.solid} />
              </div>
            </div>
          </div>

          {/* Abilities */}
          <div className="card p-6">
            <SectionTitle icon="✨">Abilities</SectionTitle>
            <div className="grid gap-3 sm:grid-cols-2">
              {pokemon.abilities.map((a) => (
                <AbilityCard key={a.ability.name} name={a.ability.name} hidden={a.is_hidden} />
              ))}
            </div>
          </div>

          {/* Type defenses */}
          <div className="card p-6">
            <SectionTitle icon="🛡️">Type Defenses</SectionTitle>
            <p className="mb-4 text-xs text-slate-400">Damage taken from each attacking type, given this Pokémon's type{types.length > 1 ? 's' : ''}.</p>
            <TypeDefenses types={types} />
          </div>

          {/* Evolution */}
          <div className="card p-6">
            <SectionTitle icon="🔁">Evolution Chain</SectionTitle>
            <EvolutionChain chain={evo.chain} />
          </div>

          {/* Moves */}
          <div className="card p-6">
            <SectionTitle icon="⚔️">Moves</SectionTitle>
            <MovesTable pokemon={pokemon} />
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-6">
          <div className="card p-6">
            <SectionTitle icon="📐">Profile</SectionTitle>
            <dl className="space-y-3 text-sm">
              <Row label="Height" value={`${(pokemon.height / 10).toFixed(1)} m`} />
              <Row label="Weight" value={`${(pokemon.weight / 10).toFixed(1)} kg`} />
              <Row label="Base Exp." value={pokemon.base_experience ? String(pokemon.base_experience) : '—'} />
              <Row label="Catch Rate" value={`${species.capture_rate} (${((species.capture_rate / 255) * 100).toFixed(1)}%)`} />
              <Row label="Base Friendship" value={String(species.base_happiness ?? '—')} />
              <Row label="Growth Rate" value={titleCase(species.growth_rate?.name ?? '—')} />
              <Row label="Egg Cycles" value={`${species.hatch_counter} (${(species.hatch_counter + 1) * 255} steps)`} />
              {species.habitat && <Row label="Habitat" value={titleCase(species.habitat.name)} />}
              {species.shape && <Row label="Shape" value={titleCase(species.shape.name)} />}
              <Row label="Color" value={titleCase(species.color?.name ?? '—')} />
            </dl>
          </div>

          <div className="card p-6">
            <SectionTitle icon="🥚">Breeding</SectionTitle>
            <dl className="space-y-3 text-sm">
              <div>
                <dt className="mb-1.5 text-xs font-bold uppercase text-slate-500">Gender Ratio</dt>
                {femalePct === null ? (
                  <dd className="font-semibold text-slate-400">Genderless</dd>
                ) : (
                  <dd>
                    <div className="flex h-3 overflow-hidden rounded-full">
                      <div className="bg-blue-400" style={{ width: `${100 - femalePct}%` }} />
                      <div className="bg-pink-400" style={{ width: `${femalePct}%` }} />
                    </div>
                    <div className="mt-1 flex justify-between text-xs font-semibold">
                      <span className="text-blue-500">♂ {(100 - femalePct).toFixed(1)}%</span>
                      <span className="text-pink-500">♀ {femalePct.toFixed(1)}%</span>
                    </div>
                  </dd>
                )}
              </div>
              <Row label="Egg Groups" value={species.egg_groups.map((g) => titleCase(g.name)).join(', ') || '—'} />
            </dl>
          </div>

          <TrainingCard pokemon={pokemon} />

          <Varieties species={species} currentId={pokemon.id} />

          {pokemon.held_items.length > 0 && (
            <div className="card p-6">
              <SectionTitle icon="🎒">Held Items</SectionTitle>
              <div className="space-y-2">
                {pokemon.held_items.map((h) => (
                  <Link key={h.item.name} to={`/items/${h.item.name}`} className="block rounded-lg px-3 py-2 text-sm font-semibold hover:bg-slate-100 dark:hover:bg-white/5">
                    {titleCase(h.item.name)}
                  </Link>
                ))}
              </div>
            </div>
          )}

          <PokedexEntries species={species} />
        </div>
      </div>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400">{label}</dt>
      <dd className="text-right font-semibold">{value}</dd>
    </div>
  )
}

function AbilityCard({ name, hidden }: { name: string; hidden: boolean }) {
  const { data } = useAsync(() => apiGet<Ability>(`ability/${name}`), [name])
  const effect = data ? englishText(data.effect_entries) : ''
  return (
    <Link to={`/abilities/${name}`} className="block rounded-xl border border-slate-200/60 p-3 transition hover:border-red-300 hover:shadow-md dark:border-white/10">
      <div className="flex items-center gap-2">
        <span className="font-bold">{titleCase(name)}</span>
        {hidden && <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-bold text-slate-600 dark:bg-white/10 dark:text-slate-300">HIDDEN</span>}
      </div>
      {effect && <p className="mt-1 line-clamp-2 text-xs text-slate-500 dark:text-slate-400">{effect}</p>}
    </Link>
  )
}

function TrainingCard({ pokemon }: { pokemon: Pokemon }) {
  const evs = pokemon.stats.filter((s) => s.effort > 0)
  return (
    <div className="card p-6">
      <SectionTitle icon="💪">EV Yield</SectionTitle>
      {evs.length ? (
        <div className="flex flex-wrap gap-2">
          {evs.map((s) => (
            <span key={s.stat.name} className="pill bg-slate-100 dark:bg-white/10">
              +{s.effort} {STAT_LABELS[s.stat.name] ?? s.stat.name}
            </span>
          ))}
        </div>
      ) : (
        <p className="text-sm text-slate-400">No EV yield.</p>
      )}
    </div>
  )
}

function Varieties({ species, currentId }: { species: Species; currentId: number }) {
  const forms = species.varieties.filter((v) => v.pokemon.name !== species.name)
  if (forms.length === 0) return null
  return (
    <div className="card p-6">
      <SectionTitle icon="🔀">Forms</SectionTitle>
      <div className="flex flex-wrap gap-2">
        {species.varieties.map((v) => {
          const vid = Number(v.pokemon.url.match(/\/(\d+)\/?$/)?.[1] ?? 0)
          const active = vid === currentId
          return (
            <Link
              key={v.pokemon.name}
              to={`/pokemon/${vid}`}
              className={`flex items-center gap-2 rounded-xl border px-3 py-1.5 text-xs font-semibold transition ${
                active ? 'border-red-400 bg-red-50 dark:bg-red-500/10' : 'border-slate-200/60 hover:border-red-300 dark:border-white/10'
              }`}
            >
              <img src={spriteUrl(vid)} alt="" className="h-8 w-8 object-contain" onError={(e) => ((e.target as HTMLImageElement).style.display = 'none')} />
              {titleCase(v.pokemon.name)}
            </Link>
          )
        })}
      </div>
    </div>
  )
}

function PokedexEntries({ species }: { species: Species }) {
  const [open, setOpen] = useState(false)
  const entries = useMemo(() => {
    const seen = new Set<string>()
    const out: { version: string; text: string }[] = []
    for (const e of species.flavor_text_entries) {
      if (e.language.name !== 'en') continue
      const text = e.flavor_text.replace(/[\n\f\r]+/g, ' ').replace(/\s+/g, ' ').trim()
      if (seen.has(text)) continue
      seen.add(text)
      out.push({ version: e.version.name, text })
    }
    return out
  }, [species])

  if (!entries.length) return null
  const shown = open ? entries : entries.slice(0, 3)
  return (
    <div className="card p-6">
      <SectionTitle icon="📖">Pokédex Entries</SectionTitle>
      <div className="space-y-3">
        {shown.map((e, i) => (
          <div key={i} className="border-l-2 border-slate-200 pl-3 dark:border-white/10">
            <div className="text-[10px] font-black uppercase tracking-wide text-slate-400">{titleCase(e.version)}</div>
            <p className="text-sm text-slate-600 dark:text-slate-300">{e.text}</p>
          </div>
        ))}
      </div>
      {entries.length > 3 && (
        <button onClick={() => setOpen((o) => !o)} className="mt-3 text-xs font-bold text-red-500">
          {open ? 'Show less' : `Show all ${entries.length} entries`}
        </button>
      )}
    </div>
  )
}
