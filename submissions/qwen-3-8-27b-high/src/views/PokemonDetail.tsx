import { useEffect, useMemo, useRef, useState } from "react";
import type { Route } from "../useRoute";
import type { TypeName, EvolutionNode } from "../types";
import { usePokemon, multiplier, relation } from "../useData";
import { useFavorites } from "../useFavorites";
import { TYPE_COLORS, TYPE_GLYPH, officialArt, gen1Sprite, homeSprite } from "../poke";
import { TypeBadge } from "../ui/TypeBadge";
import { RadarChart } from "../ui/RadarChart";
import { StatBars } from "../ui/StatBars";
import { Spinner, Empty } from "../ui/Spinner";

const ALL_TYPES: TypeName[] = [
    "normal", "fire", "water", "electric", "grass", "ice", "fighting", "poison",
    "ground", "flying", "psychic", "bug", "rock", "ghost", "dragon", "dark", "steel", "fairy",
];

export function PokemonDetail({
   navigate,
   id,
}: {
   navigate: (r: Route) => void;
   id: string;
}) {
   const num = Number(id);
   const { data, error, loading } = usePokemon(num);
   const [favSet, favToggle] = useFavorites();
   const [variant, setVariant] = useState<"art" | "home" | "default">("art");
   const [shiny, setShiny] = useState(false);
   const cryRef = useRef<HTMLAudioElement | null>(null);

   useEffect(() => {
      if (!data?.pokemon.cries?.latest) return;
      const a = new Audio(data.pokemon.cries.latest);
      cryRef.current = a;
      return () => a.pause();
   }, [data?.pokemon.cries?.latest]);

   if (loading && !data) return <Spinner label="Loading Pokémon…" />;
   if (error) return <Empty title="Could not load Pokémon" hint={error} />;
   if (!data) return null;

   const { pokemon, species, chain } = data;
   const types = pokemon.types.map((t) => t.type.name as TypeName);
   const stats = pokemon.stats.map((s) => ({
      name: s.stat.name,
      value: s.base_stat,
    }));
   const total = stats.reduce((a, s) => a + s.value, 0);
   const isFav = favSet.has(num);

   return (
     <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        <div className="flex items-center justify-between">
           <button
              onClick={() => navigate({ view: "dex" })}
              className="text-sm text-slate-400 hover:text-white transition"
           >
             ← Pokédex
           </button>
           <div className="flex items-center gap-2">
             <NavBtn
                dir="prev"
                num={num}
                onNav={(n) => navigate({ view: "pokemon", id: String(n) })}
             />
             <NavBtn
                dir="next"
                num={num}
                onNav={(n) => navigate({ view: "pokemon", id: String(n) })}
             />
          </div>
        </div>

        <section className="grid md:grid-cols-[260px_1fr] gap-6 rounded-3xl bg-gradient-to-br from-white/5 to-transparent border border-white/5 p-6">
           <div className="flex flex-col items-center">
              <div className="relative flex items-center justify-center">
                <div
                  className="absolute w-44 h-44 rounded-full blur-2xl opacity-30"
                  style={{
                     background: `radial-gradient(circle, ${TYPE_COLORS[types[0]] || "#ef5d2e"} 0%, transparent 70%)`,
                  }}
                />
                <img
                  src={
                    variant === "default"
                      ? gen1Sprite(num)
                      : variant === "home"
                        ? homeSprite(num)
                        : officialArt(num, shiny)
                  }
                  width={210}
                  height={210}
                  alt={pokemon.name}
                  onLoad={(e) => ((e.currentTarget as HTMLImageElement).style.opacity = "1")}
                  className="relative drop-shadow-2xl transition-opacity"
                   style={{ opacity: 0 }}
                  />
              </div>
              <div className="flex gap-2 mt-4">
                {([
                   ["art", "Modern"],
                   ["home", "Home"],
                   ["default", "Retro"],
                  ] as const).map(([k, l]) => (
                    <button
                       key={k}
                       onClick={() => setVariant(k)}
                       className={
                          "text-xs px-2.5 py-1 rounded-full border transition " +
                          (variant === k
                             ? "bg-[#ef5d2e] text-white border-transparent"
                             : "border-white/10 text-slate-400 hover:text-white")}
                    >
                      {l}
                    </button>
               ))}
               <button
                  onClick={() => setShiny((s) => !s)}
                  title="Toggle shiny"
                  className={"text-xs px-2.5 py-1 rounded-full border transition " +
                    (shiny
                       ? "bg-purple-500/30 text-purple-100 border-transparent"
                       : "border-white/10 text-slate-400 hover:text-white")}
                >
                   ✨
                </button>
              </div>
           </div>

           <div className="flex flex-col">
              <div className="flex items-center gap-3">
                <span className="text-sm font-mono text-slate-500">
                   #{String(num).padStart(3, "0")}
                </span>
                <button
                   onClick={() => cryRef.current?.play()}
                   className="w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center"
                   title="Play cry"
                >
                   🔊
                </button>
                <button
                   onClick={() => favToggle(num)}
                   title="Favorite"
                   className={
                      "text-2xl transition " +
                      (isFav ? "text-yellow-400" : "text-slate-600 hover:text-yellow-400")}
                >
                  {isFav ? "★" : "☆"}
                </button>
              </div>
              <h1 className="text-4xl font-black capitalize text-white mt-1">
                {pokemon.name}
              </h1>
              <p className="text-slate-400 text-sm capitalize italic mb-3">
                {genus(species)}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {types.map((t) => <TypeBadge key={t} type={t} size="lg" />)}
              </div>
              <div className="grid grid-cols-3 gap-3 mt-5 w-fit">
                <Metric label="Height" value={`${(pokemon.height / 10).toFixed(1)} m`} />
                <Metric label="Weight" value={`${(pokemon.weight / 10).toFixed(1)} kg`} />
                <Metric label="Base Exp" value={String(pokemon.base_experience ?? "—")} />
              </div>
           </div>
        </section>

        <MatchupMatrix types={types} />

        <section className="grid md:grid-cols-2 gap-6">
           <div className="rounded-3xl bg-white/5 border border-white/5 p-6">
              <h2 className="font-bold text-slate-200 mb-2 flex items-center gap-2">
                <span className="text-[#ef5d2e]">▣</span> Base Stats
              </h2>
              <RadarChart stats={stats} />
              <div className="mt-2 flex justify-between text-xs text-slate-400">
                <span>Base Total</span>
                <span className="font-bold text-slate-100 tabular-nums">{total}</span>
              </div>
           </div>
           <div className="rounded-3xl bg-white/5 border border-white/5 p-6 self-start">
              <h2 className="font-bold text-slate-200 mb-4 flex items-center gap-2">
                <span className="text-[#ef5d2e]">▤</span> Breakdown
              </h2>
              <StatBars
                 stats={stats.map((s) => ({ base_stat: s.value, stat: { name: s.name } }))}
              />
              <p className="text-xs text-slate-500 mt-5">
                Base stats range 1–255. Higher is stronger.
              </p>
           </div>
        </section>

        <section className="rounded-3xl bg-white/5 border border-white/5 p-6">
           <h2 className="font-bold text-slate-200 mb-3 flex items-center gap-2">
             <span className="text-[#ef5d2e]">✦</span> Abilities
           </h2>
           <div className="grid sm:grid-cols-2 gap-3">
             {pokemon.abilities.map((a) => (
               <div key={a.ability.name} className="rounded-xl bg-white/5 p-3">
                  <div className="flex items-center justify-between">
                     <span className="font-semibold capitalize text-slate-100">
                       {a.ability.name.replace(/-/g, " ")}
                     </span>
                     {a.is_hidden && (
                       <span className="text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded-full bg-purple-500/30 text-purple-200">
                         Hidden
                       </span>
                     )}
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                     Ability #{abilityId(a.ability.url)}
                  </p>
               </div>
             ))}
           </div>
        </section>

        {chain?.chain && <EvolutionSection chain={chain.chain} navigate={navigate} />}

        <MovesSection moves={pokemon.moves} />
        <FlavorSection flavor={species?.flavor_text_entries} />

        <footer className="text-center text-xs text-slate-600 py-6">
           Data from
           <a
              href="https://pokeapi.co"
              target="_blank"
              rel="noreferrer"
              className="text-slate-400 hover:text-white ml-1"
           >
             PokéAPI
           </a>
           · Built with React + Cloudflare Workers
        </footer>
     </div>
   );
}

