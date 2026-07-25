import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { EmptyState, PageHeader, Panel, SectionTitle, Stat } from '@/components/ui/Panel'
import { Button, Segmented, Select, Toggle } from '@/components/ui/Controls'
import { PokemonCard } from '@/components/pokemon/PokemonCard'
import { ArtStage, MysteryMark } from '@/components/game/ArtStage'
import { CryStage } from '@/components/game/CryStage'
import { DexEntryStage } from '@/components/game/DexEntryStage'
import { GuessBox } from '@/components/game/GuessBox'
import { HintRail } from '@/components/game/HintRail'
import { RoundHistory } from '@/components/game/RoundHistory'
import {
  EMPTY_RECORD,
  MAX_HINTS,
  MODE_HINT,
  MODE_LABEL,
  OUTCOME_COLOR,
  OUTCOME_LABEL,
  acceptedKeys,
  buildAnswerIndex,
  buildPool,
  buildSearchEntries,
  formatDuration,
  formatPercent,
  loadRecord,
  normalizeAnswer,
  pickTarget,
  saveRecord,
  scoreRound,
  type HistoryItem,
  type QuizCategory,
  type QuizMode,
  type QuizRecord,
  type RoundOutcome,
  type RoundStatus,
} from '@/components/game/quiz'
import { typeSlug, useDex } from '@/lib/dex'
import { cryUrl } from '@/lib/sprites'
import { formatDex } from '@/lib/game'
import { cx } from '@/lib/cx'
import type { PokemonIndexEntry } from '@/types/data'

interface Round {
  entry: PokemonIndexEntry
  index: number
  startedAt: number
  seed: number
  hints: number
  status: RoundStatus
  elapsed: number
  points: number
  guessedId: number | null
}

interface Session {
  attempts: number
  correct: number
  skipped: number
  totalMs: number
  points: number
  streak: number
}

const EMPTY_SESSION: Session = {
  attempts: 0,
  correct: 0,
  skipped: 0,
  totalMs: 0,
  points: 0,
  streak: 0,
}

const MODE_OPTIONS: { value: QuizMode; label: string; title: string }[] = [
  { value: 'silhouette', label: 'Silhouette', title: MODE_HINT.silhouette },
  { value: 'cry', label: 'Cry', title: MODE_HINT.cry },
  { value: 'dex', label: 'Dex entry', title: MODE_HINT.dex },
]

const CATEGORY_OPTIONS: { value: QuizCategory; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'starters', label: 'Starters' },
  { value: 'legendary', label: 'Legends' },
]

/// Fires a one-shot cry at reveal volume, ignoring browsers that block unprompted playback.
function playCry(pokemonId: number) {
  const audio = new Audio(cryUrl(pokemonId))
  audio.volume = 0.45
  void audio.play().catch(() => undefined)
}

