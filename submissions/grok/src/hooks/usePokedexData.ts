import { useState, useCallback, useRef } from 'react'
import type { Pokemon, EvolutionStep } from '../types/pokemon'
import { GEN_RANGES } from '../types/pokemon'

const totalAvailable = 1025

interface MatchupData {
  weak: string[]
  resist: string[]
  immune: string[]
}

export function usePokedexData() {
  const [allPokemon, setAllPokemon] = useState<Pokemon[]>([])
  const [offset, setOffset] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const cacheRef = useRef(new Map<number | string, Pokemon>())
  const typeCacheRef = useRef(new Map<string, MatchupData>())

  const fetchTypeMatchups = useCallback(async (typeName: string): Promise<MatchupData | null> => {
    if (typeCacheRef.current.has(typeName)) return typeCacheRef.current.get(typeName)!
    try {
      const r = await fetch(`https://pokeapi.co/api/v2/type/${typeName}`)
      if (!r.ok) return null
      const t = await r.json()
      const rel = t.damage_relations || {}
      const data: MatchupData = {
        weak: (rel.double_damage_from || []).map((x: any) => x.name),
        resist: (rel.half_damage_from || []).map((x: any) => x.name),
        immune: (rel.no_damage_from || []).map((x: any) => x.name),
      }
      typeCacheRef.current.set(typeName, data)
      return data
    } catch {
      return null
    }
  }, [])

  const fetchEvolutionChain = useCallback(async (url: string): Promise<EvolutionStep[]> => {
    try {
      const res = await fetch(url)
      if (!res.ok) return []
      const chain = await res.json()

      const steps: EvolutionStep[] = []
      const walk = (node: any, prevCondition?: string) => {
        if (!node) return
        const id = parseInt(node.species.url.split('/').slice(-2, -1)[0])
        const det = (node.evolution_details && node.evolution_details[0]) || {}
        let cond = ''
        if (det.min_level) cond = `Lv. ${det.min_level}`
        else if (det.item?.name) cond = det.item.name.replace(/-/g, ' ')
        else if (det.trigger?.name) {
          cond = det.trigger.name.replace(/-/g, ' ')
          if (det.min_happiness) cond += ` (hap ${det.min_happiness})`
          if (det.time_of_day) cond += ` ${det.time_of_day}`
        }
        if (!cond && prevCondition) cond = prevCondition
        steps.push({ name: node.species.name, id, condition: cond || undefined })
        const children = node.evolves_to || []
        children.forEach((c: any) => walk(c, cond))
      }
      walk(chain.chain)
      return steps
    } catch {
      return []
    }
  }, [])

  const fetchDetail = useCallback(async (id: number): Promise<Pokemon | null> => {
    const cache = cacheRef.current
    if (cache.has(id)) return cache.get(id)!

    try {
      const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${id}`)
      if (!res.ok) return null
      const data: any = await res.json()

      let flavor = ''
      let speciesData: any = {}
      try {
        const sp = await fetch(data.species.url)
        if (sp.ok) {
          speciesData = await sp.json()
          const entry = speciesData.flavor_text_entries?.find((e: any) => e.language.name === 'en')
          if (entry) flavor = entry.flavor_text.replace(/\f/g, ' ').replace(/\n/g, ' ')
        }
      } catch {}

      const levelUp: { name: string; level: number }[] = []
      const fullMoves: { name: string; method: string; level?: number }[] = []
      const seen = new Set<string>()
      for (const m of (data.moves || [])) {
        const details = m.version_group_details || []
        const v = details.find((vd: any) => vd.move_learn_method?.name === 'level-up')
        const nm = m.move.name
        if (v && !seen.has(nm)) {
          seen.add(nm)
          levelUp.push({ name: nm, level: v.level_learned_at || 0 })
        }
        const method = details[0]?.move_learn_method?.name || 'other'
        fullMoves.push({ name: nm, method: method.replace('-', ' '), level: v?.level_learned_at })
      }
      levelUp.sort((a, b) => a.level - b.level || a.name.localeCompare(b.name))

      const full: Pokemon = {
        id: data.id,
        name: data.name,
        types: data.types,
        sprites: data.sprites,
        height: data.height,
        weight: data.weight,
        stats: data.stats,
        abilities: data.abilities,
        flavor_text: flavor || undefined,
        base_experience: data.base_experience,
        capture_rate: speciesData.capture_rate,
        base_happiness: speciesData.base_happiness,
        growth_rate: speciesData.growth_rate?.name,
        hatch_counter: speciesData.hatch_counter,
        gender_rate: speciesData.gender_rate,
        egg_groups: speciesData.egg_groups?.map((g: any) => g.name) || [],
        color: speciesData.color?.name,
        habitat: speciesData.habitat?.name,
        shape: speciesData.shape?.name,
        genus: speciesData.genera?.find((g: any) => g.language.name === 'en')?.genus,
        evolution_chain_url: speciesData.evolution_chain?.url,
        cries: data.cries,
        levelUpMoves: levelUp.slice(0, 8),
        fullMoves: fullMoves.slice(0, 12),
        is_legendary: speciesData.is_legendary,
        is_mythical: speciesData.is_mythical,
        is_baby: speciesData.is_baby,
      }
      cache.set(full.id, full)
      cache.set(full.name, full)
      return full
    } catch {
      return null
    }
  }, [])

  const loadBatch = useCallback(async (startOffset: number, count: number): Promise<Pokemon[]> => {
    const listRes = await fetch(`https://pokeapi.co/api/v2/pokemon?limit=${count}&offset=${startOffset}`)
    if (!listRes.ok) throw new Error('Failed to load list')
    const list = await listRes.json()

    const ids = list.results.map((_: any, i: number) => startOffset + i + 1)
    const details = await Promise.all(ids.map((id: number) => fetchDetail(id)))

    return details.filter((p): p is Pokemon => p !== null)
  }, [fetchDetail])

  const loadInitial = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const batch = await loadBatch(0, 80)
      setAllPokemon(batch)
      setOffset(80)
      setHasMore(batch.length > 0 && 80 < totalAvailable)
    } catch {
      setError('Failed to load Pokémon. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }, [loadBatch])

  const loadMore = useCallback(async () => {
    if (isLoading || !hasMore) return
    const currentOffset = offset
    setIsLoading(true)
    try {
      const nextCount = Math.min(60, totalAvailable - currentOffset)
      const batch = await loadBatch(currentOffset, nextCount)
      if (batch.length > 0) {
        setAllPokemon(prev => {
          const existingIds = new Set(prev.map(p => p.id))
          const unique = batch.filter(p => !existingIds.has(p.id))
          return unique.length ? [...prev, ...unique] : prev
        })
        const newOffset = currentOffset + batch.length
        setOffset(newOffset)
        setHasMore(newOffset < totalAvailable)
      } else {
        setHasMore(false)
      }
    } catch {
      // caller handles toast
    } finally {
      setIsLoading(false)
    }
  }, [isLoading, hasMore, offset, loadBatch])

  const ensureDataForGen = useCallback(async (gen: string) => {
    const range = gen === 'all' ? null : GEN_RANGES[gen]
    if (!range) return
    const target = range[0]
    if (offset >= target) return

    setIsLoading(true)
    try {
      let current = offset
      while (current < target && current < totalAvailable) {
        const count = Math.min(60, target - current)
        const batch = await loadBatch(current, count)
        if (batch.length === 0) break
        setAllPokemon(prev => {
          const existingIds = new Set(prev.map(p => p.id))
          const unique = batch.filter(p => !existingIds.has(p.id))
          return [...prev, ...unique]
        })
        current += batch.length
        setOffset(current)
        setHasMore(current < totalAvailable)
        await new Promise(r => setTimeout(r, 30))
      }
    } catch {
      // silent
    } finally {
      setIsLoading(false)
    }
  }, [offset, loadBatch])

  const enrichPokemon = useCallback(async (pokemon: Pokemon) => {
    let enriched = { ...pokemon }

    if (!pokemon.flavor_text || pokemon.stats.length === 0) {
      const full = await fetchDetail(pokemon.id)
      if (full) {
        enriched = full
        setAllPokemon(prev => {
          const idx = prev.findIndex(p => p.id === full.id)
          if (idx !== -1) {
            const copy = [...prev]
            copy[idx] = full
            return copy
          }
          return prev
        })
      }
    }

    if (pokemon.evolution_chain_url && !pokemon.evolutions) {
      const evos = await fetchEvolutionChain(pokemon.evolution_chain_url)
      enriched = { ...enriched, evolutions: evos }
      setAllPokemon(prev => {
        const idx = prev.findIndex(p => p.id === pokemon.id)
        if (idx !== -1) {
          const copy = [...prev]
          copy[idx] = enriched
          return copy
        }
        return prev
      })
    }

    return enriched
  }, [fetchDetail, fetchEvolutionChain])

  return {
    allPokemon,
    setAllPokemon,
    offset,
    isLoading,
    hasMore,
    error,
    setError,
    loadInitial,
    loadMore,
    ensureDataForGen,
    fetchDetail,
    fetchTypeMatchups,
    enrichPokemon,
    totalAvailable,
  }
}
