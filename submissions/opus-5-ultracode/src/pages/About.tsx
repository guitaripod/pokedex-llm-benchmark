import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { PageHeader, Panel, SectionTitle } from '@/components/ui/Panel'
import { Skeleton } from '@/components/ui/Controls'
import { ErrorState } from '@/components/shell/Loading'
import { loadJson, useAsync } from '@/lib/data'
import { useDex } from '@/lib/dex'
import { cx } from '@/lib/cx'

interface DatasetStats {
  pokemon: number
  species: number
  forms: number
  moves: number
  items: number
  abilities: number
  locations: number
  learnsetRows: number
  encounterRows: number
}

interface Endpoint {
  path: string
  summary: string
  params?: string
}

const ENDPOINTS: Endpoint[] = [
  { path: '/api', summary: 'Service index — lists every endpoint and its shape.' },
  { path: '/api/meta', summary: 'Types, type chart, generations, versions, natures, berries, machines.' },
  {
    path: '/api/pokemon',
    summary: 'Paged national index of every form.',
    params: 'limit (1–2000, default 60) · offset · q',
  },
  { path: '/api/pokemon/{id|name}', summary: 'Full record: stats, learnset, encounters, evolutions, forms.' },
  { path: '/api/moves', summary: 'Paged move index.', params: 'limit · offset · q' },
  { path: '/api/moves/{id|name}', summary: 'Move detail with machines, stat changes and learners.' },
  { path: '/api/items', summary: 'Paged item index.', params: 'limit · offset · q' },
  { path: '/api/items/{id|name}', summary: 'Item detail with berry data, holders and evolution use.' },
  { path: '/api/abilities', summary: 'Paged ability index.', params: 'limit · offset · q' },
  { path: '/api/abilities/{id|name}', summary: 'Ability detail with effect text and every carrier.' },
  { path: '/api/locations', summary: 'Paged location index.', params: 'limit · offset · q' },
  { path: '/api/locations/{id|name}', summary: 'Location detail with per-area encounter tables.' },
  { path: '/api/search', summary: 'Cross-collection search.', params: 'q (required) · limit (1–100, default 20)' },
  { path: '/health', summary: 'Liveness probe.' },
]

const COLLECTION_RESPONSE = `{
  "count": 1351,
  "offset": 0,
  "limit": 60,
  "results": [
    { "id": 25, "name": "pikachu", "label": "Pikachu", "dex": 25, "types": [13], "bst": 320, … }
  ]
}`

const CURL_EXAMPLE = `curl -s "$ORIGIN/api/pokemon/pikachu" | jq '{name, bst, types}'
curl -s "$ORIGIN/api/search?q=surf&limit=5" | jq '.results'
curl -s "$ORIGIN/api/moves?q=beam&limit=10" | jq '.count'`

/// Copies to the clipboard and flashes a confirmation without leaking the reset timer.
function useCopy() {
  const [copied, setCopied] = useState<string | null>(null)
  const timer = useRef<number | null>(null)

  useEffect(() => () => window.clearTimeout(timer.current ?? undefined), [])

  const copy = (value: string) => {
    void navigator.clipboard
      ?.writeText(value)
      .then(() => {
        setCopied(value)
        window.clearTimeout(timer.current ?? undefined)
        timer.current = window.setTimeout(() => setCopied(null), 1600)
      })
      .catch(() => undefined)
  }

  return { copied, copy }
}

