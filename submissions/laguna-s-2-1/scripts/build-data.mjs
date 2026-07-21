import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { resolve } from 'path';

const API_BASE = 'https://pokeapi.co/api/v2';
const DATA_DIR = resolve(process.cwd(), 'public', 'data');
const CACHE_TTL = 86400;

async function fetchWithCache(url: string): Promise<any> {
  const cachePath = resolve(DATA_DIR, '.cache', `${encodeURIComponent(url)}.json`);
  if (existsSync(cachePath)) {
    const stats = require('fs').statSync(cachePath);
    if (Date.now() - stats.mtimeMs < CACHE_TTL * 1000) {
      return JSON.parse(require('fs').readFileSync(cachePath, 'utf-8'));
    }
  }

  console.log(`Fetching: ${url}`);
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status}`);
  }
  const data = await response.json();

  if (!existsSync(resolve(DATA_DIR, '.cache'))) {
    mkdirSync(resolve(DATA_DIR, '.cache'), { recursive: true });
  }
  writeFileSync(cachePath, JSON.stringify(data));

  await new Promise((resolve) => setTimeout(resolve, 100));
  return data;
}

async function buildPokemonList() {
  console.log('Building Pokemon list...');
  const list = await fetchWithCache(`${API_BASE}/pokemon?limit=1351&offset=0`);
  const pokemon = list.results.map((p: any) => {
    const id = parseInt(p.url.split('/').slice(-2)[0]);
    return { id, name: p.name, url: p.url };
  });

  writeFileSync(resolve(DATA_DIR, 'pokemon-list.json'), JSON.stringify(pokemon));
  console.log(`  Saved ${pokemon.length} Pokemon`);
}

async function buildSpeciesList() {
  console.log('Building species list...');
  const list = await fetchWithCache(`${API_BASE}/pokemon-species?limit=1025&offset=0`);
  const species = list.results.map((s: any) => {
    const id = parseInt(s.url.split('/').slice(-2)[0]);
    return { id, name: s.name, url: s.url };
  });

  writeFileSync(resolve(DATA_DIR, 'species-list.json'), JSON.stringify(species));
  console.log(`  Saved ${species.length} species`);
}

async function buildTypeList() {
  console.log('Building type list...');
  const list = await fetchWithCache(`${API_BASE}/type`);
  const types = list.results.map((t: any) => ({ name: t.name, url: t.url }));

  writeFileSync(resolve(DATA_DIR, 'type-list.json'), JSON.stringify(types));
  console.log(`  Saved ${types.length} types`);
}

async function buildMoveList() {
  console.log('Building move list...');
  const list = await fetchWithCache(`${API_BASE}/move?limit=937&offset=0`);
  const moves = list.results.map((m: any) => {
    const id = parseInt(m.url.split('/').slice(-2)[0]);
    return { id, name: m.name, url: m.url };
  });

  writeFileSync(resolve(DATA_DIR, 'move-list.json'), JSON.stringify(moves));
  console.log(`  Saved ${moves.length} moves`);
}

async function buildItemList() {
  console.log('Building item list...');
  const list = await fetchWithCache(`${API_BASE}/item?limit=2221&offset=0`);
  const items = list.results.map((i: any) => {
    const id = parseInt(i.url.split('/').slice(-2)[0]);
    return { id, name: i.name, url: i.url };
  });

  writeFileSync(resolve(DATA_DIR, 'item-list.json'), JSON.stringify(items));
  console.log(`  Saved ${items.length} items`);
}

async function buildAbilityList() {
  console.log('Building ability list...');
  const list = await fetchWithCache(`${API_BASE}/ability?limit=373&offset=0`);
  const abilities = list.results.map((a: any) => {
    const id = parseInt(a.url.split('/').slice(-2)[0]);
    return { id, name: a.name, url: a.url };
  });

  writeFileSync(resolve(DATA_DIR, 'ability-list.json'), JSON.stringify(abilities));
  console.log(`  Saved ${abilities.length} abilities`);
}

async function buildEvolutionChainList() {
  console.log('Building evolution chain list...');
  const list = await fetchWithCache(`${API_BASE}/evolution-chain?limit=541&offset=0`);
  const chains = list.results.map((c: any) => {
    const id = parseInt(c.url.split('/').slice(-2)[0]);
    return { id, name: c.name, url: c.url };
  });

  writeFileSync(resolve(DATA_DIR, 'evolution-chain-list.json'), JSON.stringify(chains));
  console.log(`  Saved ${chains.length} evolution chains`);
}

async function buildLocationList() {
  console.log('Building location list...');
  const list = await fetchWithCache(`${API_BASE}/location?limit=1103&offset=0`);
  const locations = list.results.map((l: any) => {
    const id = parseInt(l.url.split('/').slice(-2)[0]);
    return { id, name: l.name, url: l.url };
  });

  writeFileSync(resolve(DATA_DIR, 'location-list.json'), JSON.stringify(locations));
  console.log(`  Saved ${locations.length} locations`);
}

async function buildRegionList() {
  console.log('Building region list...');
  const list = await fetchWithCache(`${API_BASE}/region`);
  const regions = list.results.map((r: any) => ({ name: r.name, url: r.url }));

  writeFileSync(resolve(DATA_DIR, 'region-list.json'), JSON.stringify(regions));
  console.log(`  Saved ${regions.length} regions`);
}

async function buildVersionList() {
  console.log('Building version list...');
  const list = await fetchWithCache(`${API_BASE}/version`);
  const versions = list.results.map((v: any) => ({ name: v.name, url: v.url }));

  writeFileSync(resolve(DATA_DIR, 'version-list.json'), JSON.stringify(versions));
  console.log(`  Saved ${versions.length} versions`);
}

async function buildVersionGroupList() {
  console.log('Building version group list...');
  const list = await fetchWithCache(`${API_BASE}/version-group`);
  const versionGroups = list.results.map((v: any) => ({ name: v.name, url: v.url }));

  writeFileSync(resolve(DATA_DIR, 'version-group-list.json'), JSON.stringify(versionGroups));
  console.log(`  Saved ${versionGroups.length} version groups`);
}

async function buildNatureList() {
  console.log('Building nature list...');
  const list = await fetchWithCache(`${API_BASE}/nature?limit=25&offset=0`);
  const natures = list.results.map((n: any) => {
    const id = parseInt(n.url.split('/').slice(-2)[0]);
    return { id, name: n.name, url: n.url };
  });

  writeFileSync(resolve(DATA_DIR, 'nature-list.json'), JSON.stringify(natures));
  console.log(`  Saved ${natures.length} natures`);
}

async function buildEggGroupList() {
  console.log('Building egg group list...');
  const list = await fetchWithCache(`${API_BASE}/egg-group`);
  const eggGroups = list.results.map((e: any) => ({ name: e.name, url: e.url }));

  writeFileSync(resolve(DATA_DIR, 'egg-group-list.json'), JSON.stringify(eggGroups));
  console.log(`  Saved ${eggGroups.length} egg groups`);
}

async function buildGrowthRateList() {
  console.log('Building growth rate list...');
  const list = await fetchWithCache(`${API_BASE}/growth-rate`);
  const growthRates = list.results.map((g: any) => ({ name: g.name, url: g.url }));

  writeFileSync(resolve(DATA_DIR, 'growth-rate-list.json'), JSON.stringify(growthRates));
  console.log(`  Saved ${growthRates.length} growth rates`);
}

async function buildStatList() {
  console.log('Building stat list...');
  const list = await fetchWithCache(`${API_BASE}/stat?limit=100&offset=0`);
  const stats = list.results.map((s: any) => ({ name: s.name, url: s.url }));

  writeFileSync(resolve(DATA_DIR, 'stat-list.json'), JSON.stringify(stats));
  console.log(`  Saved ${stats.length} stats`);
}

async function buildMoveDamageClassList() {
  console.log('Building move damage class list...');
  const list = await fetchWithCache(`${API_BASE}/move-damage-class`);
  const damageClasses = list.results.map((d: any) => ({ name: d.name, url: d.url }));

  writeFileSync(resolve(DATA_DIR, 'move-damage-class-list.json'), JSON.stringify(damageClasses));
  console.log(`  Saved ${damageClasses.length} damage classes`);
}

async function buildMoveTargetList() {
  console.log('Building move target list...');
  const list = await fetchWithCache(`${API_BASE}/move-target`);
  const targets = list.results.map((t: any) => ({ name: t.name, url: t.url }));

  writeFileSync(resolve(DATA_DIR, 'move-target-list.json'), JSON.stringify(targets));
  console.log(`  Saved ${targets.length} move targets`);
}

async function buildMoveCategoryList() {
  console.log('Building move category list...');
  const list = await fetchWithCache(`${API_BASE}/move-category`);
  const categories = list.results.map((c: any) => ({ name: c.name, url: c.url }));

  writeFileSync(resolve(DATA_DIR, 'move-category-list.json'), JSON.stringify(categories));
  console.log(`  Saved ${categories.length} move categories`);
}

async function buildItemCategoryList() {
  console.log('Building item category list...');
  const list = await fetchWithCache(`${API_BASE}/item-category`);
  const categories = list.results.map((c: any) => ({ name: c.name, url: c.url }));

  writeFileSync(resolve(DATA_DIR, 'item-category-list.json'), JSON.stringify(categories));
  console.log(`  Saved ${categories.length} item categories`);
}

async function buildItemFlingEffectList() {
  console.log('Building item fling effect list...');
  const list = await fetchWithCache(`${API_BASE}/item-fling-effect`);
  const effects = list.results.map((e: any) => ({ name: e.name, url: e.url }));

  writeFileSync(resolve(DATA_DIR, 'item-fling-effect-list.json'), JSON.stringify(effects));
  console.log(`  Saved ${effects.length} fling effects`);
}

async function buildEncounterMethodList() {
  console.log('Building encounter method list...');
  const list = await fetchWithCache(`${API_BASE}/encounter-method`);
  const methods = list.results.map((m: any) => ({ name: m.name, url: m.url }));

  writeFileSync(resolve(DATA_DIR, 'encounter-method-list.json'), JSON.stringify(methods));
  console.log(`  Saved ${methods.length} encounter methods`);
}

async function buildEncounterConditionList() {
  console.log('Building encounter condition list...');
  const list = await fetchWithCache(`${API_BASE}/encounter-condition`);
  const conditions = list.results.map((c: any) => ({ name: c.name, url: c.url }));

  writeFileSync(resolve(DATA_DIR, 'encounter-condition-list.json'), JSON.stringify(conditions));
  console.log(`  Saved ${conditions.length} encounter conditions`);
}

async function buildEvolutionTriggerList() {
  console.log('Building evolution trigger list...');
  const list = await fetchWithCache(`${API_BASE}/evolution-trigger`);
  const triggers = list.results.map((t: any) => ({ name: t.name, url: t.url }));

  writeFileSync(resolve(DATA_DIR, 'evolution-trigger-list.json'), JSON.stringify(triggers));
  console.log(`  Saved ${triggers.length} evolution triggers`);
}

async function buildLanguageList() {
  console.log('Building language list...');
  const list = await fetchWithCache(`${API_BASE}/language?limit=100&offset=0`);
  const languages = list.results.map((l: any) => ({ name: l.name, url: l.url }));

  writeFileSync(resolve(DATA_DIR, 'language-list.json'), JSON.stringify(languages));
  console.log(`  Saved ${languages.length} languages`);
}

async function buildPalPadList() {
  console.log('Building Pal Pad list...');
  const list = await fetchWithCache(`${API_BASE}/pal-pad`);
  const palPad = list.results.map((p: any) => ({ name: p.name, url: p.url }));

  writeFileSync(resolve(DATA_DIR, 'pal-pad-list.json'), JSON.stringify(palPad));
  console.log(`  Saved ${palPad.length} Pal Pad entries`);
}

async function buildBerryList() {
  console.log('Building berry list...');
  const list = await fetchWithCache(`${API_BASE}/berry?limit=100&offset=0`);
  const berries = list.results.map((b: any) => ({ name: b.name, url: b.url }));

  writeFileSync(resolve(DATA_DIR, 'berry-list.json'), JSON.stringify(berries));
  console.log(`  Saved ${berries.length} berries`);
}

async function buildBerryFirmnessList() {
  console.log('Building berry firmness list...');
  const list = await fetchWithCache(`${API_BASE}/berry-firmness`);
  const firmness = list.results.map((b: any) => ({ name: b.name, url: b.url }));

  writeFileSync(resolve(DATA_DIR, 'berry-firmness-list.json'), JSON.stringify(firmness));
  console.log(`  Saved ${firmness.length} berry firmness`);
}

async function buildBerryFlavorList() {
  console.log('Building berry flavor list...');
  const list = await fetchWithCache(`${API_BASE}/berry-flavor`);
  const flavors = list.results.map((b: any) => ({ name: b.name, url: b.url }));

  writeFileSync(resolve(DATA_DIR, 'berry-flavor-list.json'), JSON.stringify(flavors));
  console.log(`  Saved ${flavors.length} berry flavors`);
}

async function buildContestTypeList() {
  console.log('Building contest type list...');
  const list = await fetchWithCache(`${API_BASE}/contest-type`);
  const contestTypes = list.results.map((c: any) => ({ name: c.name, url: c.url }));

  writeFileSync(resolve(DATA_DIR, 'contest-type-list.json'), JSON.stringify(contestTypes));
  console.log(`  Saved ${contestTypes.length} contest types`);
}

async function buildSuperTrainingList() {
  console.log('Building super training list...');
  const list = await fetchWithCache(`${API_BASE}/super-training`);
  const superTraining = list.results.map((s: any) => ({ name: s.name, url: s.url }));

  writeFileSync(resolve(DATA_DIR, 'super-training-list.json'), JSON.stringify(superTraining));
  console.log(`  Saved ${superTraining.length} super training entries`);
}

async function buildAll() {
  console.log('Starting data build...\n');

  if (!existsSync(DATA_DIR)) {
    mkdirSync(DATA_DIR, { recursive: true });
  }

  await Promise.all([
    buildPokemonList(),
    buildSpeciesList(),
    buildTypeList(),
    buildMoveList(),
    buildItemList(),
    buildAbilityList(),
    buildEvolutionChainList(),
    buildLocationList(),
    buildRegionList(),
    buildVersionList(),
    buildVersionGroupList(),
    buildNatureList(),
    buildEggGroupList(),
    buildGrowthRateList(),
    buildStatList(),
    buildMoveDamageClassList(),
    buildMoveTargetList(),
    buildMoveCategoryList(),
    buildItemCategoryList(),
    buildItemFlingEffectList(),
    buildEncounterMethodList(),
    buildEncounterConditionList(),
    buildEvolutionTriggerList(),
    buildLanguageList(),
    buildPalPadList(),
    buildBerryList(),
    buildBerryFirmnessList(),
    buildBerryFlavorList(),
    buildContestTypeList(),
    buildSuperTrainingList(),
  ]);

  console.log('\nData build complete!');
}

buildAll().catch(console.error);
