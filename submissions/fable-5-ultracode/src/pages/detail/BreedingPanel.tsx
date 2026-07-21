import type { Meta, PokemonDetail } from '../../lib/types'
import { genderSplit, hatchSteps, titleCase } from '../../lib/format'

interface Props {
  detail: PokemonDetail
  meta: Meta
}

const pct = (n: number) => `${Number.isInteger(n) ? n : n.toFixed(1)}%`

export default function BreedingPanel({ detail, meta }: Props) {
  const split = genderSplit(detail.genderRate)
  const noEggs = detail.eggGroups.includes('no-eggs')
  return (
    <dl className="pd-dl card">
      <div className="pd-dl-item">
        <dt className="eyebrow">Egg groups</dt>
        <dd className="pd-egg-groups">
          {detail.eggGroups.length > 0
            ? detail.eggGroups.map(g => (
                <span className="chip pd-egg-chip" key={g}>
                  {meta.eggGroups[g] ?? titleCase(g)}
                </span>
              ))
            : '—'}
        </dd>
      </div>
      <div className="pd-dl-item">
        <dt className="eyebrow">Gender ratio</dt>
        <dd>
          {split ? (
            <div className="pd-gender">
              <div
                className="pd-gender-bar"
                role="img"
                aria-label={`${pct(split.female)} female, ${pct(split.male)} male`}
              >
                <span style={{ width: `${split.female}%`, background: '#d95f9c' }} />
                <span style={{ width: `${split.male}%`, background: '#4f83d6' }} />
              </div>
              <div className="pd-gender-labels mono">
                <span>♀ {pct(split.female)}</span>
                <span>♂ {pct(split.male)}</span>
              </div>
            </div>
          ) : (
            'Genderless'
          )}
        </dd>
      </div>
      <div className="pd-dl-item">
        <dt className="eyebrow">Hatch time</dt>
        <dd>
          {noEggs
            ? '—'
            : detail.hatchCounter != null
              ? `${detail.hatchCounter} cycles · ≈${hatchSteps(detail.hatchCounter)} steps`
              : '—'}
        </dd>
      </div>
      {noEggs && (
        <div className="pd-dl-item pd-dl-wide">
          <dt className="eyebrow">Breeding</dt>
          <dd className="dim">Undiscovered egg group — this Pokémon cannot breed.</dd>
        </div>
      )}
    </dl>
  )
}
