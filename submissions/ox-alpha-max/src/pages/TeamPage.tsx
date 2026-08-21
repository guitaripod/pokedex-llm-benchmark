import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Plus, X, Trash2, Shield, Swords, Search } from "lucide-react";
import { BASE_DEX, DEX_BY_ID, artworkUrl, type DexEntry } from "../lib/data";
import { TYPES, defensiveProfile, formatName, statTotal, typeColor } from "../lib/utils";
import { useTeam } from "../lib/store";
import { TypeBadge } from "../components/TypeBadge";

export function TeamPage() {
  const [team, setSlot] = useTeam();
  const [pickingSlot, setPickingSlot] = useState<number | null>(null);

  const members = team.map((id) => (id != null ? (DEX_BY_ID.get(id) ?? null) : null));

  const analysis = useMemo(() => analyzeTeam(members), [members]);

  return (
    <div>
      <h1 className="text-3xl font-black tracking-tight">Team Builder</h1>
      <p className="mt-1 text-sm text-muted">
        Assemble a team of six and see its collective type coverage at a glance.
      </p>

      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {team.map((id, slot) => (
          <div key={slot} className="relative">
            {id != null && members[slot] ? (
              <motion.div
                layout
                className="group relative overflow-hidden rounded-2xl border border-line bg-panel p-3 text-center"
              >
                <button
                  onClick={() => setSlot(slot, null)}
                  aria-label={`Remove ${members[slot]!.n}`}
                  className="absolute right-1.5 top-1.5 z-10 grid h-6 w-6 place-items-center rounded-full bg-panel-2 text-muted opacity-0 transition-opacity hover:text-dex-red group-hover:opacity-100"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
                <img src={artworkUrl(id)} alt={members[slot]!.n} className="mx-auto h-24 w-24 object-contain" loading="lazy" />
                <Link to={`/pokemon/${id}`} className="mt-1 block truncate text-sm font-bold hover:text-dex-red">
                  {formatName(members[slot]!.n)}
                </Link>
                <div className="mt-1 flex justify-center gap-1">
                  {members[slot]!.t.map((t) => (
                    <TypeBadge key={t} type={t} size="sm" />
                  ))}
                </div>
                <p className="mt-1 font-mono text-[10px] font-bold text-muted">BST {statTotal(members[slot]!.s)}</p>
              </motion.div>
            ) : (
              <button
                onClick={() => setPickingSlot(slot)}
                className="grid aspect-square w-full place-items-center rounded-2xl border-2 border-dashed border-line bg-panel/50 text-muted transition-colors hover:border-dex-red/40 hover:text-dex-red"
              >
                <span className="flex flex-col items-center gap-1 text-xs font-bold">
                  <Plus className="h-6 w-6" />
                  Slot {slot + 1}
                </span>
              </button>
            )}
          </div>
        ))}
      </div>

      {analysis.filled > 0 && (
        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          <section className="rounded-2xl border border-line bg-panel p-4 sm:p-5">
            <h2 className="mb-3 flex items-center gap-2 text-sm font-extrabold uppercase tracking-widest text-muted">
              <Shield className="h-4 w-4" /> Team Defenses
            </h2>
            <div className="grid grid-cols-6 gap-1.5 sm:grid-cols-9">
              {TYPES.map((atk) => {
                const count = analysis.counts[atk];
                const worst = analysis.worst[atk];
                let cls = "text-muted";
                if (count >= 2) cls = "bg-red-500/15 text-red-500 font-black";
                else if (worst >= 2) cls = "bg-orange-500/10 text-orange-500 font-bold";
                else if (analysis.immune.includes(atk)) cls = "bg-green-500/10 text-green-600";
                return (
                  <div key={atk} title={`${formatName(atk)}: ${count} weak, best ×${worst}`} className={`flex flex-col items-center gap-0.5 rounded-lg border border-line py-1.5 ${cls}`}>
                    <span className="h-3.5 w-3.5 rounded-full" style={{ background: typeColor(atk) }} />
                    <span className="font-mono text-[11px]">{count > 0 ? `${count}×` : worst === 0 ? "0" : `×${worst}`}</span>
                  </div>
                );
              })}
            </div>
            <p className="mt-3 text-[11px] leading-relaxed text-muted">
              Numbers show how many members take super-effective damage from each type.
              Highlighted red = shared weakness worth patching.
            </p>
          </section>

          <section className="rounded-2xl border border-line bg-panel p-4 sm:p-5">
            <h2 className="mb-3 flex items-center gap-2 text-sm font-extrabold uppercase tracking-widest text-muted">
              <Swords className="h-4 w-4" /> Team Summary
            </h2>
            <div className="space-y-2 text-sm">
              <SummaryRow label="Members" value={`${analysis.filled}/6`} />
              <SummaryRow label="Combined BST" value={analysis.totalBst.toLocaleString()} />
              <SummaryRow label="Shared weaknesses" value={analysis.sharedWeak.length ? analysis.sharedWeak.join(", ") : "none"} tone={analysis.sharedWeak.length ? "text-red-500" : "text-green-500"} />
              <SummaryRow label="Team immunities" value={analysis.immune.length ? analysis.immune.join(", ") : "—"} />
              <SummaryRow label="Legendary / Mythical" value={`${analysis.legendaries} / ${analysis.mythicals}`} />
            </div>
            {analysis.filled === 6 && (
              <button
                onClick={() => team.forEach((_, i) => setSlot(i, null))}
                className="mt-4 flex items-center gap-1.5 rounded-xl border border-line px-4 py-2 text-xs font-bold text-muted transition-colors hover:border-dex-red/40 hover:text-dex-red"
              >
                <Trash2 className="h-3.5 w-3.5" /> Clear team
              </button>
            )}
          </section>
        </div>
      )}

      <AnimatePresence>
        {pickingSlot !== null && (
          <Picker
            exclude={team.filter((x) => x != null) as number[]}
            onPick={(id) => {
              setSlot(pickingSlot, id);
              setPickingSlot(null);
            }}
            onClose={() => setPickingSlot(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function SummaryRow({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-line pb-2 last:border-0">
      <span className="text-xs font-bold uppercase tracking-wide text-muted">{label}</span>
      <span className={`font-bold capitalize ${tone ?? ""}`}>{value}</span>
    </div>
  );
}

function Picker({
  onPick,
  onClose,
  exclude,
}: {
  onPick: (id: number) => void;
  onClose: () => void;
  exclude: number[];
}) {
  const [q, setQ] = useState("");
  const results = useMemo(() => {
    const query = q.trim().toLowerCase().replace(/\s+/g, "-");
    return BASE_DEX.filter(
      (p) => !exclude.includes(p.i) && (!query || p.n.includes(query) || String(p.i) === query)
    ).slice(0, 60);
  }, [q, exclude]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] grid place-items-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, y: 16 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.97 }}
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[80vh] w-full max-w-xl flex-col overflow-hidden rounded-2xl border border-line bg-panel shadow-2xl"
      >
        <div className="border-b border-line p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <input
              autoFocus
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search a Pokemon…"
              className="w-full rounded-xl border border-line bg-panel-2 py-2 pl-9 pr-3 text-sm outline-none placeholder:text-muted focus:border-dex-red/50"
            />
          </div>
        </div>
        <div className="grid flex-1 grid-cols-3 gap-2 overflow-y-auto p-4 sm:grid-cols-4">
          {results.map((p) => (
            <button
              key={p.i}
              onClick={() => onPick(p.i)}
              className="flex flex-col items-center gap-1 rounded-xl border border-line bg-panel-2 p-2 transition-all hover:-translate-y-0.5 hover:border-dex-red/40"
            >
              <img src={artworkUrl(p.i)} alt={p.n} loading="lazy" className="h-14 w-14 object-contain" />
              <span className="w-full truncate text-[11px] font-bold capitalize">{formatName(p.n)}</span>
            </button>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}

function analyzeTeam(members: (DexEntry | null | undefined)[]) {
  const filled = members.filter(Boolean).length as number;
  const counts: Record<string, number> = {};
  const worst: Record<string, number> = {};
  const immune: string[] = [];
  const sharedWeak: string[] = [];
  let totalBst = 0;
  let legendaries = 0;
  let mythicals = 0;

  for (const t of TYPES) {
    counts[t] = 0;
    worst[t] = Infinity;
  }

  for (const m of members) {
    if (!m) continue;
    totalBst += statTotal(m.s);
    if (m.l) legendaries++;
    if (m.m) mythicals++;
    const profile = defensiveProfile(m.t);
    for (const t of TYPES) {
      const mult = profile[t];
      if (mult > 1) counts[t]++;
      worst[t] = Math.min(worst[t], mult);
      if (mult === 0 && !immune.includes(t)) immune.push(t);
    }
  }

  for (const t of TYPES) if (counts[t] >= 2) sharedWeak.push(formatName(t));
  for (const t of TYPES) if (worst[t] === Infinity) worst[t] = 1;

  return { filled, counts, worst, immune, sharedWeak, totalBst, legendaries, mythicals };
}