function NavBtn({
   dir, num, onNav,
}: {
   dir: "prev" | "next";
   num: number;
   onNav: (n: number) => void;
}) {
   const target = dir === "prev" ? (num <= 1 ? 1010 : num - 1) : (num >= 1010 ? 1 : num + 1);
   return (
     <button
        onClick={() => onNav(target)}
        className="w-9 h-9 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 text-lg"
        title={dir === "prev" ? "Previous" : "Next"}
     >
       {dir === "prev" ? "‹" : "›"}
     </button>
   );
}

function genus(sp: any): string {
   const g = sp?.genera?.find((x: any) => x.language?.name === "en");
   return g?.genus || "unknown Pokémon";
}
function abilityId(url: string): number {
   return Number(url.split("/").slice(-1)[0].replace(/[^\d]/g, "")) || 0;
}
function Metric({ label, value }: { label: string; value: string }) {
   return (
      <div className="text-center">
        <div className="text-sm font-bold text-slate-100">{value}</div>
        <div className="text-[10px] uppercase tracking-wider text-slate-500">{label}</div>
      </div>
   );
}

function MatchupMatrix({ types }: { types: TypeName[] }) {
   const rows = ALL_TYPES.map((att) => ({
      att,
      rel: relation(att, types),
      mult: multiplier(att, types),
   }));
   const g = {
      bad: rows.filter((r) => r.rel === "superweak"),
      good: rows.filter((r) => r.rel === "supereffective"),
      none: rows.filter((r) => r.rel === "immune"),
   };
   return (
     <section className="rounded-3xl bg-white/5 border border-white/5 p-6">
        <h2 className="font-bold text-slate-200 mb-4 flex items-center gap-2">
          <span className="text-[#ef5d2e]">🎯</span> Type Matchups
        </h2>
        <div className="grid sm:grid-cols-3 gap-5">
          <MatchGroup title="Weak To" tone="bad" items={g.bad} />
          <MatchGroup title="Strong Against" tone="good" items={g.good} />
          <MatchGroup title="No Effect" tone="none" items={g.none} />
        </div>
     </section>
   );
}
function MatchGroup({
   title,
   tone,
   items,
    }: {
    title: string;
    tone: "bad" | "good" | "none";
    items: { att: TypeName; mult: number }[];
    }) {
   const color =
       tone === "bad" ? "text-red-300"
          : tone === "good" ? "text-emerald-300"
             : "text-slate-400";
   return (
       <div>
          <div className={`text-xs uppercase tracking-wider font-semibold mb-2 ${color}`}>
             {title}
          </div>
          <div className="flex flex-wrap gap-1.5">
             {!items.length && <span className="text-xs text-slate-600">None</span>}
             {items.map((it) => (
               <span
                  key={it.att + it.mult}
                  title={`${it.att}: ${it.mult}×`}
                  className="text-[11px] px-1.5 py-0.5 rounded whitespace-nowrap"
                  style={{
                     background: TYPE_COLORS[it.att] + "22",
                     color: TYPE_COLORS[it.att],
                  }}
               >
                 {TYPE_GLYPH[it.att]} {it.att} · {it.mult}×
               </span>
             ))}
          </div>
       </div>
    );
}

