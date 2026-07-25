import { Sprite } from '@/components/ui/Sprite'
import { TYPE_SLUG_BY_ID } from '@/lib/game'
import { itemSprite } from '@/lib/sprites'
import { cx } from '@/lib/cx'
import { machineKind } from './itemsMeta'

/// The sprite repository files machine art by move type (`tm-fire`) rather than by machine number,
/// so `tm01.png` never resolves and the typed disc is the only artwork a TM/HM/TR actually has.
export function itemSpriteSources(slug: string, machineTypeId?: number | null): string[] {
  const sources = [itemSprite(slug)]
  const kind = machineKind(slug)
  if (kind && machineTypeId != null) {
    const type = TYPE_SLUG_BY_ID[machineTypeId] ?? 'normal'
    if (kind === 'hm') sources.push(itemSprite(`hm-${type}`))
    sources.push(itemSprite(`tm-${type}`))
  }
  return sources
}

export interface ItemArtProps {
  slug: string
  label: string
  machineTypeId?: number | null
  className?: string
  eager?: boolean
}

export function ItemArt({ slug, label, machineTypeId, className, eager = false }: ItemArtProps) {
  return (
    <Sprite
      sources={itemSpriteSources(slug, machineTypeId)}
      alt={label}
      pixelated
      loading={eager ? 'eager' : 'lazy'}
      className={cx('shrink-0', className)}
    />
  )
}
