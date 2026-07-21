import { getMeta } from '../../lib/api'
import { useAsync, useDocTitle } from '../../lib/hooks'
import Section from '../../components/Section'
import Loader from '../../components/Loader'
import EmptyState from '../../components/EmptyState'
import './about.css'

const FEATURES = [
  { name: 'National dex', desc: 'Every species, searchable and filterable by type, generation and rarity.' },
  { name: 'Forms & varieties', desc: 'Regional forms, Megas and Gigantamax variants with their own stats and art.' },
  { name: 'Evolution chains', desc: 'Full trees with the exact conditions on every branch.' },
  { name: 'Type matchups', desc: 'The complete 18×18 damage matrix, plus per-species defensive profiles.' },
  { name: 'Move database', desc: 'Power, accuracy, effects and every Pokémon that learns each move.' },
  { name: 'Team analysis', desc: 'Build a squad of six and audit its coverage and shared weaknesses.' },
  { name: 'Compare', desc: 'Side-by-side stat readouts for up to six specimens at once.' },
  { name: 'Quiz', desc: 'Silhouette identification drills against the clock.' },
  { name: 'Favorites', desc: 'A persistent field log of starred species, kept on this device.' },
  { name: 'Command palette', desc: 'Jump to any species, move or page without leaving the keyboard.' }
]

const SHORTCUTS = [
  { keys: ['/', 'Ctrl K'], sep: 'or', action: 'Open the command palette' },
  { keys: ['←', '→'], sep: '/', action: 'Previous / next species on detail pages' },
  { keys: ['1', '4'], sep: 'through', action: 'Pick an answer in the quiz' }
]

function Readout({ label, value }: { label: string; value: string }) {
  return (
    <div className="ab-tile">
      <dt className="eyebrow">{label}</dt>
      <dd className="ab-tile-value mono">{value}</dd>
    </div>
  )
}

export default function AboutPage() {
  useDocTitle('About')
  const { data: meta, error } = useAsync(getMeta, [])

  if (error) return <EmptyState title="Spec sheet unavailable" hint="The instrument metadata failed to load. Try reloading the page." />
  if (!meta) return <Loader />

  const n = (v: number) => v.toLocaleString('en-US')
  const built = new Date(meta.builtAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })

  return (
    <div className="container page-pad ab-page">
      <header className="ab-masthead">
        <div className="eyebrow">Instrument spec sheet</div>
        <h1>Pokédex — Fable-5 Ultracode</h1>
        <p className="ab-story dim">
          A complete, offline-compiled field instrument for the Pokémon world. Every species,
          form, move, ability and item was pulled once from PokéAPI, cross-referenced, and
          compiled into static JSON at build time — so the app you are reading makes no runtime
          API calls at all. What ships is the finished reference: open it anywhere, and the
          whole dex answers instantly from files sitting next to the page.
        </p>
      </header>

      <dl className="ab-readouts" aria-label="Compiled data counts">
        <Readout label="Species" value={n(meta.counts.species)} />
        <Readout label="Forms" value={n(meta.counts.pokemon)} />
        <Readout label="Moves" value={n(meta.counts.moves)} />
        <Readout label="Abilities" value={n(meta.counts.abilities)} />
        <Readout label="Items" value={n(meta.counts.items)} />
        <Readout label="Compiled" value={built} />
      </dl>

      <Section eyebrow="Capabilities" title="Instrument functions">
        <ol className="ab-features">
          {FEATURES.map((f, i) => (
            <li key={f.name} className="ab-feature">
              <span className="ab-feature-no mono" aria-hidden="true">
                {String(i + 1).padStart(2, '0')}
              </span>
              <span className="ab-feature-body">
                <span className="ab-feature-name">{f.name}</span>
                <span className="dim">{f.desc}</span>
              </span>
            </li>
          ))}
        </ol>
      </Section>

      <Section eyebrow="Controls" title="Keyboard shortcuts">
        <table className="data-table ab-shortcuts">
          <thead>
            <tr>
              <th scope="col">Keys</th>
              <th scope="col">Action</th>
            </tr>
          </thead>
          <tbody>
            {SHORTCUTS.map(s => (
              <tr key={s.action}>
                <td className="ab-keys">
                  {s.keys.map((k, i) => (
                    <span key={k} className="ab-keygroup">
                      {i > 0 && <span className="dim">{s.sep}</span>}
                      <kbd className="ab-kbd">{k}</kbd>
                    </span>
                  ))}
                </td>
                <td>{s.action}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Section>

      <Section eyebrow="Provenance" title="Credits">
        <dl className="ab-credits">
          <div className="ab-credit">
            <dt className="eyebrow">Data</dt>
            <dd>
              <a href="https://pokeapi.co" target="_blank" rel="noreferrer">
                PokéAPI
              </a>
            </dd>
          </div>
          <div className="ab-credit">
            <dt className="eyebrow">Sprites & artwork</dt>
            <dd>
              <a href="https://github.com/PokeAPI/sprites" target="_blank" rel="noreferrer">
                PokeAPI sprites
              </a>
            </dd>
          </div>
          <div className="ab-credit">
            <dt className="eyebrow">Built with</dt>
            <dd>React + Vite</dd>
          </div>
          <div className="ab-credit">
            <dt className="eyebrow">Hosted on</dt>
            <dd>Cloudflare Workers</dd>
          </div>
        </dl>
        <p className="ab-disclaimer dim">
          Pokémon and character names are trademarks of Nintendo, Creatures Inc. and Game Freak.
          This is a fan-made reference, not affiliated with or endorsed by them.
        </p>
      </Section>

      <Section eyebrow="Design" title="Notes from the bench">
        <p className="ab-notes dim">
          The interface keeps its own palette deliberately quiet — near-neutral surfaces, mono
          readouts, one red accent — and lets each specimen bring the color. A species page
          derives its washes, borders and glows from the primary type&apos;s hue via CSS
          color-mixing, so a Fire page runs warm and a Water page runs cold without a single
          hardcoded tint. The one deliberate anachronism is the sprite gallery: early-generation
          sprites are presented on the four-shade green of the original Game Boy LCD, because
          that is the screen they were drawn for, and they have never looked right anywhere else.
        </p>
      </Section>
    </div>
  )
}
