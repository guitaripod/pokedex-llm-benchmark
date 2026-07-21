import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { resolve } from 'path';

const API_BASE = 'https://pokeapi.co/api/v2';
const DATA_DIR = resolve(process.cwd(), 'public', 'data');

async function fetchWithCache(url: string): Promise<any> {
  const cachePath = resolve(DATA_DIR, '.cache', `${encodeURIComponent(url)}.json`);
  if (existsSync(cachePath)) {
    return JSON.parse(require('fs').readFileSync(cachePath, 'utf-8'));
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

async function buildMoveDetails() {
  console.log('Building move details...');

  const listPath = resolve(DATA_DIR, 'move-list.json');
  if (!existsSync(listPath)) {
    console.error('move-list.json not found. Run build-data first.');
    process.exit(1);
  }

  const moves = JSON.parse(require('fs').readFileSync(listPath, 'utf-8'));
  const moveDetails: any[] = [];

  for (const move of moves) {
    try {
      const data = await fetchWithCache(move.url);
      moveDetails.push({
        id: data.id,
        name: data.name,
        type: data.type?.name || 'normal',
        damage_class: data.damage_class?.name || 'status',
        power: data.power,
        accuracy: data.accuracy,
        pp: data.pp,
        priority: data.priority || 0,
        generation: data.generation?.name || 'generation-i',
        effect_entries: data.effect_entries?.filter((e: any) => e.language.name === 'en') || [],
        flavor_text_entries: data.flavor_text_entries?.filter((e: any) => e.language.name === 'en') || [],
        learned_by_pokemon: data.learned_by_pokemon?.map((p: any) => ({
          name: p.name,
          url: p.url,
        })) || [],
      });
      console.log(`  Processed: ${data.name} (#${data.id})`);
    } catch (error) {
      console.error(`  Failed to process move #${move.id}:`, error);
    }
  }

  writeFileSync(resolve(DATA_DIR, 'move-details.json'), JSON.stringify(moveDetails));
  console.log(`\nSaved ${moveDetails.length} move details`);
}

buildMoveDetails().catch(console.error);
