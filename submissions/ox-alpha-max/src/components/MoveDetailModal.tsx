import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { useMoveDetail } from "../lib/api";
import { formatName, typeColor } from "../lib/utils";
import { TypeBadge } from "./TypeBadge";

export function MoveDetailModal({ moveName, onClose }: { moveName: string | null; onClose: () => void }) {
  const { data, isLoading } = useMoveDetail(moveName ?? "");

  return (
    <AnimatePresence>
      {moveName && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] grid place-items-center bg-black/60 p-4 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.92, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, y: 10 }}
            transition={{ type: "spring", damping: 26, stiffness: 320 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg rounded-2xl border border-line bg-panel p-5 shadow-2xl"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-xl font-black">{formatName(moveName)}</h3>
                <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                  {data && <TypeBadge type={data.type.name} size="sm" />}
                  {data && (
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                        data.damage_class.name === "physical"
                          ? "bg-red-500/15 text-red-500"
                          : data.damage_class.name === "special"
                            ? "bg-sky-500/15 text-sky-500"
                            : "bg-violet-500/15 text-violet-400"
                      }`}
                    >
                      {data.damage_class.name}
                    </span>
                  )}
                  {data && (
                    <span className="rounded-full bg-panel-2 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-muted">
                      Gen {genOf(data.generation?.name)}
                    </span>
                  )}
                </div>
              </div>
              <button onClick={onClose} aria-label="Close" className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-muted hover:bg-panel-2 hover:text-ink">
                <X className="h-4 w-4" />
              </button>
            </div>

            {isLoading || !data ? (
              <div className="mt-4 space-y-2">
                <div className="skeleton h-3 w-full rounded" />
                <div className="skeleton h-3 w-3/4 rounded" />
              </div>
            ) : (
              <>
                <div className="mt-4 grid grid-cols-4 gap-2">
                  <Stat label="Power" value={data.power ?? "—"} />
                  <Stat label="Accuracy" value={data.accuracy != null ? `${data.accuracy}%` : "—"} />
                  <Stat label="PP" value={data.pp ?? "—"} />
                  <Stat label="Priority" value={data.priority > 0 ? `+${data.priority}` : data.priority} />
                </div>
                <p className="mt-4 text-sm leading-relaxed">
                  {data.effect_entries.find((e) => e.language.name === "en")?.short_effect ||
                    data.flavor_text_entries.find((f) => f.language.name === "en")?.flavor_text ||
                    "No description available."}
                </p>
                {(data.meta &&
                  (data.meta.ailment.name !== "none" ||
                    data.meta.stat_chance > 0 ||
                    data.meta.healing > 0 ||
                    data.meta.drain > 0)) && (
                  <div className="mt-3 flex flex-wrap gap-1.5 text-[11px] font-semibold">
                    {data.meta.ailment.name !== "none" && (
                      <span className="rounded-full bg-panel-2 px-2 py-1 capitalize text-muted">
                        {formatName(data.meta.ailment.name)}
                        {data.meta.ailment_chance > 0 && ` ${data.meta.ailment_chance}%`}
                      </span>
                    )}
                    {!!data.meta.flinch_chance && (
                      <span className="rounded-full bg-panel-2 px-2 py-1 text-muted">Flinch {data.meta.flinch_chance}%</span>
                    )}
                    {!!data.meta.stat_chance && (
                      <span className="rounded-full bg-panel-2 px-2 py-1 text-muted">Stat change {data.meta.stat_chance}%</span>
                    )}
                    {!!data.meta.healing && (
                      <span className="rounded-full bg-panel-2 px-2 py-1 text-muted">Heals {data.meta.healing}%</span>
                    )}
                    {!!data.meta.drain && (
                      <span className="rounded-full bg-panel-2 px-2 py-1 text-muted">Drains {data.meta.drain}%</span>
                    )}
                  </div>
                )}
                <p className="mt-3 text-xs text-muted">
                  Target: <span className="font-semibold capitalize">{data.target.name.replace(/-/g, " ")}</span>
                  {data.stat_changes.length > 0 && (
                    <>
                      {" · "}Changes{" "}
                      {data.stat_changes.map((sc) => `${formatName(sc.stat.name)} ${sc.change > 0 ? "+" : ""}${sc.change}`).join(", ")}
                    </>
                  )}
                </p>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-line bg-panel-2 px-2 py-2 text-center">
      <p className="text-[10px] font-bold uppercase tracking-widest text-muted">{label}</p>
      <p className="mt-0.5 font-mono text-base font-black">{value}</p>
    </div>
  );
}

const ROMAN = ["i", "ii", "iii", "iv", "v", "vi", "vii", "viii", "ix"];
function genOf(name?: string): number {
  const m = /generation-(\w+)/.exec(name ?? "");
  return m ? ROMAN.indexOf(m[1]) + 1 : 0;
}
