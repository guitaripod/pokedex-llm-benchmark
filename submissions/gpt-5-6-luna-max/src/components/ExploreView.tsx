import { ArrowUpRight, ChevronDown, Eye, Filter, LoaderCircle, RefreshCw, Search, SlidersHorizontal, Sparkles, X } from "lucide-react";
import type { PokemonDetail, PokemonSummary } from "../types";
import { GENERATIONS, formatName, getGeneration, typeClass, TYPE_NAMES } from "../lib/pokemon";
import { getArtworkUrl } from "../api/pokeapi";
import { EmptyState } from "./EmptyState";
import { PokemonCard } from "./PokemonCard";
import { TypeBadge } from "./TypeBadge";

interface ExploreViewProps {
  index: PokemonSummary[];
  filtered: PokemonSummary[];
  details: Record<number, PokemonDetail>;
  query: string;
  generation: string;
  typeFilter: string;
  sortBy: string;
  visibleCount: number;
  favoriteIds: number[];
  teamIds: number[];
  loading: boolean;
  onQueryChange: (value: string) => void;
  onGenerationChange: (value: string) => void;
  onTypeChange: (value: string) => void;
  onSortChange: (value: string) => void;
  onVisibleCountChange: () => void;
  onSelectPokemon: (id: number) => void;
  onFavorite: (id: number) => void;
  onTeam: (id: number) => void;
  onRandom: () => void;
  onClearFilters: () => void;
}

function LoadingCard() {
  return <div className="pokemon-card loading-card"><div className="loading-card-top" /><div className="loading-card-art" /><div className="loading-card-line wide" /><div className="loading-card-line short" /></div>;
}

