import { Link } from 'react-router-dom'
import { TYPE_COLORS } from '../lib/constants'
import { titleCase } from '../lib/api'

export function TypeBadge({ type, size = 'md', link = true }: { type: string; size?: 'sm' | 'md' | 'lg'; link?: boolean }) {
  const c = TYPE_COLORS[type] ?? TYPE_COLORS.unknown
  const pad = size === 'sm' ? 'px-2 py-0.5 text-[10px]' : size === 'lg' ? 'px-4 py-1.5 text-sm' : 'px-3 py-1 text-xs'
  const inner = (
    <span
      className={`inline-flex items-center gap-1 rounded-full font-bold uppercase tracking-wide shadow-sm ${pad}`}
      style={{ background: `linear-gradient(135deg, ${c.from}, ${c.to})`, color: c.text }}
    >
      {type}
    </span>
  )
  return link ? <Link to={`/types/${type}`}>{inner}</Link> : inner
}

export function PokeballIcon({ className = '', spinning = false }: { className?: string; spinning?: boolean }) {
  return (
    <svg viewBox="0 0 100 100" className={`${className} ${spinning ? 'pokeball-spin' : ''}`} aria-hidden>
      <circle cx="50" cy="50" r="46" fill="currentColor" opacity="0.15" />
      <path d="M4 50a46 46 0 0 1 92 0H62a12 12 0 0 0-24 0H4z" fill="currentColor" />
      <circle cx="50" cy="50" r="13" fill="none" stroke="currentColor" strokeWidth="6" />
      <circle cx="50" cy="50" r="5" fill="currentColor" />
      <line x1="4" y1="50" x2="37" y2="50" stroke="currentColor" strokeWidth="5" />
      <line x1="63" y1="50" x2="96" y2="50" stroke="currentColor" strokeWidth="5" />
    </svg>
  )
}

export function Loader({ label }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-24 text-slate-400">
      <PokeballIcon className="h-12 w-12 text-red-500" spinning />
      {label && <p className="text-sm font-medium">{label}</p>}
    </div>
  )
}

export function ErrorState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-24 text-center">
      <div className="text-5xl">😵</div>
      <p className="text-lg font-bold">Something went wrong</p>
      <p className="max-w-md text-sm text-slate-500">{message}</p>
    </div>
  )
}

export function StatBar({ label, value, max = 255, color }: { label: string; value: number; max?: number; color: string }) {
  const pct = Math.min(100, (value / max) * 100)
  return (
    <div className="flex items-center gap-3">
      <span className="w-14 shrink-0 text-xs font-bold uppercase text-slate-500 dark:text-slate-400">{label}</span>
      <span className="w-9 shrink-0 text-right text-sm font-bold tabular-nums">{value}</span>
      <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-slate-200/70 dark:bg-white/10">
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  )
}

export function Chip({ children, active, onClick, style }: { children: React.ReactNode; active?: boolean; onClick?: () => void; style?: React.CSSProperties }) {
  return (
    <button
      onClick={onClick}
      style={style}
      className={`rounded-full px-3.5 py-1.5 text-sm font-semibold transition-all ${
        active
          ? 'bg-slate-900 text-white shadow-md dark:bg-white dark:text-slate-900'
          : 'glass text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white'
      }`}
    >
      {children}
    </button>
  )
}

export function SectionTitle({ children, icon }: { children: React.ReactNode; icon?: string }) {
  return (
    <h2 className="mb-4 flex items-center gap-2 text-lg font-extrabold tracking-tight">
      {icon && <span>{icon}</span>}
      {children}
    </h2>
  )
}

export function Genus({ children }: { children: string }) {
  return <span>{titleCase(children)}</span>
}