export default function WhosThat() {
  const dex = useDex()

  const [mode, setMode] = useState<QuizMode>('silhouette')
  const [generation, setGeneration] = useState(0)
  const [category, setCategory] = useState<QuizCategory>('all')
  const [includeForms, setIncludeForms] = useState(false)
  const [sound, setSound] = useState(true)

  const formsInPlay = includeForms && mode !== 'dex'

  const challenge = useMemo(
    () => ({ mode, pool: buildPool(dex.entries, { generation, category, includeForms: formsInPlay }) }),
    [mode, dex.entries, generation, category, formsInPlay],
  )
  const pool = challenge.pool
  const searchIndex = useMemo(
    () => buildSearchEntries(formsInPlay ? dex.entries : dex.entries.filter((entry) => entry.isDefault)),
    [dex.entries, formsInPlay],
  )
  const answerIndex = useMemo(() => buildAnswerIndex(dex.entries), [dex.entries])

  const [round, setRound] = useState<Round | null>(null)
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [session, setSession] = useState<Session>(EMPTY_SESSION)
  const [record, setRecord] = useState<QuizRecord>(EMPTY_RECORD)
  const [guess, setGuess] = useState('')
  const [notice, setNotice] = useState<string | null>(null)
  const [now, setNow] = useState(() => Date.now())

  const seenRef = useRef<Set<number>>(new Set())
  const nextButtonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    setRecord(loadRecord())
  }, [])

  const startRound = useCallback(() => {
    const { pool: candidates } = challenge
    const target = pickTarget(candidates, seenRef.current)
    if (!target) {
      setRound(null)
      return
    }
    if (seenRef.current.size + 1 >= candidates.length) seenRef.current = new Set()
    seenRef.current.add(target.id)
    setRound((current) => ({
      entry: target,
      index: (current?.index ?? 0) + 1,
      startedAt: Date.now(),
      seed: Math.random(),
      hints: 0,
      status: 'guessing',
      elapsed: 0,
      points: 0,
      guessedId: null,
    }))
    setGuess('')
    setNotice(null)
    setNow(Date.now())
  }, [challenge])

  useEffect(() => {
    seenRef.current = new Set()
    startRound()
  }, [startRound])

  const resolved = round !== null && round.status !== 'guessing'

  useEffect(() => {
    if (!round || round.status !== 'guessing') return
    const timer = window.setInterval(() => setNow(Date.now()), 100)
    return () => window.clearInterval(timer)
  }, [round])

  useEffect(() => {
    if (!resolved) return
    nextButtonRef.current?.focus()
    const handler = (event: KeyboardEvent) => {
      if (event.key !== 'Enter' && event.key !== ' ') return
      const tag = (event.target as HTMLElement | null)?.tagName
      if (tag === 'BUTTON' || tag === 'INPUT' || tag === 'A' || tag === 'SELECT' || tag === 'TEXTAREA') return
      event.preventDefault()
      startRound()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [resolved, startRound])

  const speciesLabel = round ? dex.defaultBySpecies.get(round.entry.speciesId)?.label : undefined
  const accepted = useMemo(
    () => (round ? acceptedKeys(round.entry, speciesLabel) : new Set<string>()),
    [round, speciesLabel],
  )

  const elapsed = round ? (round.status === 'guessing' ? now - round.startedAt : round.elapsed) : 0

  const finishRound = (status: RoundOutcome, guessedId: number | null) => {
    if (!round || round.status !== 'guessing') return
    const took = Date.now() - round.startedAt
    const points = status === 'correct' ? scoreRound(took, round.hints).points : 0

    setRound({ ...round, status, elapsed: took, points, guessedId })
    setHistory((items) =>
      [{ round: round.index, entry: round.entry, status, elapsed: took, points, mode }, ...items].slice(0, 40),
    )

    const nextSession: Session = {
      attempts: session.attempts + 1,
      correct: session.correct + (status === 'correct' ? 1 : 0),
      skipped: session.skipped + (status === 'skipped' ? 1 : 0),
      totalMs: session.totalMs + took,
      points: session.points + points,
      streak: status === 'correct' ? session.streak + 1 : 0,
    }
    setSession(nextSession)

    const nextRecord: QuizRecord = {
      bestStreak: Math.max(record.bestStreak, nextSession.streak),
      bestScore: Math.max(record.bestScore, nextSession.points),
      rounds: record.rounds + 1,
      correct: record.correct + (status === 'correct' ? 1 : 0),
    }
    setRecord(nextRecord)
    saveRecord(nextRecord)

    if (sound) playCry(round.entry.id)
  }

  const submitGuess = (raw: string) => {
    if (!round || round.status !== 'guessing') return
    const key = normalizeAnswer(raw)
    if (!key) return
    if (accepted.has(key)) {
      finishRound('correct', round.entry.id)
      return
    }
    const guessed = answerIndex.get(key)
    if (!guessed) {
      setNotice(`No Pokémon is called “${raw.trim()}” — that one is free, try again.`)
      return
    }
    finishRound('wrong', guessed.id)
  }

  const revealHint = () => {
    setRound((current) =>
      current && current.status === 'guessing' && current.hints < MAX_HINTS
        ? { ...current, hints: current.hints + 1 }
        : current,
    )
  }

  const resetSession = () => {
    setHistory([])
    setSession(EMPTY_SESSION)
    seenRef.current = new Set()
    startRound()
  }

  const outcome = resolved && round ? (round.status as RoundOutcome) : null
  const accent =
    resolved && round ? `var(--type-${typeSlug(round.entry.types[0] ?? 1)})` : 'var(--type-electric)'
  const guessedEntry = round?.guessedId != null ? dex.byId.get(round.guessedId) : undefined

  return (
    <div style={{ '--accent': accent } as React.CSSProperties}>
      <PageHeader
        eyebrow="Training · Identify the species"
        title="Who's That Pokémon?"
        subtitle={MODE_HINT[mode]}
        actions={
          <>
            <Segmented options={MODE_OPTIONS} value={mode} onChange={setMode} />
            <Button variant="outline" size="sm" onClick={resetSession}>
              New session
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0 space-y-4">
          {round ? (
            <Panel padded={false}>
              <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-2.5">
                <span className="numeric text-[10px] font-semibold uppercase tracking-[0.16em] text-faint">
                  Round {String(round.index).padStart(2, '0')} · {MODE_LABEL[mode]}
                </span>
                <span className="numeric text-[11px] font-semibold text-dim" aria-label="Elapsed time">
                  {formatDuration(elapsed)}
                </span>
              </div>

              <div className={cx('grid gap-5 p-4 sm:p-5', mode === 'dex' && 'lg:grid-cols-2')}>
                <div className="relative mx-auto flex h-[230px] w-full max-w-[340px] items-center justify-center sm:h-[280px]">
                  <ArtStage entry={round.entry} revealed={resolved} silhouette={mode === 'silhouette'} />
                  {!resolved && mode === 'cry' && (
                    <CryStage
                      pokemonId={round.entry.id}
                      roundKey={round.index}
                      autoPlay={sound}
                      className="absolute inset-0"
                    />
                  )}
                  {!resolved && mode === 'dex' && <MysteryMark label="Redacted" />}
                </div>

                {mode === 'dex' && (
                  <DexEntryStage entry={round.entry} revealed={resolved} seed={round.seed} />
                )}
              </div>

              <div className="border-t border-line px-4 py-3">
                <HintRail
                  entry={round.entry}
                  revealedHints={round.hints}
                  onReveal={revealHint}
                  locked={resolved}
                />
              </div>

              <div className="rounded-b-plate border-t border-line bg-surface/60 px-4 py-3.5">
                {outcome ? (
                  <div className="flex animate-[fadeIn_320ms_var(--ease-out-expo)_both] flex-wrap items-center gap-x-4 gap-y-3">
                    <span
                      className="numeric shrink-0 rounded-chip border px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em]"
                      style={{
                        color: OUTCOME_COLOR[outcome],
                        borderColor: `color-mix(in oklab, ${OUTCOME_COLOR[outcome]} 45%, transparent)`,
                        background: `color-mix(in oklab, ${OUTCOME_COLOR[outcome]} 10%, transparent)`,
                      }}
                    >
                      {OUTCOME_LABEL[outcome]}
                    </span>
                    <p className="min-w-0 flex-1 text-sm text-dim">
                      It was{' '}
                      <Link
                        to={`/pokemon/${round.entry.name}`}
                        className="font-display font-semibold text-accent hover:underline"
                      >
                        {round.entry.label}
                      </Link>
                      {outcome === 'wrong' && guessedEntry && (
                        <span className="text-faint"> — you said {guessedEntry.label}</span>
                      )}
                    </p>
                    <span className="numeric shrink-0 text-[11px] text-faint">
                      {formatDuration(round.elapsed)}
                      {outcome === 'correct' && (
                        <span className="ml-2 font-semibold text-accent">+{round.points}</span>
                      )}
                    </span>
                    <Button ref={nextButtonRef} variant="solid" size="md" onClick={startRound}>
                      Next round
                    </Button>
                  </div>
                ) : (
                  <GuessBox
                    index={searchIndex}
                    value={guess}
                    onChange={(value) => {
                      setGuess(value)
                      setNotice(null)
                    }}
                    onSubmit={submitGuess}
                    onSkip={() => finishRound('skipped', null)}
                    focusKey={round.index}
                    notice={notice}
                  />
                )}
              </div>
            </Panel>
          ) : (
            <Panel>
              <EmptyState
                title="No Pokémon match these filters"
                hint="Widen the generation or roster filter to start a round."
              />
            </Panel>
          )}

          <Panel className="hidden lg:block">
            <SectionTitle eyebrow={`${history.length} recorded`}>Round history</SectionTitle>
            <RoundHistory items={history} />
          </Panel>
        </div>

        <div className="min-w-0 space-y-4">
          <Panel>
            <SectionTitle eyebrow="This session">Scoreboard</SectionTitle>
            <div className="grid grid-cols-2 gap-x-4 gap-y-4">
              <Stat label="Streak" value={session.streak} hint={`Best ${record.bestStreak}`} accent />
              <Stat label="Score" value={session.points} hint={`Best ${record.bestScore}`} />
              <Stat
                label="Accuracy"
                value={session.attempts ? formatPercent(session.correct / session.attempts) : '—'}
                hint={`${session.correct} of ${session.attempts}`}
              />
              <Stat
                label="Avg time"
                value={session.attempts ? formatDuration(session.totalMs / session.attempts) : '—'}
                hint={session.skipped ? `${session.skipped} skipped` : undefined}
              />
            </div>

            <StreakTrack streak={session.streak} />

            <p className="numeric mt-3 border-t border-line-soft pt-3 text-[10px] uppercase tracking-[0.14em] text-faint">
              Lifetime {record.rounds} rounds ·{' '}
              {record.rounds ? formatPercent(record.correct / record.rounds) : '0%'} correct
            </p>
          </Panel>

          {outcome && round && (
            <Panel className="animate-[riseIn_420ms_var(--ease-out-expo)_both]">
              <SectionTitle
                eyebrow="Answer"
                actions={
                  <Link
                    to={`/pokemon/${round.entry.name}`}
                    className="numeric text-[11px] font-semibold uppercase tracking-[0.12em] text-accent hover:underline"
                  >
                    Open →
                  </Link>
                }
              >
                {round.entry.label}
              </SectionTitle>
              <PokemonCard entry={round.entry} eager />
              <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3">
                <Stat label="Dex" value={formatDex(round.entry.dex)} />
                <Stat label="Generation" value={dex.nameOf('generations', round.entry.generation)} />
                <Stat label="BST" value={round.entry.bst} />
                <Stat label="Genus" value={round.entry.genus ?? '—'} />
              </div>
            </Panel>
          )}

          <Panel>
            <SectionTitle eyebrow={`${pool.length} candidates`}>Difficulty</SectionTitle>
            <div className="space-y-4">
              <Field label="Generation">
                <Select
                  value={generation}
                  onChange={(event) => setGeneration(Number(event.target.value))}
                  className="w-full"
                  aria-label="Generation filter"
                >
                  <option value={0}>All generations</option>
                  {dex.meta.generations.map((entry) => (
                    <option key={entry.id} value={entry.id}>
                      {entry.label}
                    </option>
                  ))}
                </Select>
              </Field>

              <Field label="Roster">
                <Segmented
                  options={CATEGORY_OPTIONS}
                  value={category}
                  onChange={setCategory}
                  size="sm"
                  className="w-full justify-between"
                />
              </Field>

              <div className="border-t border-line-soft pt-1">
                <Toggle
                  checked={includeForms}
                  onChange={setIncludeForms}
                  label="Alternate forms"
                  hint={
                    mode === 'dex'
                      ? 'Ignored here — forms share their species dex entry.'
                      : 'Megas, Gigantamax and regional variants.'
                  }
                />
                <Toggle
                  checked={sound}
                  onChange={setSound}
                  label="Sound"
                  hint="Autoplay cries and reveals."
                />
              </div>
            </div>
          </Panel>

          <Panel className="lg:hidden">
            <SectionTitle eyebrow={`${history.length} recorded`}>Round history</SectionTitle>
            <RoundHistory items={history} />
          </Panel>
        </div>
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div role="group" aria-label={label}>
      <span className="numeric mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.16em] text-faint">
        {label}
      </span>
      {children}
    </div>
  )
}

function StreakTrack({ streak }: { streak: number }) {
  const filled = Math.min(streak, 12)
  return (
    <div className="mt-4 flex items-center gap-1" aria-hidden>
      {Array.from({ length: 12 }, (_, index) => (
        <span
          key={index}
          className={cx(
            'h-1.5 flex-1 rounded-full transition-colors duration-300',
            index < filled ? 'bg-accent' : 'bg-raised',
          )}
        />
      ))}
    </div>
  )
}
