import type {
  Pokemon,
  PokemonSpecies,
  TypeData,
  MoveData,
  ItemData,
  AbilityData,
  EvolutionChain,
  RegionData,
  LocationData,
  LocationAreaData,
  NatureData,
  EggGroupData,
  GrowthRateData,
  PokemonShapeData,
  PokemonHabitatData,
  PokemonColorData,
  PokedexData,
  VersionData,
  VersionGroupData,
  LanguageData,
  PokemonEncounter,
  SimplifiedPokemon,
  SimplifiedMove,
  SimplifiedItem,
  SimplifiedAbility,
} from '../types';

const POKEAPI_BASE = 'https://pokeapi.co/api/v2';
const CACHE_TTL = 7 * 24 * 60 * 60; // 7 days in seconds

let cache: Map<string, { data: any; timestamp: number }> = new Map();

function getCacheKey(url: string): string {
  return url;
}

function isExpired(timestamp: number): boolean {
  return Date.now() - timestamp > CACHE_TTL * 1000;
}

async function fetchFromCacheOrAPI<T>(url: string): Promise<T> {
  const cacheKey = getCacheKey(url);
  const cached = cache.get(cacheKey);

  if (cached && !isExpired(cached.timestamp)) {
    return cached.data as T;
  }

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    const data = await response.json();
    cache.set(cacheKey, { data, timestamp: Date.now() });
    return data as T;
  } catch (error) {
    if (cached) {
      return cached.data as T;
    }
    throw error;
  }
}

export async function fetchPokemon(idOrName: string | number): Promise<Pokemon> {
  return fetchFromCacheOrAPI<Pokemon>(`${POKEAPI_BASE}/pokemon/${idOrName}/`);
}

export async function fetchPokemonSpecies(idOrName: string | number): Promise<PokemonSpecies> {
  return fetchFromCacheOrAPI<PokemonSpecies>(`${POKEAPI_BASE}/pokemon-species/${idOrName}/`);
}

export async function fetchPokemonList(limit: number = 1351, offset: number = 0): Promise<{ count: number; results: { name: string; url: string }[] }> {
  return fetchFromCacheOrAPI<{ count: number; results: { name: string; url: string }[] }>(
    `${POKEAPI_BASE}/pokemon?limit=${limit}&offset=${offset}`
  );
}

export async function fetchPokemonSpeciesList(limit: number = 1025, offset: number = 0): Promise<{ count: number; results: { name: string; url: string }[] }> {
  return fetchFromCacheOrAPI<{ count: number; results: { name: string; url: string }[] }>(
    `${POKEAPI_BASE}/pokemon-species?limit=${limit}&offset=${offset}`
  );
}

export async function fetchType(type: string): Promise<TypeData> {
  return fetchFromCacheOrAPI<TypeData>(`${POKEAPI_BASE}/type/${type}/`);
}

export async function fetchTypeList(): Promise<{ count: number; results: { name: string; url: string }[] }> {
  return fetchFromCacheOrAPI<{ count: number; results: { name: string; url: string }[] }>(
    `${POKEAPI_BASE}/type?limit=20`
  );
}

export async function fetchMove(idOrName: string | number): Promise<MoveData> {
  return fetchFromCacheOrAPI<MoveData>(`${POKEAPI_BASE}/move/${idOrName}/`);
}

export async function fetchMoveList(limit: number = 937, offset: number = 0): Promise<{ count: number; results: { name: string; url: string }[] }> {
  return fetchFromCacheOrAPI<{ count: number; results: { name: string; url: string }[] }>(
    `${POKEAPI_BASE}/move?limit=${limit}&offset=${offset}`
  );
}

export async function fetchItem(idOrName: string | number): Promise<ItemData> {
  return fetchFromCacheOrAPI<ItemData>(`${POKEAPI_BASE}/item/${idOrName}/`);
}

export async function fetchItemList(limit: number = 2221, offset: number = 0): Promise<{ count: number; results: { name: string; url: string }[] }> {
  return fetchFromCacheOrAPI<{ count: number; results: { name: string; url: string }[] }>(
    `${POKEAPI_BASE}/item?limit=${limit}&offset=${offset}`
  );
}

