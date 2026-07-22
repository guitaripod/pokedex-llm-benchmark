import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import type { EvolutionChain as EvolutionChainType } from '../../types/pokemon';
import { getPokemonByName, getPokemonImageUrl } from '../../api/pokeapi';
import { formatEvolutionTrigger } from '../../utils/formatters';
import type { Pokemon } from '../../types/pokemon';

interface Props {
  chain: EvolutionChainType;
}

export function EvolutionChain({ chain }: Props) {
  const [pokemonMap, setPokemonMap] = useState<Map<number, Pokemon>>(new Map());

  useEffect(() => {
    async function load() {
      const names = collectNames(chain.chain);
      const map = new Map<number, Pokemon>();
      for (const name of names) {
        try {
          const p = await getPokemonByName(name);
          map.set(p.id, p);
        } catch { /* ignore */ }
      }
      setPokemonMap(map);
    }
    load();
  }, [chain]);

  const nodes = flattenChain(chain.chain);

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-white font-display">Evolution Chain</h3>
      <div className="flex flex-wrap items-center justify-center gap-4 py-4">
        {nodes.map((node, i) => (
          <div key={i} className="flex items-center gap-4">
            {i > 0 && (
              <div className="flex flex-col items-center gap-1">
                <svg className="w-6 h-6 text-gray-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
                {node.detail && (
                  <span className="text-[10px] text-gray-500 text-center max-w-20 leading-tight">
                    {formatEvolutionTrigger(node.detail.trigger?.name || '')}
                    {node.detail.min_level && ` Lv.${node.detail.min_level}`}
                    {node.detail.item && ` ${node.detail.item.name.replace(/-/g, ' ')}`}
                  </span>
                )}
              </div>
            )}
            <Link
              to={`/pokemon/${getPokemonIdFromUrl(node.species.url)}`}
              className="group flex flex-col items-center gap-1 p-3 rounded-xl hover:bg-gray-800/50 transition-colors"
            >
              <div className="w-20 h-20 relative">
                {(() => {
                  const id = getPokemonIdFromUrl(node.species.url);
                  const p = pokemonMap.get(id);
                  return (
                    <img
                      src={p?.sprites.other['official-artwork'].front_default || getPokemonImageUrl(id)}
                      alt={node.species.name}
                      className="w-full h-full object-contain drop-shadow-lg group-hover:scale-110 transition-transform"
                    />
                  );
                })()}
              </div>
              <span className="text-xs font-mono text-gray-500">
                #{String(getPokemonIdFromUrl(node.species.url)).padStart(4, '0')}
              </span>
              <span className="text-sm font-medium capitalize text-gray-200 group-hover:text-white transition-colors">
                {node.species.name.replace(/-/g, ' ')}
              </span>
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}

function collectNames(node: EvolutionChainType['chain']): string[] {
  const names = [node.species.name];
  for (const child of node.evolves_to) {
    names.push(...collectNames(child));
  }
  return names;
}

function flattenChain(node: EvolutionChainType['chain']): {
  species: { name: string; url: string };
  detail: EvolutionChainType['chain']['evolution_details'][0] | null;
}[] {
  const result: {
    species: { name: string; url: string };
    detail: EvolutionChainType['chain']['evolution_details'][0] | null;
  }[] = [];
  result.push({ species: node.species, detail: null });
  function walk(n: EvolutionChainType['chain']) {
    for (const child of n.evolves_to) {
      result.push({ species: child.species, detail: child.evolution_details[0] || null });
      walk(child);
    }
  }
  walk(node);
  return result;
}

function getPokemonIdFromUrl(url: string): number {
  return parseInt(url.split('/').filter(Boolean).pop() || '1');
}