function EvolutionSection({
   chain,
   navigate,
}: {
   chain: EvolutionNode;
   navigate: (r: Route) => void;
}) {
   const flat = flattenEvos(chain);
   return (
     <section className="rounded-3xl bg-white/5 border border-white/5 p-6">
        <h2 className="font-bold text-slate-200 mb-4 flex items-center gap-2">
          <span className="text-[#ef5d2e]">🧬</span> Evolution Chain
        </h2>
        <div className="flex flex-wrap items-stretch gap-6 overflow-x-auto pb-2">
          {flat.map((evo, i) => (
             <div key={i} className="flex items-center gap-2">
               {i > 0 && <span className="text-2xl text-slate-600">→</span>}
               <button
                  onClick={() => evo.id && navigate({ view: "pokemon", id: String(evo.id) })}
                  className="group flex flex-col items-center gap-1 w-24"
               >
                 <img
                   src={evo.id ? officialArt(evo.id) : ""}
                   width={78}
                   height={78}
                   alt={evo.name}
                   className="drop-shadow-lg transition-transform group-hover:scale-110"
                />
                <span className="text-xs font-semibold capitalize text-slate-100 truncate w-full text-center">
                   {evo.name}
                </span>
                <span className="text-[10px] text-slate-500">#{String(evo.id).padStart(3, "0")}</span>
                {evo.cond && (
                   <span className="text-[10px] text-amber-300/80 bg-amber-500/10 px-2 py-0.5 rounded-full">
                      {evo.cond}
                   </span>
                 )}
              </button>
           </div>
          ))}
        </div>
     </section>
   );
}
function flattenEvos(
   node: EvolutionNode,
   out: { id: number; name: string; cond: string }[] = [],
): { id: number; name: string; cond: string }[] {
   out.push({
      id: Number(node.species?.url.split("/").slice(-1)[0].replace(/[^\d]/g, "")) || 0,
      name: node.species?.name || "?",
      cond: evCondition(node.evolution_details?.[0]),
   });
   node.evolves_to?.forEach((c) => flattenEvos(c, out));
   return out;
}
function evCondition(d: any): string {
   if (!d) return "";
   if (d.min_level) return `Lv. ${d.min_level}`;
   if (d.min_happiness) return "High Happiness";
   if (d.min_beauty) return "High Beauty";
   if (d.min_affection) return "High Affection";
   if (d.item?.url) return `Held ${d.item.name.replace(/-/g, " ")}`;
   if (d.trigger?.name === "trade") return "Trade";
   if (d.trigger?.name === "level-up") return "Level Up";
   if (d.trigger?.name === "use-item") return "Use Item";
   if (d.trigger?.name === "level-up-with-item") return "Level Up + Item";
   if (d.trigger?.name === "level-up-with-move") return "Level Up + Move";
   if (d.trigger?.name === "party-member") return "Specific Party Member";
   if (d.trigger?.name === "near-rock") return "Near Rock";
   if (d.trigger?.name === "multiplayer") return "Multiplayer";
   if (d.trigger?.name === "turn-upside-down") return "Turn Upside Down";
   if (d.trigger?.name === "time-of-day-night") return "Night";
   if (d.trigger?.name === "time-of-day-day") return "Day";
   return d.trigger?.name || "";
}

