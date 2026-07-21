import { useMemo, useState } from 'react'
import type { FlavorGroup } from '../../lib/types'

interface Props {
  flavor: FlavorGroup[]
}

export default function DexEntries({ flavor }: Props) {
  const [version, setVersion] = useState('')
  const versions = useMemo(() => {
    const seen: string[] = []
    for (const g of flavor) for (const vn of g.v) if (!seen.includes(vn)) seen.push(vn)
    return seen
  }, [flavor])
  const shown = version ? flavor.filter(g => g.v.includes(version)) : flavor
  return (
    <div className="pd-entries card">
      <div className="pd-entries-bar">
        <label className="visually-hidden" htmlFor="pd-flavor-version">
          Filter dex entries by game version
        </label>
        <select
          id="pd-flavor-version"
          className="select"
          value={version}
          onChange={e => setVersion(e.target.value)}
        >
          <option value="">All versions</option>
          {versions.map(vn => (
            <option key={vn} value={vn}>
              {vn}
            </option>
          ))}
        </select>
        <span className="mono dim pd-readout" aria-live="polite">
          {shown.length} {shown.length === 1 ? 'entry' : 'entries'}
        </span>
      </div>
      <ul className="pd-fl-list">
        {shown.map(g => (
          <li key={g.v.join('|')} className="pd-fl-row">
            <div className="pd-fl-v mono">{g.v.join(' · ')}</div>
            <p className="pd-fl-t">{g.t}</p>
          </li>
        ))}
      </ul>
    </div>
  )
}