export async function fetchAbility(idOrName: string | number): Promise<AbilityData> {
  return fetchFromCacheOrAPI<AbilityData>(`${POKEAPI_BASE}/ability/${idOrName}/`);
}

export async function fetchAbilityList(limit: number = 373, offset: number = 0): Promise<{ count: number; results: { name: string; url: string }[] }> {
  return fetchFromCacheOrAPI<{ count: number; results: { name: string; url: string }[] }>(
    `${POKEAPI_BASE}/ability?limit=${limit}&offset=${offset}`
  );
}

export async function fetchEvolutionChain(id: number): Promise<EvolutionChain> {
  return fetchFromCacheOrAPI<EvolutionChain>(`${POKEAPI_BASE}/evolution-chain/${id}/`);
}

export async function fetchRegion(idOrName: string | number): Promise<RegionData> {
  return fetchFromCacheOrAPI<RegionData>(`${POKEAPI_BASE}/region/${idOrName}/`);
}

export async function fetchRegionList(): Promise<{ count: number; results: { name: string; url: string }[] }> {
  return fetchFromCacheOrAPI<{ count: number; results: { name: string; url: string }[] }>(
    `${POKEAPI_BASE}/region?limit=30`
  );
}

export async function fetchLocation(idOrName: string | number): Promise<LocationData> {
  return fetchFromCacheOrAPI<LocationData>(`${POKEAPI_BASE}/location/${idOrName}/`);
}

export async function fetchLocationList(limit: number = 1103, offset: number = 0): Promise<{ count: number; results: { name: string; url: string }[] }> {
  return fetchFromCacheOrAPI<{ count: number; results: { name: string; url: string }[] }>(
    `${POKEAPI_BASE}/location?limit=${limit}&offset=${offset}`
  );
}

export async function fetchLocationArea(idOrName: string | number): Promise<LocationAreaData> {
  return fetchFromCacheOrAPI<LocationAreaData>(`${POKEAPI_BASE}/location-area/${idOrName}/`);
}

export async function fetchPokemonEncounters(id: number): Promise<PokemonEncounter[]> {
  return fetchFromCacheOrAPI<PokemonEncounter[]>(`https://pokeapi.co/api/v2/pokemon/${id}/encounters`);
}

export async function fetchNature(idOrName: string | number): Promise<NatureData> {
  return fetchFromCacheOrAPI<NatureData>(`${POKEAPI_BASE}/nature/${idOrName}/`);
}

export async function fetchNatureList(limit: number = 25, offset: number = 0): Promise<{ count: number; results: { name: string; url: string }[] }> {
  return fetchFromCacheOrAPI<{ count: number; results: { name: string; url: string }[] }>(
    `${POKEAPI_BASE}/nature?limit=${limit}&offset=${offset}`
  );
}

export async function fetchEggGroup(idOrName: string | number): Promise<EggGroupData> {
  return fetchFromCacheOrAPI<EggGroupData>(`${POKEAPI_BASE}/egg-group/${idOrName}/`);
}

export async function fetchEggGroupList(): Promise<{ count: number; results: { name: string; url: string }[] }> {
  return fetchFromCacheOrAPI<{ count: number; results: { name: string; url: string }[] }>(
    `${POKEAPI_BASE}/egg-group?limit=40`
  );
}

export async function fetchGrowthRate(idOrName: string | number): Promise<GrowthRateData> {
  return fetchFromCacheOrAPI<GrowthRateData>(`${POKEAPI_BASE}/growth-rate/${idOrName}/`);
}

export async function fetchPokemonShape(idOrName: string | number): Promise<PokemonShapeData> {
  return fetchFromCacheOrAPI<PokemonShapeData>(`${POKEAPI_BASE}/pokemon-shape/${idOrName}/`);
}

export async function fetchPokemonShapeList(): Promise<{ count: number; results: { name: string; url: string }[] }> {
  return fetchFromCacheOrAPI<{ count: number; results: { name: string; url: string }[] }>(
    `${POKEAPI_BASE}/pokemon-shape?limit=20`
  );
}

