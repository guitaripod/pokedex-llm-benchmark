import { DMG_CLASS_COLORS } from '../../lib/typeColors'
import { titleCase } from '../../lib/format'

export const EM_DASH = '—'

export function ClassTag({ dclass }: { dclass: string }) {
  return (
    <span className="mv-class">
      <span
        className="mv-dot"
        style={{ background: DMG_CLASS_COLORS[dclass] ?? 'var(--text-faint)' }}
        aria-hidden="true"
      />
      {titleCase(dclass)}
    </span>
  )
}
