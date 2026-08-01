import { useMemo, useState } from "react";
import { ArrowUpRight, Layers3, Shield, Sparkles, Swords, Target, Zap } from "lucide-react";
import type { CSSProperties } from "react";
import type { PokemonSummary, TypeDetail } from "../types";
import { formatName, getIdFromUrl, typeColor, typeClass, TYPE_NAMES } from "../lib/pokemon";
import { TypeBadge } from "./TypeBadge";

interface TypeExplorerProps {
  typeDetails: Record<string, TypeDetail>;
  loading: boolean;
  index: PokemonSummary[];
  onSelectPokemon: (id: number) => void;
}

function RelationList({ label, names, tone }: { label: string; names: string[]; tone: "good" | "bad" | "neutral" }) {
  return (
    <div className="relation-block">
      <div className="relation-label"><span className={`relation-dot ${tone}`} />{label}</div>
      <div className="relation-list">{names.length > 0 ? names.map((name) => <TypeBadge key={name} name={name} compact />) : <span className="relation-empty">None recorded</span>}</div>
    </div>
  );
}

export function TypeExplorer({ typeDetails, loading, index, onSelectPokemon }: TypeExplorerProps) {
  const [selected, setSelected] = useState("fire");
  const active = typeDetails[selected];
  const samplePokemon = useMemo(() => {
    if (!active) return [];
    return active.pokemon
      .slice(0, 8)
      .map((entry) => ({ id: getIdFromUrl(entry.pokemon.url), name: entry.pokemon.name }))
      .filter((entry) => entry.id > 0);
  }, [active]);

  return (
    <div className="types-view">
      <section className="types-intro">
        <div>
          <span className="eyebrow"><span className="eyebrow-mark" /> System atlas</span>
          <h1>Read the type <em>language.</em></h1>
          <p>Every matchup, move pool, and field population in one place. Select a type to map its strengths across the whole Pokédex.</p>
        </div>
        <div className="type-atlas-mark"><span /><span /><span /><span /><span /></div>
      </section>
      <section className="type-grid" aria-label="Pokémon types">
        {TYPE_NAMES.map((name, indexPosition) => {
          const detail = typeDetails[name];
          return <button key={name} type="button" className={`type-card ${typeClass(name)} ${selected === name ? "is-selected" : ""}`} style={{ "--type-color": typeColor(name) } as CSSProperties} onClick={() => setSelected(name)}><span className="type-card-index">{String(indexPosition + 1).padStart(2, "0")}</span><span className="type-card-icon"><span /></span><strong>{formatName(name)}</strong><span className="type-card-count">{loading && !detail ? "Syncing" : `${detail?.pokemon.length ?? "—"} species`}</span><ArrowUpRight size={16} /></button>;
        })}
      </section>
      {active ? (
        <section className={`type-detail-panel ${typeClass(active.name)}`}>
          <div className="type-detail-heading"><div><span className="section-kicker">Type dossier</span><h2>{formatName(active.name)} <span>system</span></h2><p>Generation anchor · {formatName(active.generation.name)}</p></div><TypeBadge name={active.name} /></div>
          <div className="type-detail-metrics"><div><Swords size={17} /><span>Move pool</span><strong>{active.moves.length}</strong></div><div><Target size={17} /><span>Species</span><strong>{active.pokemon.length}</strong></div><div><Zap size={17} /><span>Super effective</span><strong>{active.damage_relations.double_damage_to.length}</strong></div><div><Shield size={17} /><span>Weak to</span><strong>{active.damage_relations.double_damage_from.length}</strong></div></div>
          <div className="type-detail-grid"><div className="type-relations"><RelationList label="Attacks hard into" names={active.damage_relations.double_damage_to.map((entry) => entry.name)} tone="good" /><RelationList label="Takes extra from" names={active.damage_relations.double_damage_from.map((entry) => entry.name)} tone="bad" /><RelationList label="Shrugs off" names={active.damage_relations.half_damage_from.map((entry) => entry.name)} tone="neutral" /><RelationList label="Cannot touch" names={active.damage_relations.no_damage_to.map((entry) => entry.name)} tone="neutral" /></div><div className="type-population"><div className="section-heading"><div><span className="section-kicker">Field population</span><h3>Known specimens</h3></div><Layers3 size={18} /></div><div className="population-list">{samplePokemon.map((entry) => <button key={entry.name} type="button" onClick={() => onSelectPokemon(entry.id)}><img src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${entry.id}.png`} alt="" loading="lazy" /><span><small>{String(entry.id).padStart(4, "0")}</small><strong>{formatName(entry.name)}</strong></span><ArrowUpRight size={15} /></button>)}</div><span className="population-footnote">Showing {samplePokemon.length} of {active.pokemon.length} recorded species</span></div></div>
        </section>
      ) : (
        <div className="type-loading"><Sparkles size={18} /> {loading ? "Building type atlas…" : "Select a type to open its dossier."}</div>
      )}
      <div className="types-source"><Sparkles size={14} /> Matchups and populations are live from PokéAPI <span /> {index.length.toLocaleString()} indexed species</div>
    </div>
  );
}