export function ExploreView({
  index,
  filtered,
  details,
  query,
  generation,
  typeFilter,
  sortBy,
  visibleCount,
  favoriteIds,
  teamIds,
  loading,
  onQueryChange,
  onGenerationChange,
  onTypeChange,
  onSortChange,
  onVisibleCountChange,
  onSelectPokemon,
  onFavorite,
  onTeam,
  onRandom,
  onClearFilters,
}: ExploreViewProps) {
  const activeFilters = [generation !== "all", Boolean(typeFilter), Boolean(query)].filter(Boolean).length;
  const visible = filtered.slice(0, visibleCount);

  return (
    <div className="explore-view">
      <section className="hero-panel">
        <div className="hero-grid-lines" />
        <div className="hero-copy"><span className="eyebrow"><span className="eyebrow-mark" /> Living field guide <span className="eyebrow-live">Live index</span></span><h1>Catalog the<br /><em>unknown.</em></h1><p>Every species, every region, every story. A beautifully obsessive field guide built for the curious.</p><div className="hero-actions"><button className="button primary" type="button" onClick={onRandom}><Sparkles size={16} /> Surprise me <ArrowUpRight size={15} /></button><span><Eye size={14} /> {index.length.toLocaleString()} species indexed</span></div></div>
        <div className="hero-specimen"><div className="hero-orbit orbit-one" /><div className="hero-orbit orbit-two" /><div className="hero-orbit orbit-three" /><span className="specimen-id">No. 149</span><img src={getArtworkUrl(149)} alt="Dragonite" /><div className="specimen-caption"><span>Featured specimen</span><strong>Dragonite</strong><small>Dragon · Flying</small></div></div>
        <div className="hero-footnote"><span>01</span><span className="hero-rule" /><span>Observe · index · understand</span></div>
      </section>
      <section className="signal-grid"><div className="signal-card signal-primary"><span className="signal-label">Field index</span><strong>{index.length.toLocaleString()}</strong><span className="signal-detail"><span className="pulse-dot" /> Synced from PokéAPI</span><div className="signal-sparkline"><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /></div></div><div className="signal-card"><span className="signal-label">Your archive</span><strong>{favoriteIds.length}<small> saved</small></strong><span className="signal-detail">Personal discoveries</span><span className="signal-icon">✦</span></div><div className="signal-card"><span className="signal-label">Current era</span><strong>Gen IX</strong><span className="signal-detail">Paldea · {index.filter((pokemon) => getGeneration(pokemon.id) === "9").length} entries</span><span className="signal-icon">◌</span></div><div className="signal-card signal-team"><span className="signal-label">Squad capacity</span><strong>{teamIds.length}<small> / 6</small></strong><span className="signal-detail">Ready for fieldwork</span><div className="team-dots">{Array.from({ length: 6 }, (_, slot) => <i key={slot} className={slot < teamIds.length ? "is-filled" : ""} />)}</div></div></section>
      <section className="catalog-header"><div><span className="section-kicker">The catalog</span><h2>Find your next <em>favorite.</em></h2></div><div className="catalog-meta"><span>{filtered.length.toLocaleString()} specimens match</span><button className="button ghost" type="button" onClick={onRandom}><RefreshCw size={14} /> Random encounter</button></div></section>
      <section className="filters-panel"><div className="filter-search"><Search size={17} /><input value={query} onChange={(event) => onQueryChange(event.target.value)} placeholder="Search by name or Pokédex number…" aria-label="Search Pokémon" /><span className="search-shortcut">/</span></div><div className="filter-divider" /><label className="select-filter"><span>Era</span><select value={generation} onChange={(event) => onGenerationChange(event.target.value)}>{GENERATIONS.map((option) => <option value={option.value} key={option.value}>{option.label}</option>)}</select><ChevronDown size={14} /></label><label className="select-filter"><span>Sort</span><select value={sortBy} onChange={(event) => onSortChange(event.target.value)}><option value="number">Dex number</option><option value="number-desc">Reverse dex</option><option value="name">Alphabetical</option></select><ChevronDown size={14} /></label><button className={`filter-toggle ${activeFilters > 0 ? "is-active" : ""}`} type="button" onClick={onClearFilters}><SlidersHorizontal size={15} /> Filters {activeFilters > 0 ? <b>{activeFilters}</b> : null}</button></section>
      <div className="type-filter-strip"><span className="type-strip-label"><Filter size={14} /> Type</span><button className={`type-filter-chip ${typeFilter === "" ? "is-active" : ""}`} type="button" onClick={() => onTypeChange("")}>All</button>{TYPE_NAMES.map((type) => <button className={`type-filter-chip ${typeClass(type)} ${typeFilter === type ? "is-active" : ""}`} type="button" key={type} onClick={() => onTypeChange(type)}><span />{formatName(type)}</button>)}{activeFilters > 0 ? <button className="clear-filters" type="button" onClick={onClearFilters}><X size={13} /> Clear</button> : null}</div>
      <section className="catalog-grid" aria-live="polite">{loading ? Array.from({ length: 12 }, (_, index) => <LoadingCard key={index} />) : visible.map((pokemon) => <PokemonCard key={pokemon.id} pokemon={pokemon} detail={details[pokemon.id]} favorite={favoriteIds.includes(pokemon.id)} inTeam={teamIds.includes(pokemon.id)} onSelect={onSelectPokemon} onFavorite={onFavorite} onTeam={onTeam} />)}</section>
      {!loading && filtered.length === 0 ? <EmptyState title="No specimens found" description="Try a broader search, another era, or clear the active filters." action={{ label: "Reset the lens", onClick: onClearFilters }} /> : null}
      {!loading && visible.length < filtered.length ? <div className="load-more"><button className="button secondary" type="button" onClick={onVisibleCountChange}>Load more specimens <span>{visible.length} / {filtered.length}</span></button></div> : null}
      {!loading && filtered.length > 0 ? <div className="catalog-endnote"><span className="endnote-rule" /><LoaderCircle size={15} /><span>End of current lens</span><span className="endnote-rule" /></div> : null}
    </div>
  );
}
