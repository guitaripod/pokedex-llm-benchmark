import { Check, Heart, Plus, Star } from "lucide-react";
import { getArtworkUrl } from "../api/pokeapi";
import { formatDexNumber, formatName, typeClass } from "../lib/pokemon";
import type { PokemonDetail, PokemonSummary } from "../types";
import { TypeBadge } from "./TypeBadge";

interface PokemonCardProps {
  pokemon: PokemonSummary;
  detail?: PokemonDetail;
  favorite: boolean;
  inTeam: boolean;
  onSelect: (id: number) => void;
  onFavorite: (id: number) => void;
  onTeam: (id: number) => void;
}

export function PokemonCard({
  pokemon,
  detail,
  favorite,
  inTeam,
  onSelect,
  onFavorite,
  onTeam,
}: PokemonCardProps) {
  const artwork = detail?.sprites.other?.["official-artwork"]?.front_default ?? getArtworkUrl(pokemon.id);
  const types = detail?.types.map((entry) => entry.type.name) ?? [];

  return (
    <article className={`pokemon-card ${types[0] ? typeClass(types[0]) : "type-unknown"}`}>
      <div className="card-wash" />
      <div className="card-topline">
        <span className="dex-number">{formatDexNumber(pokemon.id)}</span>
        <div className="card-actions">
          <button
            className={`icon-button subtle ${favorite ? "is-active" : ""}`}
            type="button"
            aria-label={favorite ? `Remove ${formatName(pokemon.name)} from favorites` : `Favorite ${formatName(pokemon.name)}`}
            onClick={() => onFavorite(pokemon.id)}
          >
            <Heart size={15} fill={favorite ? "currentColor" : "none"} />
          </button>
          <button
            className={`icon-button subtle team-action ${inTeam ? "is-active" : ""}`}
            type="button"
            aria-label={inTeam ? `Remove ${formatName(pokemon.name)} from team` : `Add ${formatName(pokemon.name)} to team`}
            onClick={() => onTeam(pokemon.id)}
          >
            {inTeam ? <Check size={15} /> : <Plus size={15} />}
          </button>
        </div>
      </div>
      <button className="card-main" type="button" onClick={() => onSelect(pokemon.id)}>
        <div className="card-copy">
          <h3>{formatName(pokemon.name)}</h3>
          <div className="card-types">
            {types.length > 0 ? types.map((type) => <TypeBadge key={type} name={type} compact />) : <span className="type-placeholder">Syncing profile</span>}
          </div>
        </div>
        <div className="card-art-wrap">
          <span className="card-glow" />
          <img className="card-art" src={artwork} alt="" loading="lazy" />
        </div>
        <span className="card-cta"><Star size={12} /> Open field notes</span>
      </button>
    </article>
  );
}
