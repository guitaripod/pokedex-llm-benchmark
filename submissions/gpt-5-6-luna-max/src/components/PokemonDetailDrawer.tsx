import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowRight,
  AudioLines,
  Check,
  ChevronRight,
  CircleDot,
  Heart,
  Layers3,
  MoveRight,
  Plus,
  Sparkles,
  Swords,
  X,
} from "lucide-react";
import type { EvolutionNode, PokemonProfile } from "../types";
import {
  cleanFlavorText,
  findEnglish,
  formatDexNumber,
  formatHeight,
  formatName,
  formatStatName,
  formatWeight,
  getIdFromUrl,
  getEvolutionTriggerLabel,
  pokemonArtwork,
  totalStats,
  typeClass,
} from "../lib/pokemon";
import { StatBar } from "./StatBar";
import { TypeBadge } from "./TypeBadge";

type DetailTab = "overview" | "stats" | "moves" | "evolution" | "forms";

interface PokemonDetailDrawerProps {
  profile: PokemonProfile | null;
  loading: boolean;
  error: string | null;
  favorite: boolean;
  inTeam: boolean;
  onClose: () => void;
  onSelectPokemon: (id: number) => void;
  onFavorite: (id: number) => void;
  onTeam: (id: number) => void;
}

function EvolutionBranch({ node, onSelect }: { node: EvolutionNode; onSelect: (id: number) => void }) {
  const id = getIdFromUrl(node.species.url);
  const detail = node.evolution_details[0];
  const condition = detail
    ? detail.min_level
      ? `Lv. ${detail.min_level}`
      : detail.item?.name
        ? formatName(detail.item.name)
        : getEvolutionTriggerLabel(detail.trigger.name)
    : "Base form";

  return (
    <div className="evolution-branch">
      <button className="evolution-node" type="button" onClick={() => id && onSelect(id)}>
        <img src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`} alt="" loading="lazy" />
        <span className="evolution-node-number">{formatDexNumber(id)}</span>
        <strong>{formatName(node.species.name)}</strong>
        <span>{condition}</span>
      </button>
      {node.evolves_to.length > 0 ? (
        <div className="evolution-next">
          <MoveRight size={20} />
          <div className="evolution-children">
            {node.evolves_to.map((child) => <EvolutionBranch key={child.species.name} node={child} onSelect={onSelect} />)}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function DetailSkeleton() {
  return (
    <div className="detail-loading">
      <div className="loading-orb" />
      <div className="skeleton-line wide" />
      <div className="skeleton-line medium" />
      <div className="skeleton-panel" />
    </div>
  );
}

export function PokemonDetailDrawer({
  profile,
  loading,
  error,
  favorite,
  inTeam,
  onClose,
  onSelectPokemon,
  onFavorite,
  onTeam,
}: PokemonDetailDrawerProps) {
  const [tab, setTab] = useState<DetailTab>("overview");
  const [moveFilter, setMoveFilter] = useState("all");
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    setTab("overview");
    setMoveFilter("all");
    setIsPlaying(false);
  }, [profile?.pokemon.id]);

  const englishFlavor = profile ? findEnglish(profile.species.flavor_text_entries) : undefined;
  const englishGenus = profile ? findEnglish(profile.species.genera) : undefined;
  const moves = useMemo(() => {
    if (!profile) return [];
    return profile.pokemon.moves
      .filter((entry) => moveFilter === "all" || entry.version_group_details.some((detail) => detail.move_learn_method.name === moveFilter))
      .slice(0, 48);
  }, [moveFilter, profile]);

  const handlePlayCry = async () => {
    if (!audioRef.current) return;
    try {
      await audioRef.current.play();
      setIsPlaying(true);
    } catch {
      setIsPlaying(false);
    }
  };

  const tabItems: Array<{ id: DetailTab; label: string }> = [
    { id: "overview", label: "Overview" },
    { id: "stats", label: "Stats" },
    { id: "moves", label: "Moves" },
    { id: "evolution", label: "Evolution" },
    { id: "forms", label: "Forms & data" },
  ];

  return (
    <div className="drawer-layer" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <aside className="detail-drawer" role="dialog" aria-modal="true" aria-label="Pokémon details">
        <button className="drawer-close icon-button" type="button" onClick={onClose} aria-label="Close details"><X size={20} /></button>
        {loading ? <DetailSkeleton /> : null}
        {!loading && error ? (
          <div className="detail-error"><CircleDot size={22} /><h3>Field notes unavailable</h3><p>{error}</p><button className="button secondary" type="button" onClick={onClose}>Back to catalog</button></div>
        ) : null}
        {!loading && !error && profile ? (
          <>
            <header className={`detail-hero ${typeClass(profile.pokemon.types[0]?.type.name ?? "unknown")}`}>
              <div className="detail-hero-noise" />
              <div className="detail-hero-copy">
                <div className="detail-eyebrow"><span>{formatDexNumber(profile.pokemon.id)}</span><span className="eyebrow-divider" />{englishGenus?.genus ?? "Pokémon"}</div>
                <h2>{formatName(profile.pokemon.name)}</h2>
                <div className="detail-type-row">{profile.pokemon.types.map((entry) => <TypeBadge key={entry.type.name} name={entry.type.name} />)}</div>
              </div>
              <div className="detail-art-stage"><span className="detail-art-ring" /><img src={pokemonArtwork(profile.pokemon)} alt={formatName(profile.pokemon.name)} /></div>
              <div className="detail-actions">
                {profile.pokemon.cries?.latest ? (
                  <>
                    <audio ref={audioRef} src={profile.pokemon.cries.latest} onEnded={() => setIsPlaying(false)} />
                    <button className={`detail-round-action ${isPlaying ? "is-playing" : ""}`} type="button" onClick={handlePlayCry} aria-label={`Play ${formatName(profile.pokemon.name)} cry`}><AudioLines size={18} /></button>
                  </>
                ) : null}
                <button className={`detail-round-action ${favorite ? "is-active" : ""}`} type="button" onClick={() => onFavorite(profile.pokemon.id)} aria-label={favorite ? "Remove favorite" : "Add favorite"}><Heart size={18} fill={favorite ? "currentColor" : "none"} /></button>
                <button className={`detail-round-action ${inTeam ? "is-active" : ""}`} type="button" onClick={() => onTeam(profile.pokemon.id)} aria-label={inTeam ? "Remove from team" : "Add to team"}>{inTeam ? <Check size={18} /> : <Plus size={18} />}</button>
              </div>
            </header>
            <nav className="detail-tabs" aria-label="Pokémon sections">
              {tabItems.map((item) => <button key={item.id} className={tab === item.id ? "is-active" : ""} type="button" onClick={() => setTab(item.id)}>{item.label}</button>)}
            </nav>
            <div className="detail-scroll">
              {tab === "overview" ? (
                <div className="detail-section-stack">
                  <section className="quote-card"><Sparkles size={17} /><p>{cleanFlavorText(englishFlavor?.flavor_text ?? "A mysterious lifeform recorded in the living Pokédex.")}</p><span>{englishFlavor?.version.name ? `Pokédex · ${formatName(englishFlavor.version.name)}` : "Pokédex field note"}</span></section>
                  <section className="detail-card">
                    <div className="section-heading"><div><span className="section-kicker">Identity scan</span><h3>At a glance</h3></div><CircleDot size={18} /></div>
                    <div className="metric-grid">
                      <div><span>Height</span><strong>{formatHeight(profile.pokemon.height)}</strong></div>
                      <div><span>Weight</span><strong>{formatWeight(profile.pokemon.weight)}</strong></div>
                      <div><span>Capture rate</span><strong>{profile.species.capture_rate}<small>%</small></strong></div>
                      <div><span>Base XP</span><strong>{profile.pokemon.base_experience ?? "—"}</strong></div>
                    </div>
                    <div className="taxonomy-grid">
                      <div><span>Habitat</span><strong>{profile.species.habitat ? formatName(profile.species.habitat.name) : "Unknown"}</strong></div>
                      <div><span>Growth</span><strong>{profile.species.growth_rate ? formatName(profile.species.growth_rate.name) : "Unknown"}</strong></div>
                      <div><span>Color</span><strong>{profile.species.color ? formatName(profile.species.color.name) : "Unknown"}</strong></div>
                      <div><span>Shape</span><strong>{profile.species.shape ? formatName(profile.species.shape.name) : "Unknown"}</strong></div>
                    </div>
                  </section>
                  <section className="detail-card">
                    <div className="section-heading"><div><span className="section-kicker">Battle profile</span><h3>Abilities</h3></div><Swords size={18} /></div>
                    <div className="ability-list">{profile.pokemon.abilities.map((ability) => <div className="ability-pill" key={ability.ability.name}><span>{formatName(ability.ability.name)}</span>{ability.is_hidden ? <em>Hidden</em> : <small>Slot {ability.slot}</small>}</div>)}</div>
                  </section>
                  <section className="detail-card compact-card">
                    <div className="section-heading"><div><span className="section-kicker">Breeding data</span><h3>Lineage markers</h3></div><Layers3 size={18} /></div>
                    <div className="tag-list">{profile.species.egg_groups.map((group) => <span key={group.name}>{formatName(group.name)}</span>)}</div>
                    <div className="detail-note">{profile.species.gender_rate < 0 ? "Genderless species" : `${profile.species.gender_rate * 12.5}% female ratio`} · {profile.species.hatch_counter ? `${profile.species.hatch_counter} hatch cycles` : "No hatch data"}</div>
                  </section>
                </div>
              ) : null}
              {tab === "stats" ? (
                <div className="detail-section-stack">
                  <section className="stat-total-card"><div><span className="section-kicker">Combat readout</span><h3>Base stat total</h3><strong>{totalStats(profile.pokemon.stats)}</strong></div><div className="stat-total-orbit"><span /><span /><span /></div></section>
                  <section className="detail-card"><div className="section-heading"><div><span className="section-kicker">Six-axis profile</span><h3>Stat spread</h3></div><Swords size={18} /></div><div className="stats-list">{profile.pokemon.stats.map((stat) => <StatBar key={stat.stat.name} name={stat.stat.name} value={stat.base_stat} />)}</div></section>
                  <section className="detail-card"><div className="section-heading"><div><span className="section-kicker">Training yield</span><h3>Effort values</h3></div><Sparkles size={18} /></div><div className="effort-list">{profile.pokemon.stats.filter((stat) => stat.effort > 0).length > 0 ? profile.pokemon.stats.filter((stat) => stat.effort > 0).map((stat) => <div key={stat.stat.name}><span>{formatStatName(stat.stat.name)}</span><strong>+{stat.effort}</strong></div>) : <p className="detail-note">No effort values recorded for this species.</p>}</div></section>
                </div>
              ) : null}
              {tab === "moves" ? (
                <div className="detail-section-stack">
                  <section className="detail-card"><div className="section-heading"><div><span className="section-kicker">Move library</span><h3>{profile.pokemon.moves.length} learnable moves</h3></div><AudioLines size={18} /></div><div className="move-filters">{["all", "level-up", "machine", "egg", "tutor"].map((filter) => <button className={moveFilter === filter ? "is-active" : ""} key={filter} type="button" onClick={() => setMoveFilter(filter)}>{filter === "all" ? "All" : formatName(filter)}</button>)}</div><div className="move-list">{moves.map((move) => { const version = move.version_group_details.find((detail) => moveFilter === "all" || detail.move_learn_method.name === moveFilter) ?? move.version_group_details[0]; return <div className="move-row" key={move.move.name}><div className="move-icon"><Swords size={14} /></div><strong>{formatName(move.move.name)}</strong><span>{version?.move_learn_method.name ? formatName(version.move_learn_method.name) : "Recorded"}</span>{version?.level_learned_at ? <em>Lv. {version.level_learned_at}</em> : null}</div>; })}</div>{moves.length === 0 ? <p className="detail-note">No moves match this lens.</p> : null}</section>
                </div>
              ) : null}
              {tab === "evolution" ? (
                <div className="detail-section-stack"><section className="detail-card evolution-card"><div className="section-heading"><div><span className="section-kicker">Species family</span><h3>Evolution chain</h3></div><ChevronRight size={18} /></div>{profile.evolution ? <div className="evolution-chain"><EvolutionBranch node={profile.evolution.chain} onSelect={onSelectPokemon} /></div> : <p className="detail-note">No evolution chain recorded for this species.</p>}</section></div>
              ) : null}
              {tab === "forms" ? (
                <div className="detail-section-stack"><section className="detail-card"><div className="section-heading"><div><span className="section-kicker">Variant index</span><h3>{profile.species.varieties.length} known forms</h3></div><Layers3 size={18} /></div><div className="form-list">{profile.species.varieties.map((variant) => { const id = getIdFromUrl(variant.pokemon.url); return <button key={variant.pokemon.name} type="button" className={variant.is_default ? "is-default" : ""} onClick={() => id && onSelectPokemon(id)}><img src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`} alt="" /><span>{formatName(variant.pokemon.name)}</span>{variant.is_default ? <em>Default</em> : <ChevronRight size={15} />}</button>; })}</div></section><section className="detail-card"><div className="section-heading"><div><span className="section-kicker">Species flags</span><h3>Behavioral notes</h3></div><CircleDot size={18} /></div><div className="flag-list"><div><span>Gender differences</span><strong>{profile.species.has_gender_differences ? "Observed" : "None recorded"}</strong></div><div><span>Form switching</span><strong>{profile.species.forms_switchable ? "Switchable" : "Stable"}</strong></div><div><span>Baby Pokémon</span><strong>{profile.species.is_baby ? "Yes" : "No"}</strong></div><div><span>Species order</span><strong>{profile.species.order}</strong></div></div></section></div>
              ) : null}
            </div>
            <footer className="detail-footer"><span><Sparkles size={13} /> Powered by PokéAPI</span><a href={`https://pokeapi.co/docs/v2`} target="_blank" rel="noreferrer">Source data <ArrowRight size={13} /></a></footer>
          </>
        ) : null}
      </aside>
    </div>
  );
}
