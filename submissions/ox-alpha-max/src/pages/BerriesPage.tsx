import { berrySpriteUrl } from "../lib/data";
import { formatName, typeColor } from "../lib/utils";
import { TypeBadge } from "../components/TypeBadge";

interface Berry {
  n: string;
  firmness: string | null;
  growth: number;
  harvest: number;
  size: number;
  smooth: number;
  dry: number;
  giftType: string | null;
  giftPower: number;
  flavors: { f: string; p: number }[];
}

import berriesJson from "../data/berries.json";
const BERRIES = berriesJson as Berry[];

const FLAVOR_COLORS: Record<string, string> = {
  spicy: "#ef4444",
  dry: "#38bdf8",
  sweet: "#f472b6",
  bitter: "#22c55e",
  sour: "#eab308",
};

export function BerriesPage() {
  return (
    <div>
      <h1 className="text-3xl font-black tracking-tight">Berries</h1>
      <p className="mt-1 text-sm text-muted">{BERRIES.length} berries with flavors, growth data and Natural Gift stats.</p>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {BERRIES.map((b) => (
          <div key={b.n} className="rounded-2xl border border-line bg-panel p-4 transition-all hover:-translate-y-0.5 hover:border-dex-red/40 hover:shadow-lg">
            <div className="flex items-center gap-3">
              <img
                src={berrySpriteUrl(b.n)}
                alt={b.n}
                loading="lazy"
                className="h-14 w-14 object-contain"
                onError={(e) => ((e.target as HTMLImageElement).style.opacity = "0.15")}
              />
              <div>
                <p className="font-black capitalize">{formatName(b.n)}</p>
                <p className="text-[11px] capitalize text-muted">{b.firmness ? `${formatName(b.firmness)} · size ${b.size}mm` : `size ${b.size}mm`}</p>
              </div>
            </div>

            <div className="mt-3 flex flex-wrap gap-1">
              {b.flavors.map((f) => (
                <span
                  key={f.f}
                  title={`${f.f} ${f.p}/40`}
                  className="rounded-full px-2 py-0.5 text-[10px] font-bold capitalize text-white"
                  style={{ background: FLAVOR_COLORS[f.f] ?? "#888" }}
                >
                  {f.f} {f.p}
                </span>
              ))}
            </div>

            <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1.5 text-[11px]">
              <Row label="Growth time" value={`${b.growth}h`} />
              <Row label="Max harvest" value={String(b.harvest)} />
              <Row label="Smoothness" value={String(b.smooth)} />
              <Row label="Soil dryness" value={String(b.dry)} />
            </div>

            {b.giftType && (
              <div className="mt-3 flex items-center gap-2 rounded-xl border border-line bg-panel-2 px-2.5 py-1.5">
                <span className="h-3 w-3 rounded-full" style={{ background: typeColor(b.giftType) }} />
                <span className="text-[11px] font-semibold">
                  Natural Gift: <TypeBadge type={b.giftType} size="sm" /> {b.giftPower} power
                </span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-2">
      <span className="capitalize text-muted">{label}</span>
      <span className="font-mono font-bold">{value}</span>
    </div>
  );
}
