import { Link } from 'react-router-dom'
import { TYPE_ORDER, effectiveness, multiplierLabel } from '../lib/typechart'
import { TYPE_COLORS } from '../lib/constants'

function cellStyle(m: number) {
  if (m === 0) return { background: '#1e293b', color: '#fff' }
  if (m === 0.5) return { background: '#ef444455', color: '#b91c1c' }
  if (m === 2) return { background: '#22c55e55', color: '#15803d' }
  return {}
}

export function TypesPage() {
  return (
    <div className="animate-fade-in space-y-6">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-violet-600 to-indigo-500 p-8 text-white shadow-xl">
        <h1 className="text-3xl font-black tracking-tight">Type Effectiveness Chart</h1>
        <p className="mt-2 max-w-2xl text-sm font-medium text-white/90">
          Rows are the attacking type, columns are the defending type. Green = super effective (2×), red = not very effective (½×), dark = no effect (0×).
        </p>
      </div>

      <div className="card overflow-x-auto p-4">
        <table className="mx-auto border-separate border-spacing-0.5 text-center">
          <thead>
            <tr>
              <th className="sticky left-0 z-10 bg-white/0 p-1">
                <span className="text-[9px] font-bold text-slate-400">ATK ↓ / DEF →</span>
              </th>
              {TYPE_ORDER.map((d) => (
                <th key={d} className="p-0.5">
                  <Link to={`/types/${d}`}>
                    <span
                      className="grid h-7 w-7 place-items-center rounded text-[8px] font-black uppercase"
                      style={{ background: TYPE_COLORS[d].solid, color: TYPE_COLORS[d].text }}
                      title={d}
                    >
                      {d.slice(0, 3)}
                    </span>
                  </Link>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {TYPE_ORDER.map((atk) => (
              <tr key={atk}>
                <th className="sticky left-0 z-10 p-0.5">
                  <Link to={`/types/${atk}`}>
                    <span
                      className="grid h-7 w-16 place-items-center rounded text-[9px] font-black uppercase"
                      style={{ background: TYPE_COLORS[atk].solid, color: TYPE_COLORS[atk].text }}
                    >
                      {atk}
                    </span>
                  </Link>
                </th>
                {TYPE_ORDER.map((def) => {
                  const m = effectiveness(atk, def)
                  return (
                    <td key={def} className="h-7 w-7 rounded text-[9px] font-bold tabular-nums" style={cellStyle(m)}>
                      {m !== 1 ? multiplierLabel(m) : ''}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-6">
        {TYPE_ORDER.map((t) => (
          <Link
            key={t}
            to={`/types/${t}`}
            className="group flex items-center justify-center rounded-2xl p-5 font-black uppercase tracking-wide text-white shadow-md transition-transform hover:-translate-y-1"
            style={{ background: `linear-gradient(135deg, ${TYPE_COLORS[t].from}, ${TYPE_COLORS[t].to})` }}
          >
            {t}
          </Link>
        ))}
      </div>
    </div>
  )
}