export async function fetchPokemonHabitat(idOrName: string | number): Promise<PokemonHabitatData> {
  return fetchFromCacheOrAPI<PokemonHabitatData>(`${POKEAPI_BASE}/pokemon-habitat/${idOrName}/`);
}

export async function fetchPokemonHabitatList(): Promise<{ count: number; results: { name: string; url: string }[] }> {
  return fetchFromCacheOrAPI<{ count: number; results: { name: string; url: string }[] }>(
    `${POKEAPI_BASE}/pokemon-habitat?limit=20`
  );
}

export async function fetchPokemonColor(idOrName: string | number): Promise<PokemonColorData> {
  return fetchFromCacheOrAPI<PokemonColorData>(`${POKEAPI_BASE}/pokemon-color/${idOrName}/`);
}

export async function fetchPokemonColorList(): Promise<{ count: number; results: { name: string; url: string }[] }> {
  return fetchFromCacheOrAPI<{ count: number; results: { name: string; url: string }[] }>(
    `${POKEAPI_BASE}/pokemon-color?limit=20`
  );
}

export async function fetchPokedex(idOrName: string | number): Promise<PokedexData> {
  return fetchFromCacheOrAPI<PokedexData>(`${POKEAPI_BASE}/pokedex/${idOrName}/`);
}

export async function fetchPokedexList(): Promise<{ count: number; results: { name: string; url: string }[] }> {
  return fetchFromCacheOrAPI<{ count: number; results: { name: string; url: string }[] }>(
    `${POKEAPI_BASE}/pokedex?limit=30`
  );
}

export async function fetchVersion(idOrName: string | number): Promise<VersionData> {
  return fetchFromCacheOrAPI<VersionData>(`${POKEAPI_BASE}/version/${idOrName}/`);
}

export async function fetchVersionGroup(idOrName: string | number): Promise<VersionGroupData> {
  return fetchFromCacheOrAPI<VersionGroupData>(`${POKEAPI_BASE}/version-group/${idOrName}/`);
}

export async function fetchLanguage(idOrName: string | number): Promise<LanguageData> {
  return fetchFromCacheOrAPI<LanguageData>(`${POKEAPI_BASE}/language/${idOrName}/`);
}

export async function fetchLanguageList(): Promise<{ count: number; results: { name: string; url: string }[] }> {
  return fetchFromCacheOrAPI<{ count: number; results: { name: string; url: string }[] }>(
    `${POKEAPI_BASE}/language?limit=30`
  );
}

export async function fetchGeneration(idOrName: string | number): Promise<any> {
  return fetchFromCacheOrAPI<any>(`${POKEAPI_BASE}/generation/${idOrName}/`);
}

export async function fetchMachine(id: number): Promise<any> {
  return fetchFromCacheOrAPI<any>(`${POKEAPI_BASE}/machine/${id}/`);
}

export async function fetchPokemonForm(idOrName: string | number): Promise<any> {
  return fetchFromCacheOrAPI<any>(`${POKEAPI_BASE}/pokemon-form/${idOrName}/`);
}

export async function fetchPokemonFormList(limit: number = 1351, offset: number = 0): Promise<{ count: number; results: { name: string; url: string }[] }> {
  return fetchFromCacheOrAPI<{ count: number; results: { name: string; url: string }[] }>(
    `${POKEAPI_BASE}/pokemon-form?limit=${limit}&offset=${offset}`
  );
}

export async function fetchMoveLearnMethod(idOrName: string | number): Promise<any> {
  return fetchFromCacheOrAPI<any>(`${POKEAPI_BASE}/move-learn-method/${idOrName}/`);
}

export async function fetchMoveTarget(idOrName: string | number): Promise<any> {
  return fetchFromCacheOrAPI<any>(`${POKEAPI_BASE}/move-target/${idOrName}/`);
}

export async function fetchMoveAilment(idOrName: string | number): Promise<any> {
  return fetchFromCacheOrAPI<any>(`${POKEAPI_BASE}/move-ailment/${idOrName}/`);
}

export async function fetchMoveCategory(idOrName: string | number): Promise<any> {
  return fetchFromCacheOrAPI<any>(`${POKEAPI_BASE}/move-category/${idOrName}/`);
}

