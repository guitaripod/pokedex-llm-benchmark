// Pure SVG radar chart for the six pokemon stats.
export function RadarChart({
   stats, size = 260, color = "#ef5d2e",
}: {
   stats: { name: string; value: number }[];
   size?: number;
   color?: string;
}) {
   const n = stats.length;
   const cx = size / 2;
   const cy = size / 2;
   const r = size / 2 - 36;
   const max = 255;
   const point = (i: number, v: number) => {
      const ang = (Math.PI / n) * i - Math.PI / 2;
      const rr = (Math.min(v, max) / max) * r;
      return [cx + rr * Math.cos(ang), cy + rr * Math.sin(ang)];
       };
   const poly = stats
      .map((s, i) => point(i, s.value).join(","))
      .join(" ");
   const ring = (f: number) =>
      Array.from({ length: n })
           .map((_, i) => point(i, f * max).join(","))
           .join(" ");
   return (
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="mx-auto">
         {[0.25, 0.5, 0.75, 1].map((f) => (
           <polygon
             key={f}
             points={ring(f)}
             fill="none"
             stroke="rgba(255,255,255,0.08)"
             strokeWidth={1}
          />
         ))}
         {stats.map((s, i) => {
            const [x, y] = point(i, max);
            const [lx, ly] = point(i, max * 1.13);
            return (
              <g key={s.name}>
                 <line x1={cx} y1={cy} x2={x} y2={y} stroke="rgba(255,255,255,0.06)" />
                 <text
                   x={lx}
                   y={ly}
                   fill="#94a3b8"
                   fontSize={11}
                   textAnchor="middle"
                   dominantBaseline="middle"
                >
                   {s.value}·{label(s.name)}
                 </text>
              </g>
             );
          })}
         <polygon
           points={poly}
           fill={color + "33"}
           stroke={color}
           strokeWidth={2}
           strokeLinejoin="round"
          />
         {stats.map((s, i) => {
            const [x, y] = point(i, s.value);
            return <circle key={i} cx={x} cy={y} r={3} fill={color} />;
          })}
      </svg>
   );
}

function label(k: string): string {
   const m: Record<string, string> = {
      hp: "HP", attack: "Atk", defense: "Def",
      "special-attack": "SpA", "special-defense": "SpD", speed: "Spe",
    };
   return m[k] || k;
}
