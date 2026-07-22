import { useState, useEffect } from 'react';

interface Props {
  pokemonId: number;
}

export function LocationsSection({ pokemonId }: Props) {
  const [locations, setLocations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${pokemonId}/encounters`);
        const data = await res.json();
        setLocations(data || []);
      } catch { setLocations([]); }
      setLoading(false);
    }
    load();
  }, [pokemonId]);

  if (loading) return null;
  if (locations.length === 0) return null;

  const grouped = new Map<string, { area: string; method: string; chance: number }[]>();
  for (const loc of locations) {
    const area = loc.location_area?.name?.replace(/-/g, ' ') || 'Unknown';
    for (const detail of loc.version_details || []) {
      for (const encounter of detail.encounter_details || []) {
        const method = encounter.method?.name?.replace(/-/g, ' ') || 'Unknown';
        if (!grouped.has(area)) grouped.set(area, []);
        grouped.get(area)!.push({ area, method, chance: encounter.chance || 0 });
      }
    }
  }

  return (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold text-white font-display">Wild Locations</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {Array.from(grouped.entries()).slice(0, 10).map(([area, encounters]) => (
          <div key={area} className="bg-gray-900/50 border border-gray-800 rounded-lg p-3">
            <p className="text-sm font-medium text-white capitalize">{area}</p>
            <div className="mt-1 flex flex-wrap gap-1.5">
              {encounters.slice(0, 3).map((enc, i) => (
                <span key={i} className="text-[10px] text-gray-400 bg-gray-800 px-2 py-0.5 rounded">
                  {enc.method} ({enc.chance}%)
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