export async function fetchMoveDamageClass(idOrName: string | number): Promise<any> {
  return fetchFromCacheOrAPI<any>(`${POKEAPI_BASE}/move-damage-class/${idOrName}/`);
}

export async function fetchMoveBattleStyle(idOrName: string | number): Promise<any> {
  return fetchFromCacheOrAPI<any>(`${POKEAPI_BASE}/move-battle-style/${idOrName}/`);
}

export async function fetchEncounterMethod(idOrName: string | number): Promise<any> {
  return fetchFromCacheOrAPI<any>(`${POKEAPI_BASE}/encounter-method/${idOrName}/`);
}

export async function fetchEncounterCondition(idOrName: string | number): Promise<any> {
  return fetchFromCacheOrAPI<any>(`${POKEAPI_BASE}/encounter-condition/${idOrName}/`);
}

export async function fetchEncounterConditionValue(idOrName: string | number): Promise<any> {
  return fetchFromCacheOrAPI<any>(`${POKEAPI_BASE}/encounter-condition-value/${idOrName}/`);
}

export async function fetchContestType(idOrName: string | number): Promise<any> {
  return fetchFromCacheOrAPI<any>(`${POKEAPI_BASE}/contest-type/${idOrName}/`);
}

export async function fetchContestEffect(id: number): Promise<any> {
  return fetchFromCacheOrAPI<any>(`${POKEAPI_BASE}/contest-effect/${id}/`);
}

export async function fetchSuperContestEffect(id: number): Promise<any> {
  return fetchFromCacheOrAPI<any>(`${POKEAPI_BASE}/super-contest-effect/${id}/`);
}

export async function fetchItemAttribute(idOrName: string | number): Promise<any> {
  return fetchFromCacheOrAPI<any>(`${POKEAPI_BASE}/item-attribute/${idOrName}/`);
}

export async function fetchItemCategory(idOrName: string | number): Promise<any> {
  return fetchFromCacheOrAPI<any>(`${POKEAPI_BASE}/item-category/${idOrName}/`);
}

export async function fetchItemFlingEffect(idOrName: string | number): Promise<any> {
  return fetchFromCacheOrAPI<any>(`${POKEAPI_BASE}/item-fling-effect/${idOrName}/`);
}

export async function fetchItemPocket(idOrName: string | number): Promise<any> {
  return fetchFromCacheOrAPI<any>(`${POKEAPI_BASE}/item-pocket/${idOrName}/`);
}

export async function fetchBerry(idOrName: string | number): Promise<any> {
  return fetchFromCacheOrAPI<any>(`${POKEAPI_BASE}/berry/${idOrName}/`);
}

export async function fetchBerryFirmness(idOrName: string | number): Promise<any> {
  return fetchFromCacheOrAPI<any>(`${POKEAPI_BASE}/berry-firmness/${idOrName}/`);
}

export async function fetchBerryFlavor(idOrName: string | number): Promise<any> {
  return fetchFromCacheOrAPI<any>(`${POKEAPI_BASE}/berry-flavor/${idOrName}/`);
}

export async function fetchPalParkArea(idOrName: string | number): Promise<any> {
  return fetchFromCacheOrAPI<any>(`${POKEAPI_BASE}/pal-park-area/${idOrName}/`);
}

export async function fetchPokeathlonStat(idOrName: string | number): Promise<any> {
  return fetchFromCacheOrAPI<any>(`${POKEAPI_BASE}/pokeathlon-stat/${idOrName}/`);
}

export async function fetchCharacteristic(id: number): Promise<any> {
  return fetchFromCacheOrAPI<any>(`${POKEAPI_BASE}/characteristic/${id}/`);
}

export async function fetchGender(idOrName: string | number): Promise<any> {
  return fetchFromCacheOrAPI<any>(`${POKEAPI_BASE}/gender/${idOrName}/`);
}

export async function fetchEvolutionTrigger(idOrName: string | number): Promise<any> {
  return fetchFromCacheOrAPI<any>(`${POKEAPI_BASE}/evolution-trigger/${idOrName}/`);
}

export async function fetchStat(idOrName: string | number): Promise<any> {
  return fetchFromCacheOrAPI<any>(`${POKEAPI_BASE}/stat/${idOrName}/`);
}

