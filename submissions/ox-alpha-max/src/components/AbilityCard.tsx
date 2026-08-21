import { useAbility } from "../lib/api";
import { formatName } from "../lib/utils";

export function AbilityCard({ name, hidden }: { name: string; hidden: boolean }) {
  const { data } = useAbility(name);
  const effect =
    data?.effect_entries.find((e) => e.language.name === "en")?.short_effect ??
    (data?.flavor_text_entries.find((f) => f.language.name === "en")?.flavor_text ?? "");

  return (
    <div className="rounded-xl border border-line bg-panel-2 p-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-bold">{formatName(name)}</p>
        {hidden && (
          <span className="rounded-full bg-fuchsia-500/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-fuchsia-500">
            Hidden
          </span>
        )}
      </div>
      <p className="mt-1 text-xs leading-relaxed text-muted">
        {effect || <span className="skeleton block h-3 w-full rounded" />}
      </p>
    </div>
  );
}
