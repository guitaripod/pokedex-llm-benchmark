import { ArrowUpRight, BarChart3, Check, CirclePlus, RotateCcw, Shield, Sparkles, Trash2 } from "lucide-react";
import type { PokemonDetail } from "../types";
import { formatDexNumber, formatName, totalStats, TYPE_NAMES, typeClass } from "../lib/pokemon";
import { EmptyState } from "./EmptyState";
import { TypeBadge } from "./TypeBadge";

interface TeamViewProps {
  teamIds: number[];
  details: Record<number, PokemonDetail>;
  onSelectPokemon: (id: number) => void;
  onRemove: (id: number) => void;
  onClear: () => void;
  onBrowse: () => void;
}

export function TeamView({ teamIds, details, onSelectPokemon, onRemove, onClear, onBrowse }: TeamViewProps) {
  const team = teamIds.map((id) => details[id]).filter((pokemon): pokemon is PokemonDetail => Boolean(pokemon));
  const typeCount = TYPE_NAMES.reduce<Record<string, number>>((result, type) => {
    result[type] = team.filter((pokemon) => pokemon.types.some((entry) => entry.type.name === type)).length;
    return result;
  }, {});
  const total = team.reduce((sum, pokemon) => sum + totalStats(pokemon.stats), 0);
  const average = team.length > 0 ? Math.round(total / team.length) : 0;
  const coveredTypes = Object.values(typeCount).filter((count) => count > 0).length;

  return (
    <div className="team-view">
      <section className="page-intro team-intro"><div><span className="eyebrow"><span className="eyebrow-mark" /> Squad room</span><h1>Build your <em>six.</em></h1><p>Keep a living roster of your favorite discoveries. Your team is saved locally, ready whenever the next encounter starts.</p></div><div className="team-score"><span>Squad signal</span><strong>{team.length}<small>/ 6</small></strong><div className="team-score-track">{Array.from({ length: 6 }, (_, index) => <span className={index < team.length ? "is-filled" : ""} key={index} />)}</div></div></section>
      {teamIds.length === 0 ? <EmptyState title="Your squad is still a sketch" description="Add Pokémon from the catalog to start building a team with balance, personality, and a little chaos." action={{ label: "Browse the Pokédex", onClick: onBrowse }} /> : <>
        <section className="team-slots">{Array.from({ length: 6 }, (_, index) => { const id = teamIds[index]; const pokemon = id ? details[id] : undefined; return pokemon ? <article className={`team-member ${typeClass(pokemon.types[0]?.type.name ?? "unknown")}`} key={pokemon.id}><div className="team-member-number">0{index + 1}</div><button className="team-member-main" type="button" onClick={() => onSelectPokemon(pokemon.id)}><img src={pokemon.sprites.other?.["official-artwork"]?.front_default ?? ""} alt="" /><div><span>{formatDexNumber(pokemon.id)}</span><h3>{formatName(pokemon.name)}</h3><div>{pokemon.types.map((entry) => <TypeBadge key={entry.type.name} name={entry.type.name} compact />)}</div></div><ArrowUpRight size={15} /></button><button className="team-remove" type="button" onClick={() => onRemove(pokemon.id)} aria-label={`Remove ${formatName(pokemon.name)} from team`}><Trash2 size={15} /></button></article> : <button className="team-slot-empty" key={`empty-${index}`} type="button" onClick={onBrowse}><span>0{index + 1}</span><CirclePlus size={22} /><strong>Open slot</strong><small>Find a partner</small></button>; })}</section>
        <section className="team-dashboard"><div className="team-stat-card"><div className="section-heading"><div><span className="section-kicker">Squad readout</span><h3>Team pulse</h3></div><BarChart3 size={18} /></div><div className="team-big-stat"><strong>{average || "—"}</strong><span>average base stat total</span></div><div className="team-stat-line"><span>Recorded total</span><strong>{total || "—"}</strong></div><div className="team-stat-line"><span>Type coverage</span><strong>{coveredTypes}<small>/ 18 types</small></strong></div></div><div className="coverage-card"><div className="section-heading"><div><span className="section-kicker">Identity spread</span><h3>Type footprint</h3></div><Shield size={18} /></div><div className="coverage-list">{TYPE_NAMES.map((type) => <div className="coverage-row" key={type}><span className={`coverage-name ${typeClass(type)}`}><i />{formatName(type)}</span><div className="coverage-track"><span style={{ width: `${Math.min(100, (typeCount[type] / Math.max(1, team.length)) * 100)}%` }} /></div><strong>{typeCount[type]}</strong></div>)}</div></div></section>
        <div className="team-actions"><span><Check size={14} /> Changes save automatically on this device</span><button className="button ghost-danger" type="button" onClick={onClear}><RotateCcw size={15} /> Clear squad</button></div>
      </>}
      <div className="team-footer"><Sparkles size={14} /> A good team has a point of view. Not just a type chart.</div>
    </div>
  );
}
