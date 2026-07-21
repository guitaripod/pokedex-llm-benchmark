import type { Pokemon } from '../types/pokemon'

export interface ShowdownPokemon {
  name: string
  item?: string
  ability?: string
  evs?: Record<string, number>
  nature?: string
  moves: string[]
}

export function exportTeamToShowdown(team: Pokemon[]): string {
  return team.map(p => {
    const lines = [p.name]
    lines.push(`Ability: ${p.abilities[0]?.ability.name.replace(/-/g, ' ') || 'Unknown'}`)
    lines.push('EVs: 252 HP / 4 Atk / 252 Spe')
    lines.push('Jolly Nature')
    p.levelUpMoves?.slice(0, 4).forEach(m => {
      lines.push(`- ${m.name.replace(/-/g, ' ')}`)
    })
    return lines.join('\n')
  }).join('\n\n')
}

export function parseShowdownTeam(text: string): Partial<ShowdownPokemon>[] {
  const teams: Partial<ShowdownPokemon>[] = []
  const blocks = text.trim().split(/\n\s*\n/)
  for (const block of blocks) {
    const lines = block.trim().split('\n').map(l => l.trim())
    if (lines.length === 0) continue
    const nameLine = lines[0]
    const name = nameLine.split('@')[0].trim()
    const item = nameLine.includes('@') ? nameLine.split('@')[1].trim() : undefined
    const p: Partial<ShowdownPokemon> = { name, item, moves: [] }
    for (const line of lines.slice(1)) {
      if (line.startsWith('Ability:')) p.ability = line.replace('Ability:', '').trim()
      if (line.startsWith('EVs:')) {
        // parse simple
      }
      if (line.endsWith('Nature')) p.nature = line.replace('Nature', '').trim()
      if (line.startsWith('- ')) p.moves!.push(line.replace('- ', '').trim())
    }
    teams.push(p)
  }
  return teams
}
