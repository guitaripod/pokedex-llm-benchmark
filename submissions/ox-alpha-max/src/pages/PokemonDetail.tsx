import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ChevronLeft, ChevronRight, Heart, Gem, Plus, Check,
  Dna, Info, Swords, Shield, GitBranch, Sparkles, Star, Palette,
} from "lucide-react";
import { usePokemon, useSpecies, useEvolutionChain } from "../lib/api";
import { BASE_DEX, DEX_BY_NAME, artworkUrl, spriteUrl, itemSpriteUrl } from "../lib/data";
import type { ApiMove } from "../lib/types";
import {
  STAT_META, decimetresToM, formatId, formatName, genderSplit,
  hatchSteps, hectogramsToKg,
} from "../lib/utils";
import { TypeBadge } from "../components/TypeBadge";
import { StatBars } from "../components/StatBars";
import { Section, Fact } from "../components/Section";
import { CryButton } from "../components/CryButton";
import { DefensesGrid } from "../components/DefensesGrid";
import { AbilityCard } from "../components/AbilityCard";
import { EvolutionView } from "../components/EvolutionView";
import { MoveDetailModal } from "../components/MoveDetailModal";
import { Sprite } from "../components/Sprite";
import { useFavorites, useRecent, useTeam } from "../lib/store";

const METHOD_LABELS: Record<string, string> = {
  "level-up": "Level up",
  machine: "TM / HM",
  egg: "Egg move",
  tutor: "Tutor",
};

