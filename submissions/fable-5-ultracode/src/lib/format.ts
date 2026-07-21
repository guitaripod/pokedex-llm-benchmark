export const dexNo = (id: number) => `#${String(id).padStart(4, '0')}`

export function heightStr(dm: number): string {
  const m = dm / 10
  const totalInches = dm * 3.937008
  const ft = Math.floor(totalInches / 12)
  const inch = Math.round(totalInches % 12)
  return `${m.toFixed(1)} m (${ft}′${String(inch).padStart(2, '0')}″)`
}

export function weightStr(hg: number): string {
  const kg = hg / 10
  const lb = hg * 0.2204623
  return `${kg.toFixed(1)} kg (${lb.toFixed(1)} lb)`
}

export function genderSplit(rate: number): { female: number; male: number } | null {
  if (rate < 0) return null
  const female = (rate / 8) * 100
  return { female, male: 100 - female }
}

export const catchPercent = (rate: number) => `${((rate / 255) * 100).toFixed(1)}%`

export const hatchSteps = (counter: number) => ((counter + 1) * 255).toLocaleString('en-US')

export const titleCase = (s: string) =>
  s.split('-').map(w => (w ? w[0].toUpperCase() + w.slice(1) : w)).join(' ')

export const STAT_LABELS = ['HP', 'Attack', 'Defense', 'Sp. Atk', 'Sp. Def', 'Speed']
export const STAT_SHORT = ['HP', 'ATK', 'DEF', 'SPA', 'SPD', 'SPE']

export const GEN_ROMAN = ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX']
