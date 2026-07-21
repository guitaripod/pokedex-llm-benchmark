import { TOTAL_POKEMON } from "./data.js";

const API_BASE = "/api";
const memCache = new Map();
const pending = new Map();

async function fetchCached(path) {
  if (memCache.has(path)) return memCache.get(path);
  if (pending.has(path)) return pending.get(path);

  const promise = (async () => {
    try {
      const resp = await fetch(`${API_BASE}/${path}`);
      if (!resp.ok) throw new Error(`API error: ${resp.status}`);
      const data = await resp.json();
      memCache.set(path, data);
      pending.delete(path);
      return data;
    } catch (err) {
      pending.delete(path);
      throw err;
    }
  })();

  pending.set(path, promise);
  return promise;
}

export async function getPokemonList(limit = 1025, offset = 0) {
  return fetchCached(`pokemon?limit=${limit}&offset=${offset}`);
}

export async function getPokemon(idOrName) {
  return fetchCached(`pokemon/${idOrName}`);
}

export async function getCompositePokemon(idOrName) {
  return fetchCached(`pokemon/${idOrName}`);
}

export async function getSpecies(idOrName) {
  return fetchCached(`pokemon-species/${idOrName}`);
}

export async function getType(idOrName) {
  return fetchCached(`type/${idOrName}`);
}

export async function getAbility(idOrName) {
  return fetchCached(`ability/${idOrName}`);
}

export async function getMove(idOrName) {
  return fetchCached(`move/${idOrName}`);
}

export async function getItem(idOrName) {
  return fetchCached(`item/${idOrName}`);
}

export async function getBerry(idOrName) {
  return fetchCached(`berry/${idOrName}`);
}

export async function getNature(idOrName) {
  return fetchCached(`nature/${idOrName}`);
}

export async function getGeneration(idOrName) {
  return fetchCached(`generation/${idOrName}`);
}

export async function getEvolutionChain(id) {
  return fetchCached(`evolution-chain/${id}`);
}

export async function getList(resource, limit = 2000, offset = 0) {
  return fetchCached(`${resource}?limit=${limit}&offset=${offset}`);
}

export async function getItemCategory(idOrName) {
  return fetchCached(`item-category/${idOrName}`);
}

export async function getBerryFirmness(idOrName) {
  return fetchCached(`berry-firmness/${idOrName}`);
}

export async function getMoveLearnMethod(idOrName) {
  return fetchCached(`move-learn-method/${idOrName}`);
}

export async function getLocationArea(idOrName) {
  return fetchCached(`location-area/${idOrName}`);
}

let allPokemonCache = null;

export async function getAllPokemonRefs() {
  if (allPokemonCache) return allPokemonCache;
  const data = await getPokemonList(TOTAL_POKEMON, 0);
  allPokemonCache = data.results.map((r, i) => ({
    id: i + 1,
    name: r.name,
    url: r.url,
  }));
  return allPokemonCache;
}

let allAbilitiesCache = null;
export async function getAllAbilities() {
  if (allAbilitiesCache) return allAbilitiesCache;
  const data = await getList("ability", 1000, 0);
  allAbilitiesCache = data.results;
  return allAbilitiesCache;
}

let allMovesCache = null;
export async function getAllMoves() {
  if (allMovesCache) return allMovesCache;
  const data = await getList("move", 1000, 0);
  allMovesCache = data.results;
  return allMovesCache;
}

let allItemsCache = null;
export async function getAllItems() {
  if (allItemsCache) return allItemsCache;
  const data = await getList("item", 2500, 0);
  allItemsCache = data.results;
  return allItemsCache;
}

let allBerriesCache = null;
export async function getAllBerries() {
  if (allBerriesCache) return allBerriesCache;
  const data = await getList("berry", 100, 0);
  allBerriesCache = data.results;
  return allBerriesCache;
}

let allNaturesCache = null;
export async function getAllNatures() {
  if (allNaturesCache) return allNaturesCache;
  const data = await getList("nature", 30, 0);
  allNaturesCache = data.results;
  return allNaturesCache;
}

let allGenerationsCache = null;
export async function getAllGenerations() {
  if (allGenerationsCache) return allGenerationsCache;
  const data = await getList("generation", 10, 0);
  allGenerationsCache = data.results;
  return allGenerationsCache;
}

export function clearCache() {
  memCache.clear();
  allPokemonCache = null;
  allAbilitiesCache = null;
  allMovesCache = null;
  allItemsCache = null;
  allBerriesCache = null;
  allNaturesCache = null;
  allGenerationsCache = null;
}