export default function About() {
  const dex = useDex()
  const stats = useAsync('stats.json', () => loadJson<DatasetStats>('stats.json'))
  const { copied, copy } = useCopy()
  const origin = typeof window === 'undefined' ? '' : window.location.origin

  const counts = dex.meta.counts
  const curlExample = CURL_EXAMPLE.replaceAll('$ORIGIN', origin || 'https://pokedex.example')

  return (
    <div style={{ '--accent': 'var(--type-steel)' } as React.CSSProperties}>
      <PageHeader
        eyebrow="Colophon"
        title="About this Pokédex"
        subtitle="A static, offline-friendly reference compiled from the PokéAPI dataset and served from the edge. No runtime calls to any third-party API, no tracking, no accounts."
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <Panel className="min-w-0">
          <SectionTitle eyebrow="Honestly">How it is built</SectionTitle>
          <div className="space-y-3 text-sm leading-relaxed text-dim">
            <p>
              Every fact on this site comes from the{' '}
              <ExternalLink href="https://github.com/PokeAPI/pokeapi">PokéAPI CSV dataset</ExternalLink> — the
              same veekun-derived tables that back pokeapi.co. A build script reads those CSVs once and emits
              static JSON: one index per collection plus one detail file per record, so a page load fetches
              exactly the bytes it needs and nothing else.
            </p>
            <p>
              Large collections are encoded as positional tuples rather than keyed objects. A single learnset
              averages hundreds of rows and the national dex ships{' '}
              <span className="numeric text-ink">
                {stats.data ? stats.data.learnsetRows.toLocaleString('en-US') : '638,000+'}
              </span>{' '}
              of them, so field names would have dominated the payload.
            </p>
            <p>
              The site is a React single-page app on Cloudflare Workers static assets. The Worker adds three
              things: the public JSON API below, an edge proxy for sprites and cries (
              <code className="numeric text-[12px] text-ink">/img/*</code> and{' '}
              <code className="numeric text-[12px] text-ink">/cry/*</code>, cached immutably so artwork is
              served from our own origin instead of GitHub raw), and an HTMLRewriter pass that injects
              per-record titles and preview images for crawlers and chat unfurls.
            </p>
            <p>
              Nothing you do here leaves the browser. Favourites, caught marks, teams and settings live in
              local storage; you can export or wipe them from{' '}
              <Link to="/settings" className="text-ink underline decoration-line underline-offset-2 hover:text-accent">
                Settings
              </Link>
              .
            </p>
          </div>
        </Panel>

        <Panel className="min-w-0">
          <SectionTitle eyebrow="Build output">Dataset</SectionTitle>
          {stats.loading ? (
            <div className="grid grid-cols-2 gap-4">
              {Array.from({ length: 8 }, (_, index) => (
                <div key={index}>
                  <Skeleton className="h-2.5 w-16" />
                  <Skeleton className="mt-2 h-5 w-20" />
                </div>
              ))}
            </div>
          ) : stats.error ? (
            <ErrorState message={stats.error.message} />
          ) : stats.data ? (
            <>
              <dl className="grid grid-cols-2 gap-x-4 gap-y-4">
                <Figure label="Pokémon forms" value={stats.data.pokemon} />
                <Figure label="Species" value={stats.data.species} />
                <Figure label="Alternate forms" value={stats.data.forms} />
                <Figure label="Moves" value={stats.data.moves} />
                <Figure label="Items" value={stats.data.items} />
                <Figure label="Abilities" value={stats.data.abilities} />
                <Figure label="Locations" value={stats.data.locations} />
                <Figure label="Machines" value={counts.machines} />
                <Figure label="Learnset rows" value={stats.data.learnsetRows} />
                <Figure label="Encounter rows" value={stats.data.encounterRows} />
              </dl>
              <p className="numeric mt-4 border-t border-line-soft pt-3 text-[11px] uppercase tracking-[0.14em] text-faint">
                Compiled {new Date(dex.meta.generatedAt).toLocaleString('en-GB', { dateStyle: 'medium' })}
              </p>
            </>
          ) : null}
        </Panel>
      </div>

      <Panel className="mt-6">
        <SectionTitle
          eyebrow="Public"
          actions={
            <a
              href="/api"
              target="_blank"
              rel="noreferrer noopener"
              className="numeric rounded-chip border border-line px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-dim transition hover:bg-raised hover:text-ink"
            >
              Open /api
            </a>
          }
        >
          JSON API
        </SectionTitle>

        <p className="mb-4 max-w-3xl text-sm leading-relaxed text-dim">
          The same data this app runs on is readable by anyone. Every response is JSON, every route is
          <code className="numeric px-1 text-[12px] text-ink">GET</code>-only, CORS is open to all origins, and
          responses are edge-cached for an hour with a day of stale-while-revalidate. Detail routes accept a
          numeric id or a slug.
        </p>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] border-collapse text-left">
            <thead>
              <tr className="border-b border-line">
                <th className="numeric pb-2 pr-4 text-[10px] font-semibold uppercase tracking-[0.16em] text-faint">
                  Endpoint
                </th>
                <th className="numeric pb-2 pr-4 text-[10px] font-semibold uppercase tracking-[0.16em] text-faint">
                  Returns
                </th>
                <th className="numeric pb-2 text-right text-[10px] font-semibold uppercase tracking-[0.16em] text-faint">
                  Copy
                </th>
              </tr>
            </thead>
            <tbody>
              {ENDPOINTS.map((endpoint) => {
                const url = `${origin}${endpoint.path}`
                return (
                  <tr key={endpoint.path} className="border-b border-line-soft last:border-0">
                    <td className="py-2.5 pr-4 align-top">
                      <code className="numeric text-[12px] font-semibold text-ink">{endpoint.path}</code>
                      {endpoint.params && (
                        <span className="numeric mt-0.5 block text-[10px] uppercase tracking-[0.1em] text-faint">
                          {endpoint.params}
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 pr-4 align-top text-[13px] leading-snug text-dim">
                      {endpoint.summary}
                    </td>
                    <td className="py-2.5 text-right align-top">
                      <CopyButton value={url} copied={copied === url} onCopy={() => copy(url)} />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-2">
          <CodeBlock
            title="Collection response"
            code={COLLECTION_RESPONSE}
            copied={copied === COLLECTION_RESPONSE}
            onCopy={() => copy(COLLECTION_RESPONSE)}
          />
          <CodeBlock
            title="Try it"
            code={curlExample}
            copied={copied === curlExample}
            onCopy={() => copy(curlExample)}
          />
        </div>

        <p className="mt-4 text-[12px] leading-relaxed text-faint">
          Media is proxied too: <code className="numeric text-ink">/img/pokemon/other/official-artwork/25.png</code>{' '}
          and <code className="numeric text-ink">/cry/latest/25.ogg</code> mirror the PokéAPI sprite and cry
          repositories with a one-year immutable cache. Please keep usage reasonable — this runs on a free-tier
          Worker.
        </p>
      </Panel>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Panel className="min-w-0">
          <SectionTitle eyebrow="Credits">Sources</SectionTitle>
          <ul className="space-y-3 text-sm leading-relaxed text-dim">
            <li>
              <ExternalLink href="https://pokeapi.co">PokéAPI</ExternalLink> — the dataset behind every number,
              effect and flavour text here, itself derived from{' '}
              <ExternalLink href="https://github.com/veekun/pokedex">veekun/pokedex</ExternalLink>.
            </li>
            <li>
              <ExternalLink href="https://github.com/PokeAPI/sprites">PokeAPI/sprites</ExternalLink> — official
              artwork, HOME renders, Showdown animations and every generation's game sprites.
            </li>
            <li>
              <ExternalLink href="https://github.com/PokeAPI/cries">PokeAPI/cries</ExternalLink> — latest and
              legacy cry audio.
            </li>
            <li>
              Typography: Space Grotesk and Inter. Built with React, Tailwind CSS and Vite; deployed on
              Cloudflare Workers.
            </li>
          </ul>
        </Panel>

        <Panel className="min-w-0">
          <SectionTitle eyebrow="Legal">Licence &amp; trademarks</SectionTitle>
          <div className="space-y-3 text-sm leading-relaxed text-dim">
            <p>
              The source code of this project is licensed under the{' '}
              <ExternalLink href="https://www.gnu.org/licenses/gpl-3.0.html">GNU GPL v3.0 or later</ExternalLink>
              . You may use, study, modify and redistribute it, provided derivative works stay under the same
              licence.
            </p>
            <p>
              Pokémon and Pokémon character names are trademarks of Nintendo, Creatures Inc. and GAME FREAK
              Inc. Sprites, artwork, cries and flavour text remain the property of their respective owners.
            </p>
            <p className="text-faint">
              This is an unofficial, non-commercial fan project. It is not affiliated with, endorsed by or
              sponsored by Nintendo, The Pokémon Company, Creatures Inc. or GAME FREAK Inc.
            </p>
          </div>
        </Panel>
      </div>
    </div>
  )
}

function Figure({ label, value }: { label: string; value: number }) {
  return (
    <div className="min-w-0">
      <dt className="numeric text-[10px] font-semibold uppercase tracking-[0.16em] text-faint">{label}</dt>
      <dd className="numeric mt-0.5 truncate text-xl font-bold leading-none">
        {value.toLocaleString('en-US')}
      </dd>
    </div>
  )
}

function ExternalLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer noopener"
      className="text-ink underline decoration-line underline-offset-2 transition hover:text-accent"
    >
      {children}
    </a>
  )
}

function CopyButton({ value, copied, onCopy }: { value: string; copied: boolean; onCopy: () => void }) {
  return (
    <button
      type="button"
      onClick={onCopy}
      aria-label={`Copy ${value}`}
      className={cx(
        'inline-flex h-7 items-center gap-1.5 rounded-chip border px-2 text-[10px] font-semibold uppercase tracking-[0.12em] transition',
        copied ? 'border-transparent bg-accent text-[#0b0d12]' : 'border-line text-faint hover:bg-raised hover:text-ink',
      )}
    >
      {copied ? (
        <svg viewBox="0 0 16 16" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
          <path d="m3.5 8.5 3 3 6-6.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ) : (
        <svg viewBox="0 0 16 16" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
          <rect x="5.5" y="5.5" width="8" height="8" rx="1.5" />
          <path d="M10.5 3.5H3.5a1 1 0 0 0-1 1v7" />
        </svg>
      )}
      {copied ? 'Copied' : 'Copy'}
    </button>
  )
}

function CodeBlock({
  title,
  code,
  copied,
  onCopy,
}: {
  title: string
  code: string
  copied: boolean
  onCopy: () => void
}) {
  return (
    <div className="min-w-0 rounded-plate border border-line-soft bg-surface/50">
      <div className="flex items-center justify-between gap-3 border-b border-line-soft px-3 py-2">
        <span className="numeric text-[10px] font-semibold uppercase tracking-[0.16em] text-faint">
          {title}
        </span>
        <CopyButton value={code} copied={copied} onCopy={onCopy} />
      </div>
      <pre className="numeric overflow-x-auto px-3 py-3 text-[11.5px] leading-relaxed text-dim">
        <code>{code}</code>
      </pre>
    </div>
  )
}