export function PokemonDetail() {
  const { idOrName = "" } = useParams();
  const { data: pk, isLoading, isError } = usePokemon(idOrName);
  const speciesId = pk ? (pk.id <= 10000 ? pk.id : Number(pk.species.url.split("/").filter(Boolean).pop())) : null;
  const { data: sp } = useSpecies(speciesId ?? 0);

  const [shiny, setShiny] = useState(false);
  const [favs, toggleFav] = useFavorites();
  const [team, setSlot] = useTeam();
  const [, pushRecent] = useRecent();
  const [flavorIdx, setFlavorIdx] = useState(0);
  const [moveModal, setMoveModal] = useState<string | null>(null);
  const [methodTab, setMethodTab] = useState("level-up");

  useEffect(() => {
    if (pk) pushRecent(pk.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pk?.id]);

  const flavors = useMemo(
    () => (sp?.flavor_text_entries ?? []).filter((f) => f.language.name === "en"),
    [sp]
  );

  useEffect(() => {
    if (flavors.length < 2) return;
    const t = setInterval(() => setFlavorIdx((i) => (i + 1) % flavors.length), 5000);
    return () => clearInterval(t);
  }, [flavors.length]);

  if (isError) {
    return (
      <div className="grid place-items-center py-32 text-center">
        <p className="text-5xl">👻</p>
        <h1 className="mt-4 text-2xl font-black">Pokemon not found</h1>
        <p className="mt-1 text-muted">"{idOrName}" doesn't match any known Pokemon.</p>
        <Link to="/" className="mt-6 rounded-xl bg-dex-red px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-dex-red/25">
          Back to the Dex
        </Link>
      </div>
    );
  }

  if (isLoading || !pk) return <DetailSkeleton />;

  const types = pk.types.sort((a, b) => a.slot - b.slot).map((t) => t.type.name);
  const stats = STAT_META_KEYS.map((k) => pk.stats.find((s) => s.stat.name === k)?.base_stat ?? 0);
  const evs = STAT_META_KEYS.map((k) => pk.stats.find((s) => s.stat.name === k)?.effort ?? 0);
  const genus = sp?.genera.find((g) => g.language.name === "en")?.genus;
  const isFav = favs.includes(pk.id);
  const inTeam = team.includes(pk.id);
  const emptySlot = team.findIndex((s) => s === null);

  const prevEntry = pk.id <= 1025 ? BASE_DEX[(pk.id + 1023) % 1025] : null;
  const nextEntry = pk.id <= 1025 ? BASE_DEX[pk.id % 1025] : null;

  const varieties = (sp?.varieties ?? [])
    .map((v) => ({ name: v.pokemon.name, entry: DEX_BY_NAME.get(v.pokemon.name) }))
    .filter((v) => v.entry);

  const flavor = flavors[flavorIdx % Math.max(1, flavors.length)];

  return (
    <div>
      {/* prev / next */}
      <div className="mb-4 flex items-center justify-between">
        {prevEntry ? (
          <Link to={`/pokemon/${prevEntry.i}`} className="group flex items-center gap-1.5 rounded-xl border border-line bg-panel px-3 py-2 text-sm font-bold text-muted transition-colors hover:text-ink">
            <ChevronLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
            {formatName(prevEntry.n)}
          </Link>
        ) : <span />}
        {nextEntry && (
          <Link to={`/pokemon/${nextEntry.i}`} className="group flex items-center gap-1.5 rounded-xl border border-line bg-panel px-3 py-2 text-sm font-bold text-muted transition-colors hover:text-ink">
            {formatName(nextEntry.n)}
            <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        )}
      </div>

      {/* HERO */}
      <section
        className="relative overflow-hidden rounded-3xl border border-line p-6 sm:p-8"
        style={{
          background: `
            radial-gradient(ellipse 60% 80% at 20% 10%, color-mix(in srgb, var(--color-t-${types[0]}) 28%, transparent), transparent),
            radial-gradient(ellipse 50% 70% at 85% 90%, color-mix(in srgb, var(--color-t-${types[1] ?? types[0]}) 22%, transparent), transparent),
            var(--panel)
          `,
        }}
      >
        <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
          <motion.div
            key={`${pk.id}-${shiny}`}
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", damping: 18, stiffness: 200 }}
            className="relative shrink-0"
          >
            <div
              className="absolute inset-0 rounded-full blur-3xl"
              style={{ background: `color-mix(in srgb, var(--color-t-${types[0]}) 35%, transparent)` }}
            />
            <img
              src={artworkUrl(pk.id, shiny)}
              alt={formatName(pk.name)}
              className="animate-floaty relative h-52 w-52 object-contain drop-shadow-2xl sm:h-64 sm:w-64"
              onError={(e) => {
                const img = e.target as HTMLImageElement;
                if (!img.dataset.fallback) {
                  img.dataset.fallback = "1";
                  img.src = spriteUrl(pk.id, shiny);
                }
              }}
            />
          </motion.div>

          <div className="min-w-0 flex-1 text-center sm:text-left">
            <p className="font-mono text-sm font-bold text-muted">{formatId(pk.id)}</p>
            <h1 className="mt-0.5 text-4xl font-black tracking-tight sm:text-5xl">{formatName(pk.name)}</h1>
            {genus && <p className="mt-1 text-sm font-semibold capitalize text-muted">{genus}</p>}
            <div className="mt-3 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
              {types.map((t) => (
                <TypeBadge key={t} type={t} size="lg" />
              ))}
              {sp?.is_legendary && (
                <span className="inline-flex items-center gap-1 rounded-full bg-dex-gold/15 px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-dex-gold">
                  <Sparkles className="h-3.5 w-3.5" /> Legendary
                </span>
              )}
              {sp?.is_mythical && (
                <span className="inline-flex items-center gap-1 rounded-full bg-fuchsia-500/15 px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-fuchsia-500">
                  <Star className="h-3.5 w-3.5" /> Mythical
                </span>
              )}
            </div>

            {flavor && (
              <div className="mx-auto mt-4 max-w-xl sm:mx-0">
                <p className="min-h-12 text-sm leading-relaxed text-muted">
                  "{flavor.flavor_text.replace(/[\n\f]/g, " ")}"
                </p>
                <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-muted/70">
                  {formatName(flavor.version.name)} · {flavorIdx + 1}/{flavors.length}
                </p>
              </div>
            )}

            <div className="mt-4 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
              <CryButton url={pk.cries?.latest ?? pk.cries?.legacy} />
              <button
                onClick={() => setShiny(!shiny)}
                className={`flex h-10 items-center gap-1.5 rounded-full border px-4 text-xs font-bold transition-colors ${
                  shiny ? "border-dex-gold/50 bg-dex-gold/10 text-dex-gold" : "border-line bg-panel text-muted hover:text-ink"
                }`}
              >
                <Gem className="h-4 w-4" /> Shiny
              </button>
              <button
                onClick={() => toggleFav(pk.id)}
                className={`flex h-10 items-center gap-1.5 rounded-full border px-4 text-xs font-bold transition-colors ${
                  isFav ? "border-dex-red/50 bg-dex-red/10 text-dex-red" : "border-line bg-panel text-muted hover:text-ink"
                }`}
              >
                <Heart className={`h-4 w-4 ${isFav ? "fill-current" : ""}`} /> {isFav ? "Favorited" : "Favorite"}
              </button>
              <button
                onClick={() => emptySlot >= 0 && !inTeam && setSlot(emptySlot, pk.id)}
                disabled={inTeam || emptySlot < 0}
                className={`flex h-10 items-center gap-1.5 rounded-full border px-4 text-xs font-bold transition-colors disabled:opacity-60 ${
                  inTeam ? "border-green-500/50 bg-green-500/10 text-green-500" : "border-line bg-panel text-muted hover:text-ink"
                }`}
              >
                {inTeam ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                {inTeam ? "In team" : "Add to team"}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* FACTS */}
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <Fact label="Height" value={`${decimetresToM(pk.height)} m`} />
        <Fact label="Weight" value={`${hectogramsToKg(pk.weight)} kg`} />
        <Fact label="Base Exp" value={pk.base_experience ?? "—"} />
        <Fact label="Capture Rate" value={sp ? `${sp.capture_rate} (${Math.round((sp.capture_rate / 255) * 100)}%)` : "…"} />
        <Fact label="Growth Rate" value={sp?.growth_rate ? formatName(sp.growth_rate.name) : "—"} />
        <Fact label="Habitat" value={sp?.habitat ? formatName(sp.habitat.name) : "—"} />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        {/* BREEDING */}
        <Section title="Breeding & Training" icon={<Dna className="h-4 w-4" />}>
          <div className="grid grid-cols-2 gap-3">
            <Fact label="Egg Groups" value={sp?.egg_groups.map((e) => formatName(e.name)).join(" · ") || "—"} />
            <Fact label="Egg Cycles" value={hatchSteps(sp?.hatch_counter ?? null)} />
            <Fact label="Base Happiness" value={sp?.base_happiness ?? "—"} />
            <Fact label="EV Yield" value={evs.map((v, i) => v > 0 ? `+${v} ${STAT_META[STAT_META_KEYS[i]].short}` : null).filter(Boolean).join(", ") || "—"} />
          </div>
          <GenderBar rate={sp?.gender_rate ?? -1} />
        </Section>

        {/* ABILITIES */}
        <Section title="Abilities" icon={<Info className="h-4 w-4" />}>
          <div className="space-y-2">
            {pk.abilities.map((a) => (
              <AbilityCard key={a.ability.name} name={a.ability.name} hidden={a.is_hidden} />
            ))}
          </div>
        </Section>

        {/* STATS */}
        <Section title="Base Stats" icon={<Swords className="h-4 w-4" />}>
          <StatBars stats={stats} evs={evs} />
        </Section>

        {/* DEFENSES */}
        <Section title="Type Defenses" icon={<Shield className="h-4 w-4" />}>
          <DefensesGrid types={types} />
          <p className="mt-3 text-[11px] leading-relaxed text-muted">
            Effectiveness of each attacking type against {formatName(pk.name)}.
          </p>
        </Section>

        {/* EVOLUTION */}
        <Section title="Evolution Line" icon={<GitBranch className="h-4 w-4" />} className="lg:col-span-2">
          {sp?.evolution_chain?.url ? (
            <EvolutionContainer url={sp.evolution_chain.url} />
          ) : (
            <p className="text-sm text-muted">This Pokemon does not evolve.</p>
          )}
        </Section>

        {/* MOVES */}
        <MovesPanel moves={pk.moves} tab={methodTab} onTab={setMethodTab} onOpenMove={setMoveModal} className="lg:col-span-2" />

        {/* FORMS */}
        {varieties.length > 1 && (
          <Section title="Other Forms" icon={<Palette className="h-4 w-4" />} className="lg:col-span-2">
            <div className="no-scrollbar flex gap-3 overflow-x-auto pb-1">
              {varieties.map((v) => (
                <Link
                  key={v.name}
                  to={`/pokemon/${v.entry!.i}`}
                  className={`group flex w-24 shrink-0 flex-col items-center gap-1 rounded-xl border p-2 transition-all hover:-translate-y-0.5 ${
                    v.name === pk.name ? "border-dex-red/50 bg-dex-red/5" : "border-line bg-panel-2 hover:border-dex-red/30"
                  }`}
                >
                  <Sprite src={artworkUrl(v.entry!.i)} alt={v.name} className="h-16 w-16" />
                  <span className="w-full truncate text-center text-[11px] font-bold">
                    {formatName(v.name.replace(`${sp?.name}-`, ""))}
                  </span>
                </Link>
              ))}
            </div>
          </Section>
        )}

        {/* SPRITES */}
        <Section title="Sprite Gallery" icon={<Palette className="h-4 w-4" />} className="lg:col-span-2">
          <SpritesGallery sprites={pk.sprites} />
        </Section>

        {/* HELD ITEMS */}
        {!!pk.held_items?.length && (
          <Section title="Held Items (wild)" icon={<Info className="h-4 w-4" />} className="lg:col-span-2">
            <div className="flex flex-wrap gap-2">
              {pk.held_items.map((hi) => (
                <Link
                  key={hi.item.name}
                  to="/items"
                  className="flex items-center gap-2 rounded-xl border border-line bg-panel-2 px-3 py-2 text-xs font-semibold capitalize transition-colors hover:border-dex-red/40"
                  title={`Rarity ${Math.round((hi.version_details[0]?.rarity ?? 0))}%`}
                >
                  <img src={itemSpriteUrl(hi.item.name)} alt="" className="h-7 w-7 object-contain" loading="lazy" onError={(e) => ((e.target as HTMLImageElement).style.display = "none")} />
                  {formatName(hi.item.name)}
                </Link>
              ))}
            </div>
          </Section>
        )}
      </div>

      <MoveDetailModal moveName={moveModal} onClose={() => setMoveModal(null)} />
    </div>
  );
}

const STAT_META_KEYS = ["hp", "attack", "defense", "special-attack", "special-defense", "speed"];

function GenderBar({ rate }: { rate: number }) {
  const g = genderSplit(rate);
  if (g.genderless) {
    return (
      <div className="mt-3">
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted">Gender Ratio</p>
        <p className="mt-1 text-sm font-bold text-muted">Genderless</p>
      </div>
    );
  }
  return (
    <div className="mt-3">
      <p className="text-[10px] font-bold uppercase tracking-widest text-muted">Gender Ratio</p>
      <div className="mt-1.5 flex h-3 overflow-hidden rounded-full">
        <div className="bg-sky-500" style={{ width: `${g.male}%` }} title={`♂ ${g.male}%`} />
        <div className="bg-pink-500" style={{ width: `${g.female}%` }} title={`♀ ${g.female}%`} />
      </div>
      <div className="mt-1 flex justify-between text-[11px] font-bold">
        <span className="text-sky-500">♂ {g.male}%</span>
        <span className="text-pink-500">♀ {g.female}%</span>
      </div>
    </div>
  );
}

function EvolutionContainer({ url }: { url: string }) {
  const { data } = useEvolutionChain(url);
  if (!data) return <div className="skeleton h-28 w-full rounded-xl" />;
  return <EvolutionView chain={data.chain} />;
}

function MovesPanel({
  moves,
  tab,
  onTab,
  onOpenMove,
  className,
}: {
  moves: ApiMove[];
  tab: string;
  onTab: (t: string) => void;
  onOpenMove: (name: string) => void;
  className?: string;
}) {
  const enriched = useMemo(
    () =>
      moves.map((m) => {
        const methods = new Set(m.version_group_details.map((d) => d.move_learn_method.name));
        const levels = m.version_group_details
          .filter((d) => d.move_learn_method.name === "level-up")
          .map((d) => d.level_learned_at);
        return { ...m, methods, minLevel: levels.length ? Math.min(...levels.filter((l) => l > 0).length ? levels.filter((l) => l > 0) : levels) : null };
      }),
    [moves]
  );

  const tabs = Object.keys(METHOD_LABELS).filter((t) => enriched.some((m) => m.methods.has(t)));
  const visible = enriched
    .filter((m) => m.methods.has(tab))
    .sort((a, b) =>
      tab === "level-up" ? (a.minLevel ?? 999) - (b.minLevel ?? 999) || a.move.name.localeCompare(b.move.name) : a.move.name.localeCompare(b.move.name)
    );

  return (
    <Section title={`Moves (${moves.length})`} icon={<Swords className="h-4 w-4" />} className={className}>
      <div className="no-scrollbar mb-3 flex gap-1 overflow-x-auto">
        {tabs.map((t) => (
          <button
            key={t}
            onClick={() => onTab(t)}
            className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-bold transition-colors ${
              tab === t ? "bg-dex-red text-white shadow" : "bg-panel-2 text-muted hover:text-ink"
            }`}
          >
            {METHOD_LABELS[t]}
          </button>
        ))}
      </div>
      <div className="max-h-96 overflow-y-auto rounded-xl border border-line">
        <table className="w-full text-left text-sm">
          <tbody>
            {visible.map((m, i) => (
              <tr
                key={m.move.name}
                onClick={() => onOpenMove(m.move.name)}
                className={`cursor-pointer transition-colors hover:bg-panel-2 ${i % 2 ? "bg-panel-2/40" : ""}`}
              >
                <td className="px-3 py-2 font-semibold capitalize">
                  {formatName(m.move.name)}
                </td>
                <td className="px-3 py-2 text-right font-mono text-xs text-muted">
                  {tab === "level-up" && m.minLevel != null ? `Lv. ${m.minLevel}` : ""}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-2 text-[11px] text-muted">Click a move for full details.</p>
    </Section>
  );
}

function SpritesGallery({ sprites }: { sprites: any }) {
  const entries: { label: string; src?: string | null }[] = [
    { label: "Front", src: sprites.front_default },
    { label: "Back", src: sprites.back_default },
    { label: "Shiny", src: sprites.front_shiny },
    { label: "Shiny Back", src: sprites.back_shiny },
    { label: "Home", src: sprites.other?.home?.front_default },
    { label: "Home Shiny", src: sprites.other?.home?.front_shiny },
    { label: "Dream World", src: sprites.other?.dream_world?.front_default },
    { label: "Animated", src: sprites.other?.showdown?.front_default },
    { label: "Animated Shiny", src: sprites.other?.showdown?.front_shiny },
  ].filter((e) => e.src);

  return (
    <div className="grid grid-cols-3 gap-3 sm:grid-cols-5">
      {entries.map((e) => (
        <div key={e.label} className="flex flex-col items-center gap-1 rounded-xl border border-line bg-panel-2 p-2">
          <Sprite src={e.src!} alt={e.label} className="h-20 w-20" />
          <span className="text-[10px] font-bold uppercase tracking-wide text-muted">{e.label}</span>
        </div>
      ))}
    </div>
  );
}

function DetailSkeleton() {
  return (
    <div className="space-y-4">
      <div className="skeleton h-72 rounded-3xl" />
      <div className="grid grid-cols-3 gap-3 lg:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="skeleton h-16 rounded-xl" />
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="skeleton h-48 rounded-2xl" />
        ))}
      </div>
    </div>
  );
}
