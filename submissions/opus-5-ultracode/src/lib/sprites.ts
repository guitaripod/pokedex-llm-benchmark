/**
 * Sprite and audio URLs. Everything is routed through the Worker's `/img` and `/cry` proxies so
 * the assets are served from our own origin with immutable edge caching instead of GitHub raw.
 */

const IMG = '/img'
const CRY = '/cry'

export interface SpriteOptions {
  shiny?: boolean
  back?: boolean
  female?: boolean
}

export function artwork(id: number, shiny = false): string {
  return `${IMG}/pokemon/other/official-artwork${shiny ? '/shiny' : ''}/${id}.png`
}

export function homeArt(id: number, options: SpriteOptions = {}): string {
  const parts = ['pokemon/other/home']
  if (options.shiny) parts.push('shiny')
  if (options.female) parts.push('female')
  return `${IMG}/${parts.join('/')}/${id}.png`
}

export function showdownSprite(id: number, options: SpriteOptions = {}): string {
  const parts = ['pokemon/other/showdown']
  if (options.back) parts.push('back')
  if (options.shiny) parts.push('shiny')
  if (options.female) parts.push('female')
  return `${IMG}/${parts.join('/')}/${id}.gif`
}

export function gameSprite(id: number, options: SpriteOptions = {}): string {
  const parts = ['pokemon']
  if (options.back) parts.push('back')
  if (options.shiny) parts.push('shiny')
  if (options.female) parts.push('female')
  return `${IMG}/${parts.join('/')}/${id}.png`
}

export function dreamWorld(id: number): string {
  return `${IMG}/pokemon/other/dream-world/${id}.svg`
}

export function icon(id: number, generation: 'vii' | 'viii' = 'viii'): string {
  return `${IMG}/pokemon/versions/generation-${generation}/icons/${id}.png`
}

export interface VersionSpriteSet {
  generation: string
  key: string
  label: string
  /** Sub-directories available for this set beyond the default front sprite. */
  variants: ('back' | 'shiny' | 'female' | 'transparent' | 'gray' | 'animated')[]
  extension?: 'png' | 'gif'
}

export const VERSION_SPRITE_SETS: VersionSpriteSet[] = [
  { generation: 'generation-i', key: 'red-blue', label: 'Red · Blue', variants: ['back', 'gray', 'transparent'] },
  { generation: 'generation-i', key: 'yellow', label: 'Yellow', variants: ['back', 'gray', 'transparent'] },
  { generation: 'generation-ii', key: 'gold', label: 'Gold', variants: ['back', 'shiny', 'transparent'] },
  { generation: 'generation-ii', key: 'silver', label: 'Silver', variants: ['back', 'shiny', 'transparent'] },
  { generation: 'generation-ii', key: 'crystal', label: 'Crystal', variants: ['back', 'shiny', 'transparent'] },
  {
    generation: 'generation-iii',
    key: 'ruby-sapphire',
    label: 'Ruby · Sapphire',
    variants: ['back', 'shiny'],
  },
  { generation: 'generation-iii', key: 'emerald', label: 'Emerald', variants: ['shiny'] },
  {
    generation: 'generation-iii',
    key: 'firered-leafgreen',
    label: 'FireRed · LeafGreen',
    variants: ['back', 'shiny'],
  },
  {
    generation: 'generation-iv',
    key: 'diamond-pearl',
    label: 'Diamond · Pearl',
    variants: ['back', 'shiny', 'female'],
  },
  { generation: 'generation-iv', key: 'platinum', label: 'Platinum', variants: ['back', 'shiny', 'female'] },
  {
    generation: 'generation-iv',
    key: 'heartgold-soulsilver',
    label: 'HeartGold · SoulSilver',
    variants: ['back', 'shiny', 'female'],
  },
  {
    generation: 'generation-v',
    key: 'black-white',
    label: 'Black · White',
    variants: ['back', 'shiny', 'female', 'animated'],
  },
  { generation: 'generation-vi', key: 'x-y', label: 'X · Y', variants: ['shiny', 'female'] },
  {
    generation: 'generation-vi',
    key: 'omegaruby-alphasapphire',
    label: 'Omega Ruby · Alpha Sapphire',
    variants: ['shiny', 'female'],
  },
  {
    generation: 'generation-vii',
    key: 'ultra-sun-ultra-moon',
    label: 'Ultra Sun · Ultra Moon',
    variants: ['shiny', 'female'],
  },
]

export function versionSprite(
  set: VersionSpriteSet,
  id: number,
  variant: 'front' | 'back' | 'shiny' | 'female' | 'transparent' | 'gray' | 'animated' = 'front',
): string {
  const segments = ['pokemon', 'versions', set.generation, set.key]
  let extension = set.extension ?? 'png'
  if (variant === 'animated') {
    segments.push('animated')
    extension = 'gif'
  } else if (variant !== 'front') {
    segments.push(variant)
  }
  return `${IMG}/${segments.join('/')}/${id}.${extension}`
}

export function itemSprite(slug: string): string {
  return `${IMG}/items/${slug}.png`
}

export function itemSpriteByName(slug: string): string {
  return itemSprite(slug)
}

export function cryUrl(id: number, legacy = false): string {
  return `${CRY}/${legacy ? 'legacy' : 'latest'}/${id}.ogg`
}

/**
 * Preferred hero art with progressive fallbacks. Alternate forms are often missing from the
 * official-artwork set, so HOME renders act as the second choice before the small game sprite.
 */
export function heroCandidates(id: number, shiny: boolean): string[] {
  return [artwork(id, shiny), homeArt(id, { shiny }), gameSprite(id, { shiny }), artwork(id, false)]
}

export function thumbCandidates(id: number, shiny: boolean): string[] {
  return [homeArt(id, { shiny }), artwork(id, shiny), gameSprite(id, { shiny })]
}
