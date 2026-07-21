import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { artUrl, getIndex, getPokemon } from '../../lib/api'
import { useAsync, useDocTitle } from '../../lib/hooks'
import type { SpeciesIndex } from '../../lib/types'
import { dexNo, GEN_ROMAN } from '../../lib/format'
import TypeBadge from '../../components/TypeBadge'
import Loader from '../../components/Loader'
import EmptyState from '../../components/EmptyState'
import './quiz.css'

type Difficulty = 'normal' | 'hard'

interface Round {
  answer: SpeciesIndex
  choices: SpeciesIndex[]
}

interface Outcome {
  correct: boolean
  gaveUp: boolean
  pickedId: number | null
}

const BEST_KEY = 'pdx-quiz-best'
const GEN_IDS = [1, 2, 3, 4, 5, 6, 7, 8, 9]

function loadBest(): number {
  try {
    const n = Number(localStorage.getItem(BEST_KEY))
    return Number.isFinite(n) && n > 0 ? Math.floor(n) : 0
  } catch {
    return 0
  }
}

function saveBest(n: number) {
  try {
    localStorage.setItem(BEST_KEY, String(n))
  } catch {
    void 0
  }
}

function normalizeGuess(s: string): string {
  return s
    .toLowerCase()
    .replace(/♀/g, 'f')
    .replace(/♂/g, 'm')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '')
}

