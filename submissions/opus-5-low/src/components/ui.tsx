import { Link } from 'react-router-dom'
import type { CSSProperties, ReactNode } from 'react'
import type { IndexEntry } from '../lib/types'
import { STAT_LABELS, STAT_SHORT, effLabel, padId, title } from '../lib/util'

export const typeColor = (t: string) => `var(--t-${t}, var(--t-normal))`

export function TypeBadge({ type, sm, link = true, ghost }: { type: string; sm?: boolean; link?: boolean; ghost?: boolean }) {
  const el = (
    <span className={`type${sm ? ' sm' : ''}${ghost ? ' ghosty' : ''}`} style={{ ['--tc' as string]: typeColor(type) }}>
      {type}
    </span>
  )
  return link ? <Link to={`/types/${type}`}>{el}</Link> : el
}

export function Panel({ title: t, children, style, actions }: { title?: string; children: ReactNode; style?: CSSProperties; actions?: ReactNode }) {
  return (
    <section className="card card-pad" style={style}>
      {(t || actions) && (
        <div className="row" style={{ justifyContent: 'space-between', alignItems: 'baseline' }}>
          {t && <div className="panel-title">{t}</div>}
          {actions}
        </div>
      )}
      {children}
    </section>
  )
}

export function Loading({ label = 'Loading' }: { label?: string }) {
  return (
    <div className="row" style={{ justifyContent: 'center', padding: 60, gap: 12 }}>
      <div className="spinner" />
      <span className="faint small">{label}…</span>
    </div>
  )
}

export function Empty({ children }: { children: ReactNode }) {
  return <div className="faint" style={{ textAlign: 'center', padding: 50 }}>{children}</div>
}

export function PokemonCard({ p, fav }: { p: IndexEntry; fav?: boolean }) {
  const c1 = typeColor(p.types[0])
  const c2 = typeColor(p.types[1] ?? p.types[0])
  return (
    <Link
      to={`/pokemon/${p.name}`}
      className={`pcard${fav ? ' fav' : ''}`}
      style={{
        ['--c1' as string]: `color-mix(in srgb, ${c1} 26%, var(--panel))`,
        ['--c2' as string]: `color-mix(in srgb, ${c2} 12%, var(--panel))`,
        ['--glow' as string]: c1,
      }}
    >
      <div className="row" style={{ justifyContent: 'space-between' }}>
        <span className="pcard-id">{padId(p.id)}</span>
        {!fav && <span className="pcard-id">{p.bst}</span>}
      </div>
      <img className="pcard-img" src={p.artwork ?? p.sprite ?? ''} alt={p.label} loading="lazy" decoding="async" />
      <div className="pcard-name">{p.label}</div>
      <div className="pcard-types">
        {p.types.map((t) => <TypeBadge key={t} type={t} sm link={false} />)}
      </div>
    </Link>
  )
}

export function StatBars({ stats, max = 255 }: { stats: Record<string, number>; max?: number }) {
  return (
    <div>
      {Object.entries(stats).map(([k, v]) => (
        <div className="stat-row" key={k}>
          <span className="stat-label">{STAT_LABELS[k] ?? title(k)}</span>
          <span className="stat-val">{v}</span>
          <span className="stat-bar">
            <span
              className="stat-fill"
              style={{
                width: `${Math.min(100, (v / max) * 100)}%`,
                background: v >= 150 ? 'linear-gradient(90deg,#35d39a,#8ef7c8)'
                  : v >= 100 ? 'linear-gradient(90deg,#5cc55c,#a8e77b)'
                  : v >= 70 ? 'linear-gradient(90deg,#f7cf3f,#ffe98a)'
                  : v >= 45 ? 'linear-gradient(90deg,#ff9f43,#ffc478)'
                  : 'linear-gradient(90deg,#f4506a,#ff8fa0)',
              }}
            />
          </span>
        </div>
      ))}
    </div>
  )
}

export function EffGrid({ profile, compact }: { profile: Record<string, number>; compact?: boolean }) {
  const groups: [string, number[]][] = [
    ['4×', [4]], ['2×', [2]], ['1×', [1]], ['½×', [0.5]], ['¼×', [0.25]], ['0×', [0]],
  ]
  if (compact) {
    return (
      <div style={{ display: 'grid', gap: 8 }}>
        {groups.map(([lbl, vals]) => {
          const list = Object.entries(profile).filter(([, m]) => vals.includes(m)).map(([t]) => t)
          if (!list.length || lbl === '1×') return null
          return (
            <div className="row" key={lbl} style={{ gap: 8 }}>
              <span className="mono small" style={{ width: 30, color: 'var(--text-faint)' }}>{lbl}</span>
              <div className="row" style={{ gap: 4 }}>
                {list.map((t) => <TypeBadge key={t} type={t} sm />)}
              </div>
            </div>
          )
        })}
      </div>
    )
  }
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(64px, 1fr))', gap: 6 }}>
      {Object.entries(profile).map(([t, m]) => (
        <div key={t} style={{ display: 'grid', gap: 4 }}>
          <TypeBadge type={t} sm />
          <div className={`eff-cell eff-${m === 0.25 ? '25' : m === 0.5 ? '50' : String(m)}`}>{effLabel(m)}×</div>
        </div>
      ))}
    </div>
  )
}

export function MiniStats({ stats }: { stats: number[] }) {
  return (
    <div className="row" style={{ gap: 6 }}>
      {stats.map((v, i) => (
        <div key={i} style={{ minWidth: 34 }}>
          <div className="faint" style={{ fontSize: 9, letterSpacing: '.06em' }}>{STAT_SHORT[Object.keys(STAT_LABELS)[i]]}</div>
          <div className="mono" style={{ fontSize: 12 }}>{v}</div>
          <div className="bar-mini"><div style={{ width: `${Math.min(100, (v / 200) * 100)}%`, background: 'var(--accent)' }} /></div>
        </div>
      ))}
    </div>
  )
}

export function Sprite({ id, name, size = 44, artwork }: { id: number; name?: string; size?: number; artwork?: string | null }) {
  return (
    <img
      src={artwork ?? `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`}
      alt={name ?? String(id)}
      width={size}
      height={size}
      loading="lazy"
      decoding="async"
      style={{ objectFit: 'contain', imageRendering: artwork ? 'auto' : 'pixelated' }}
    />
  )
}