export async function fetchStatList(): Promise<{ count: number; results: { name: string; url: string }[] }> {
  return fetchFromCacheOrAPI<{ count: number; results: { name: string; url: string }[] }>(
    `${POKEAPI_BASE}/stat?limit=20`
  );
}

export async function fetchAllPokemonConcurrent(
  ids: number[],
  concurrency: number = 10
): Promise<(Pokemon | null)[]> {
  const results: (Pokemon | null)[] = new Array(ids.length).fill(null);

  for (let i = 0; i < ids.length; i += concurrency) {
    const batch = ids.slice(i, i + concurrency);
    const promises = batch.map(async (id, index) => {
      try {
        const data = await fetchPokemon(id);
        results[i + index] = data;
      } catch (error) {
        results[i + index] = null;
      }
    });
    await Promise.all(promises);
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  return results;
}

export async function fetchAllSpeciesConcurrent(
  ids: number[],
  concurrency: number = 10
): Promise<(PokemonSpecies | null)[]> {
  const results: (PokemonSpecies | null)[] = new Array(ids.length).fill(null);

  for (let i = 0; i < ids.length; i += concurrency) {
    const batch = ids.slice(i, i + concurrency);
    const promises = batch.map(async (id, index) => {
      try {
        const data = await fetchPokemonSpecies(id);
        results[i + index] = data;
      } catch (error) {
        results[i + index] = null;
      }
    });
    await Promise.all(promises);
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  return results;
}

export async function fetchAllTypesConcurrent(
  types: string[],
  concurrency: number = 5
): Promise<(TypeData | null)[]> {
  const results: (TypeData | null)[] = new Array(types.length).fill(null);

  for (let i = 0; i < types.length; i += concurrency) {
    const batch = types.slice(i, i + concurrency);
    const promises = batch.map(async (type, index) => {
      try {
        const data = await fetchType(type);
        results[i + index] = data;
      } catch (error) {
        results[i + index] = null;
      }
    });
    await Promise.all(promises);
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  return results;
}

export async function fetchAllMovesConcurrent(
  ids: number[],
  concurrency: number = 10
): Promise<(MoveData | null)[]> {
  const results: (MoveData | null)[] = new Array(ids.length).fill(null);

  for (let i = 0; i < ids.length; i += concurrency) {
    const batch = ids.slice(i, i + concurrency);
    const promises = batch.map(async (id, index) => {
      try {
        const data = await fetchMove(id);
        results[i + index] = data;
      } catch (error) {
        results[i + index] = null;
      }
    });
    await Promise.all(promises);
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  return results;
}

export async function fetchAllItemsConcurrent(
  ids: number[],
  concurrency: number = 10
): Promise<(ItemData | null)[]> {
  const results: (ItemData | null)[] = new Array(ids.length).fill(null);

  for (let i = 0; i < ids.length; i += concurrency) {
    const batch = ids.slice(i, i + concurrency);
    const promises = batch.map(async (id, index) => {
      try {
        const data = await fetchItem(id);
        results[i + index] = data;
      } catch (error) {
        results[i + index] = null;
      }
    });
    await Promise.all(promises);
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  return results;
}

export async function fetchAllAbilitiesConcurrent(
  ids: number[],
  concurrency: number = 10
): Promise<(AbilityData | null)[]> {
  const results: (AbilityData | null)[] = new Array(ids.length).fill(null);

  for (let i = 0; i < ids.length; i += concurrency) {
    const batch = ids.slice(i, i + concurrency);
    const promises = batch.map(async (id, index) => {
      try {
        const data = await fetchAbility(id);
        results[i + index] = data;
      } catch (error) {
        results[i + index] = null;
      }
    });
    await Promise.all(promises);
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  return results;
}

export async function fetchAllEvolutionChainsConcurrent(
  ids: number[],
  concurrency: number = 5
): Promise<(EvolutionChain | null)[]> {
  const results: (EvolutionChain | null)[] = new Array(ids.length).fill(null);

  for (let i = 0; i < ids.length; i += concurrency) {
    const batch = ids.slice(i, i + concurrency);
    const promises = batch.map(async (id, index) => {
      try {
        const data = await fetchEvolutionChain(id);
        results[i + index] = data;
      } catch (error) {
        results[i + index] = null;
      }
    });
    await Promise.all(promises);
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  return results;
}

export async function fetchAllRegionsConcurrent(
  names: string[],
  concurrency: number = 5
): Promise<(RegionData | null)[]> {
  const results: (RegionData | null)[] = new Array(names.length).fill(null);

  for (let i = 0; i < names.length; i += concurrency) {
    const batch = names.slice(i, i + concurrency);
    const promises = batch.map(async (name, index) => {
      try {
        const data = await fetchRegion(name);
        results[i + index] = data;
      } catch (error) {
        results[i + index] = null;
      }
    });
    await Promise.all(promises);
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  return results;
}

export async function fetchAllLocationsConcurrent(
  ids: number[],
  concurrency: number = 10
): Promise<(LocationData | null)[]> {
  const results: (LocationData | null)[] = new Array(ids.length).fill(null);

  for (let i = 0; i < ids.length; i += concurrency) {
    const batch = ids.slice(i, i + concurrency);
    const promises = batch.map(async (id, index) => {
      try {
        const data = await fetchLocation(id);
        results[i + index] = data;
      } catch (error) {
        results[i + index] = null;
      }
    });
    await Promise.all(promises);
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  return results;
}

export async function fetchAllNaturesConcurrent(
  ids: number[],
  concurrency: number = 10
): Promise<(NatureData | null)[]> {
  const results: (NatureData | null)[] = new Array(ids.length).fill(null);

  for (let i = 0; i < ids.length; i += concurrency) {
    const batch = ids.slice(i, i + concurrency);
    const promises = batch.map(async (id, index) => {
      try {
        const data = await fetchNature(id);
        results[i + index] = data;
      } catch (error) {
        results[i + index] = null;
      }
    });
    await Promise.all(promises);
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  return results;
}

export async function fetchAllEggGroupsConcurrent(
  ids: number[],
  concurrency: number = 10
): Promise<(EggGroupData | null)[]> {
  const results: (EggGroupData | null)[] = new Array(ids.length).fill(null);

  for (let i = 0; i < ids.length; i += concurrency) {
    const batch = ids.slice(i, i + concurrency);
    const promises = batch.map(async (id, index) => {
      try {
        const data = await fetchEggGroup(id);
        results[i + index] = data;
      } catch (error) {
        results[i + index] = null;
      }
    });
    await Promise.all(promises);
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  return results;
}

export async function fetchAllGrowthRatesConcurrent(
  ids: number[],
  concurrency: number = 10
): Promise<(GrowthRateData | null)[]> {
  const results: (GrowthRateData | null)[] = new Array(ids.length).fill(null);

  for (let i = 0; i < ids.length; i += concurrency) {
    const batch = ids.slice(i, i + concurrency);
    const promises = batch.map(async (id, index) => {
      try {
        const data = await fetchGrowthRate(id);
        results[i + index] = data;
      } catch (error) {
        results[i + index] = null;
      }
    });
    await Promise.all(promises);
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  return results;
}

export async function fetchAllShapesConcurrent(
  ids: number[],
  concurrency: number = 10
): Promise<(PokemonShapeData | null)[]> {
  const results: (PokemonShapeData | null)[] = new Array(ids.length).fill(null);

  for (let i = 0; i < ids.length; i += concurrency) {
    const batch = ids.slice(i, i + concurrency);
    const promises = batch.map(async (id, index) => {
      try {
        const data = await fetchPokemonShape(id);
        results[i + index] = data;
      } catch (error) {
        results[i + index] = null;
      }
    });
    await Promise.all(promises);
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  return results;
}

export async function fetchAllHabitatsConcurrent(
  ids: number[],
  concurrency: number = 10
): Promise<(PokemonHabitatData | null)[]> {
  const results: (PokemonHabitatData | null)[] = new Array(ids.length).fill(null);

  for (let i = 0; i < ids.length; i += concurrency) {
    const batch = ids.slice(i, i + concurrency);
    const promises = batch.map(async (id, index) => {
      try {
        const data = await fetchPokemonHabitat(id);
        results[i + index] = data;
      } catch (error) {
        results[i + index] = null;
      }
    });
    await Promise.all(promises);
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  return results;
}

export async function fetchAllColorsConcurrent(
  ids: number[],
  concurrency: number = 10
): Promise<(PokemonColorData | null)[]> {
  const results: (PokemonColorData | null)[] = new Array(ids.length).fill(null);

  for (let i = 0; i < ids.length; i += concurrency) {
    const batch = ids.slice(i, i + concurrency);
    const promises = batch.map(async (id, index) => {
      try {
        const data = await fetchPokemonColor(id);
        results[i + index] = data;
      } catch (error) {
        results[i + index] = null;
      }
    });
    await Promise.all(promises);
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  return results;
}

export async function fetchAllPokedexesConcurrent(
  ids: number[],
  concurrency: number = 5
): Promise<(PokedexData | null)[]> {
  const results: (PokedexData | null)[] = new Array(ids.length).fill(null);

  for (let i = 0; i < ids.length; i += concurrency) {
    const batch = ids.slice(i, i + concurrency);
    const promises = batch.map(async (id, index) => {
      try {
        const data = await fetchPokedex(id);
        results[i + index] = data;
      } catch (error) {
        results[i + index] = null;
      }
    });
    await Promise.all(promises);
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  return results;
}

export async function fetchAllVersionsConcurrent(
  ids: number[],
  concurrency: number = 10
): Promise<(VersionData | null)[]> {
  const results: (VersionData | null)[] = new Array(ids.length).fill(null);

  for (let i = 0; i < ids.length; i += concurrency) {
    const batch = ids.slice(i, i + concurrency);
    const promises = batch.map(async (id, index) => {
      try {
        const data = await fetchVersion(id);
        results[i + index] = data;
      } catch (error) {
        results[i + index] = null;
      }
    });
    await Promise.all(promises);
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  return results;
}

export async function fetchAllVersionGroupsConcurrent(
  ids: number[],
  concurrency: number = 10
): Promise<(VersionGroupData | null)[]> {
  const results: (VersionGroupData | null)[] = new Array(ids.length).fill(null);

  for (let i = 0; i < ids.length; i += concurrency) {
    const batch = ids.slice(i, i + concurrency);
    const promises = batch.map(async (id, index) => {
      try {
        const data = await fetchVersionGroup(id);
        results[i + index] = data;
      } catch (error) {
        results[i + index] = null;
      }
    });
    await Promise.all(promises);
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  return results;
}

export async function fetchAllLanguagesConcurrent(
  ids: number[],
  concurrency: number = 10
): Promise<(LanguageData | null)[]> {
  const results: (LanguageData | null)[] = new Array(ids.length).fill(null);

  for (let i = 0; i < ids.length; i += concurrency) {
    const batch = ids.slice(i, i + concurrency);
    const promises = batch.map(async (id, index) => {
      try {
        const data = await fetchLanguage(id);
        results[i + index] = data;
      } catch (error) {
        results[i + index] = null;
      }
    });
    await Promise.all(promises);
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  return results;
}

export async function fetchAllEncountersConcurrent(
  ids: number[],
  concurrency: number = 10
): Promise<(PokemonEncounter[] | null)[]> {
  const results: (PokemonEncounter[] | null)[] = new Array(ids.length).fill(null);

  for (let i = 0; i < ids.length; i += concurrency) {
    const batch = ids.slice(i, i + concurrency);
    const promises = batch.map(async (id, index) => {
      try {
        const data = await fetchPokemonEncounters(id);
        results[i + index] = data;
      } catch (error) {
        results[i + index] = null;
      }
    });
    await Promise.all(promises);
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  return results;
}

export async function fetchAllEvolutionChainsForSpecies(
  speciesIds: number[],
  concurrency: number = 5
): Promise<EvolutionChain[]> {
  const chains = await fetchAllEvolutionChainsConcurrent(
    Array.from({ length: 541 }, (_, i) => i + 1),
    concurrency
  );
  return chains.filter((c): c is EvolutionChain => c !== null);
}