function shuffle<T>(items: T[]): T[] {
  const arr = [...items]
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

function pickDistractors(pool: SpeciesIndex[], answer: SpeciesIndex): SpeciesIndex[] {
  const sameGen = shuffle(pool.filter(s => s.gen === answer.gen && s.id !== answer.id))
  const picked = sameGen.slice(0, 3)
  if (picked.length < 3) {
    const takenIds = new Set([answer.id, ...picked.map(p => p.id)])
    const rest = shuffle(pool.filter(s => !takenIds.has(s.id)))
    picked.push(...rest.slice(0, 3 - picked.length))
  }
  return picked
}

export default function QuizPage() {
  useDocTitle("Who's that Pokémon?")
  const { data: index, error } = useAsync(getIndex, [])

  const [selGens, setSelGens] = useState<number[]>([])
  const [difficulty, setDifficulty] = useState<Difficulty>('normal')
  const [round, setRound] = useState<Round | null>(null)
  const [outcome, setOutcome] = useState<Outcome | null>(null)
  const [guess, setGuess] = useState('')
  const [artLoaded, setArtLoaded] = useState(false)
  const [artBroken, setArtBroken] = useState(false)
  const [used, setUsed] = useState<ReadonlySet<number>>(() => new Set<number>())
  const [streak, setStreak] = useState(0)
  const [best, setBest] = useState(loadBest)
  const [session, setSession] = useState({ correct: 0, answered: 0 })

  const audioRef = useRef<HTMLAudioElement | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const artErrsRef = useRef(0)

  const pool = useMemo(() => {
    if (!index) return null
    return selGens.length ? index.filter(s => selGens.includes(s.gen)) : index
  }, [index, selGens])

  const unseen = useMemo(
    () => (pool ? pool.filter(s => !used.has(s.id)).length : 0),
    [pool, used]
  )

  function startRound(skipId?: number) {
    if (!pool || pool.length === 0) return
    let nextUsed = used
    let avail = pool.filter(s => !nextUsed.has(s.id))
    if (avail.length === 0) {
      nextUsed = new Set<number>()
      avail = pool.length > 1 ? pool.filter(s => s.id !== skipId) : pool
      if (avail.length === 0) avail = pool
    }
    const answer = avail[Math.floor(Math.random() * avail.length)]
    const merged = new Set(nextUsed)
    merged.add(answer.id)
    setUsed(merged)
    setRound({ answer, choices: shuffle([answer, ...pickDistractors(pool, answer)]) })
    setOutcome(null)
    setGuess('')
    setArtLoaded(false)
    setArtBroken(false)
  }

  const startRef = useRef(startRound)
  startRef.current = startRound

  useEffect(() => {
    startRef.current()
  }, [pool])

  function settle(correct: boolean, pickedId: number | null) {
    setOutcome({ correct, gaveUp: false, pickedId })
    setSession(s => ({ correct: s.correct + (correct ? 1 : 0), answered: s.answered + 1 }))
    if (correct) {
      const next = streak + 1
      setStreak(next)
      if (next > best) {
        setBest(next)
        saveBest(next)
      }
    } else {
      setStreak(0)
    }
  }

  function pick(choice: SpeciesIndex) {
    if (!round || outcome) return
    settle(choice.id === round.answer.id, choice.id)
  }

  function submitGuess(e: React.FormEvent) {
    e.preventDefault()
    if (!round || outcome) return
    const key = normalizeGuess(guess)
    if (!key) return
    const { answer } = round
    settle(key === normalizeGuess(answer.name) || key === normalizeGuess(answer.dname), null)
  }

  function giveUp() {
    if (!round || outcome) return
    setOutcome({ correct: false, gaveUp: true, pickedId: null })
    setStreak(0)
  }

  function next() {
    startRound(round?.answer.id)
  }

  function onArtError() {
    artErrsRef.current += 1
    if (artErrsRef.current < 4) startRound(round?.answer.id)
    else setArtBroken(true)
  }

  function onArtLoad() {
    artErrsRef.current = 0
    setArtLoaded(true)
  }

  function retryArt() {
    artErrsRef.current = 0
    startRound(round?.answer.id)
  }

  const keyHandlerRef = useRef<(e: KeyboardEvent) => void>(() => undefined)
  keyHandlerRef.current = (e: KeyboardEvent) => {
    if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.altKey) return
    const target = e.target as HTMLElement | null
    const tag = target?.tagName
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return
    if (outcome && e.key === 'Enter') {
      if (target?.closest('a, button')) return
      e.preventDefault()
      next()
      return
    }
    if (!outcome && difficulty === 'normal' && round && e.key >= '1' && e.key <= '4') {
      const choice = round.choices[Number(e.key) - 1]
      if (choice) {
        e.preventDefault()
        pick(choice)
      }
    }
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => keyHandlerRef.current(e)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  useEffect(() => {
    if (!outcome || !round) return
    let cancelled = false
    getPokemon(round.answer.id)
      .then(detail => {
        if (cancelled) return
        const variety = detail.varieties.find(v => v.isDefault) ?? detail.varieties[0]
        if (!variety?.cry) return
        const audio = new Audio(variety.cry)
        audioRef.current = audio
        audio.volume = 0.45
        audio.play().catch(() => undefined)
      })
      .catch(() => undefined)
    return () => {
      cancelled = true
      audioRef.current?.pause()
      audioRef.current = null
    }
  }, [outcome, round])

  useEffect(() => {
    if (difficulty === 'hard' && round && !outcome) inputRef.current?.focus()
  }, [difficulty, round, outcome])

  if (error) {
    return (
      <div className="container page-pad">
        <EmptyState title="Couldn't load the Dex" hint="The species index failed to load. Try refreshing." />
      </div>
    )
  }
  if (!index || !pool || !round) return <Loader />

  const { answer, choices } = round
  const revealed = outcome !== null
  const verdict = !outcome ? null : outcome.correct ? 'good' : outcome.gaveUp ? 'dim' : 'bad'

  return (
    <div className="container page-pad qz-root">
      <div className="qz-head">
        <div className="eyebrow">Field identification drill</div>
        <h1>Who's that Pokémon?</h1>
        <p className="dim qz-lede">
          Name the silhouette. Keys <span className="mono">1–4</span> answer,{' '}
          <span className="mono">Enter</span> advances.
        </p>
      </div>

      <div className="qz-setup card">
        <div className="qz-setup-row" role="group" aria-label="Filter pool by generation">
          <span className="qz-setup-label eyebrow">Gens</span>
          {GEN_IDS.map(g => {
            const on = selGens.includes(g)
            return (
              <button
                key={g}
                type="button"
                className={`chip${on ? ' on' : ''}`}
                aria-pressed={on}
                aria-label={`Generation ${GEN_ROMAN[g]}`}
                onClick={() =>
                  setSelGens(prev => (prev.includes(g) ? prev.filter(x => x !== g) : [...prev, g]))
                }
              >
                {GEN_ROMAN[g]}
              </button>
            )
          })}
          {selGens.length > 0 && (
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setSelGens([])}>
              All gens
            </button>
          )}
        </div>
        <div className="qz-setup-row" role="group" aria-label="Difficulty">
          <span className="qz-setup-label eyebrow">Mode</span>
          <button
            type="button"
            className={`chip${difficulty === 'normal' ? ' on' : ''}`}
            aria-pressed={difficulty === 'normal'}
            onClick={() => setDifficulty('normal')}
          >
            Normal · 4 choices
          </button>
          <button
            type="button"
            className={`chip${difficulty === 'hard' ? ' on' : ''}`}
            aria-pressed={difficulty === 'hard'}
            onClick={() => setDifficulty('hard')}
          >
            Hard · type it
          </button>
          <span className="qz-pool mono dim">
            POOL {pool.length} · UNSEEN {unseen}
          </span>
        </div>
      </div>

      <div className="qz-stage card">
        <div className="qz-board" role="group" aria-label="Scoreboard">
          <div className="qz-cell">
            <span className="qz-cell-label">Streak</span>
            <span className="qz-cell-val">{String(streak).padStart(2, '0')}</span>
          </div>
          <div className="qz-cell">
            <span className="qz-cell-label">Best</span>
            <span className="qz-cell-val">{String(best).padStart(2, '0')}</span>
          </div>
          <div className="qz-cell">
            <span className="qz-cell-label">Session</span>
            <span className="qz-cell-val">
              {session.correct}/{session.answered}
            </span>
          </div>
        </div>

        <div className="qz-spot">
          {artBroken ? (
            <div className="qz-broken">
              <span className="dim">Artwork unavailable</span>
              <button type="button" className="btn btn-sm" onClick={retryArt}>
                Try another
              </button>
            </div>
          ) : (
            <>
              {!artLoaded && <div className="qz-art-skeleton skeleton" aria-hidden="true" />}
              <img
                key={answer.id}
                className={`qz-art${revealed ? ' revealed' : ''}`}
                src={artUrl(answer.id)}
                alt={revealed ? answer.dname : 'Mystery Pokémon silhouette'}
                width={300}
                height={300}
                decoding="async"
                draggable={false}
                onLoad={onArtLoad}
                onError={onArtError}
                style={{ opacity: artLoaded ? 1 : 0 }}
              />
            </>
          )}
        </div>

        <div className="qz-caption">
          {revealed ? (
            <>
              <div className={`qz-verdict mono ${verdict}`}>
                {outcome!.correct ? 'CORRECT' : outcome!.gaveUp ? 'REVEALED' : 'WRONG'}
              </div>
              <Link to={`/pokemon/${answer.id}`} className="qz-name">
                {answer.dname}
              </Link>
              <div className="qz-sub">
                <span className="mono dim">{dexNo(answer.id)}</span>
                {answer.types.map(t => (
                  <TypeBadge key={t} type={t} size="sm" />
                ))}
              </div>
            </>
          ) : (
            <>
              <div className="qz-verdict mono dim">SPECIMEN UNIDENTIFIED</div>
              <div className="qz-name qz-name-hidden" aria-hidden="true">
                ?????
              </div>
              <div className="qz-sub">
                <span className="mono dim">#????</span>
              </div>
            </>
          )}
        </div>

        <p className="visually-hidden" aria-live="polite">
          {outcome
            ? outcome.correct
              ? `Correct! It is ${answer.dname}.`
              : `It was ${answer.dname}.`
            : ''}
        </p>

        {difficulty === 'normal' ? (
          <div className="qz-choices" role="group" aria-label="Answer choices">
            {choices.map((c, i) => {
              const isAnswer = c.id === answer.id
              const isPicked = outcome?.pickedId === c.id
              const state = revealed ? (isAnswer ? ' good' : isPicked ? ' bad' : ' off') : ''
              return (
                <button
                  key={c.id}
                  type="button"
                  className={`qz-choice${state}`}
                  disabled={revealed}
                  onClick={() => pick(c)}
                >
                  <span className="qz-key mono" aria-hidden="true">
                    {i + 1}
                  </span>
                  <span>{c.dname}</span>
                </button>
              )
            })}
          </div>
        ) : (
          <form className="qz-hard" onSubmit={submitGuess}>
            <label className="visually-hidden" htmlFor="qz-guess">
              Your guess
            </label>
            <input
              id="qz-guess"
              ref={inputRef}
              className="input"
              placeholder="Type the species name…"
              autoComplete="off"
              autoCapitalize="off"
              spellCheck={false}
              value={guess}
              disabled={revealed}
              onChange={e => setGuess(e.target.value)}
            />
            <button type="submit" className="btn btn-primary" disabled={revealed || !guess.trim()}>
              Guess
            </button>
          </form>
        )}

        <div className="qz-actions">
          {revealed ? (
            <>
              <button type="button" className="btn btn-primary" onClick={next}>
                Next
              </button>
              <span className="qz-hint mono dim" aria-hidden="true">
                ENTER ↵
              </span>
            </>
          ) : (
            <button type="button" className="btn btn-ghost" onClick={giveUp}>
              Give up
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