function MovesSection({ moves }: { moves: any[] }) {
   const [showAll, setShowAll] = useState(false);
   const list = useMemo(() => {
      const dedup = new Map<string, any>();
      for (const m of moves) {
         if (!dedup.has(m.move.name)) dedup.set(m.move.name, m);
      }
      return Array.from(dedup.values())
         .map((m) => {
            const g = m.version_group_details?.[0] || {};
            return {
              name: m.move.name,
              method: g.move_learn_method || "",
              level: g.level_up_level || "",
              id: Number((m.move.url || "").split("/").slice(-1)[0].replace(/[^\d]/g, "")) || 0,
            };
          })
         .sort((a: any, b: any) => a.id - b.id);
   }, [moves]);
   const shown = showAll ? list : list.slice(0, 12);
   return (
     <section className="rounded-3xl bg-white/5 border border-white/5 p-6">
        <h2 className="font-bold text-slate-200 mb-4 flex items-center justify-between">
          <span className="flex items-center gap-2">
             <span className="text-[#ef5d2e]">⚔</span> Moves
             <span className="text-xs text-slate-600 font-normal">{list.length} known</span>
          </span>
          {list.length > 12 && (
            <button onClick={() => setShowAll((v) => !v)} className="text-xs text-slate-400 hover:text-white">
              {showAll ? "Show less" : `+${list.length - 12} more`}
            </button>
          )}
        </h2>
        <div className="grid sm:grid-cols-2 gap-1.5">
          {shown.map((m: any) => (
            <div key={m.name} className="flex items-center justify-between text-sm px-3 py-1.5 rounded-lg hover:bg-white/5">
               <span className="capitalize text-slate-200">{m.name.replace(/-/g, " ")}</span>
               <span className="text-[10px] text-slate-500 capitalize">
                 {m.level ? `Lv ${m.level} · ` : ""}{m.method.replace(/-/g, " ")}
              </span>
            </div>
          ))}
        </div>
     </section>
   );
}

function FlavorSection({ flavor }: { flavor: any[] }) {
   const entries =
      flavor
        ?.filter((f: any) => f.language?.name === "en")
        .sort((a: any, b: any) => versionRank(a.version?.name) - versionRank(b.version?.name)) || [];
   const seen = new Set<string>();
   const unique = entries.filter((e: any) => {
      const t = cleanFlavor(e.flavor_text);
      if (!t || seen.has(t)) return false;
      seen.add(t);
      return true;
   });
   if (!unique.length) return null;
   return (
     <section className="rounded-3xl bg-white/5 border border-white/5 p-6">
        <h2 className="font-bold text-slate-200 mb-4 flex items-center gap-2">
          <span className="text-[#ef5d2e]">📜</span> Pokédex Entries
        </h2>
        <ul className="space-y-3">
          {unique.slice(0, 6).map((e, i) => (
             <li key={i} className="flex gap-3 text-sm">
               <span className="text-[10px] uppercase text-slate-500 min-w-[120px] pt-0.5">
                 {e.version?.name}
               </span>
               <span className="text-slate-300">{cleanFlavor(e.flavor_text)}</span>
             </li>
          ))}
        </ul>
     </section>
   );
}
function cleanFlavor(t: string): string {
   return t
      .replace(/[\n\r\f\x0c]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
}
function versionRank(v?: string): number {
   const order = [
      "red-blue", "fire-red-leaf-green", "gold-silver", "ruby-sapphire", "emerald",
      "diamond-pearl", "platinum", "heartgold-soulsilver", "black-white", "black-2-white-2",
      "x-y", "omega-ruby-alpha-sapphire", "sun-moon", "ultra-sun-ultra-moon", "sword-shield",
   ];
   const i = order.indexOf(v || "");
   return i < 0 ? 99 : i;
}
