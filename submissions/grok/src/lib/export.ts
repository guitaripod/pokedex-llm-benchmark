import type { Pokemon } from '../types/pokemon'
import { getSprite, getBst } from '../types/pokemon'

export async function exportPokemonCard(pokemon: Pokemon, shiny = false): Promise<void> {
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')!
  canvas.width = 800
  canvas.height = 400

  // Background
  ctx.fillStyle = '#0a0c14'
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  // Card bg
  ctx.fillStyle = '#111827'
  ctx.roundRect(20, 20, 760, 360, 20)
  ctx.fill()

  // Title
  ctx.fillStyle = '#fff'
  ctx.font = 'bold 32px Inter, sans-serif'
  ctx.fillText(`#${String(pokemon.id).padStart(3, '0')} ${pokemon.name.toUpperCase()}`, 50, 80)

  // Types
  ctx.font = '16px Inter, sans-serif'
  let x = 50
  pokemon.types.forEach(t => {
    ctx.fillStyle = '#ef4444'
    ctx.fillRect(x, 100, 80, 28)
    ctx.fillStyle = '#fff'
    ctx.fillText(t.type.name, x + 8, 120)
    x += 90
  })

  // Stats
  ctx.fillStyle = '#fff'
  ctx.font = '14px monospace'
  let y = 160
  pokemon.stats.forEach(s => {
    ctx.fillText(`${s.stat.name.toUpperCase()}: ${s.base_stat}`, 50, y)
    y += 22
  })

  ctx.fillText(`BST: ${getBst(pokemon)}`, 50, y + 10)

  // Image
  const img = new Image()
  img.crossOrigin = 'anonymous'
  img.src = getSprite(pokemon, shiny)
  await new Promise(r => { img.onload = r })
  ctx.drawImage(img, 450, 80, 280, 280)

  // Download
  const a = document.createElement('a')
  a.download = `${pokemon.name}-card.png`
  a.href = canvas.toDataURL('image/png')
  a.click()
}

export async function exportTeamImage(team: Pokemon[]): Promise<void> {
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')!
  canvas.width = 1200
  canvas.height = 300

  ctx.fillStyle = '#0a0c14'
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  ctx.fillStyle = '#fff'
  ctx.font = 'bold 24px Inter, sans-serif'
  ctx.fillText('MY TEAM', 40, 50)

  let x = 40
  for (const p of team) {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.src = getSprite(p)
    await new Promise(r => { img.onload = r })
    ctx.drawImage(img, x, 70, 140, 140)
    ctx.font = '14px Inter'
    ctx.fillText(p.name, x, 230)
    x += 180
  }

  const a = document.createElement('a')
  a.download = 'team.png'
  a.href = canvas.toDataURL('image/png')
  a.click()
}
