import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'

export function useDocTitle(title: string | null) {
  useEffect(() => {
    if (title) document.title = `${title} · Pokédex`
    return () => {
      document.title = 'Pokédex — Fable-5 Ultracode'
    }
  }, [title])
}

export function useDebounced<T>(value: T, delay = 150): T {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(t)
  }, [value, delay])
  return debounced
}

export function useSearchParamText(key: string, delay = 200): [string, (v: string) => void] {
  const [params, setParams] = useSearchParams()
  const urlValue = params.get(key) ?? ''
  const [text, setText] = useState(urlValue)
  const pushed = useRef(urlValue)
  useEffect(() => {
    if (urlValue !== pushed.current) {
      pushed.current = urlValue
      setText(urlValue)
    }
  }, [urlValue])
  useEffect(() => {
    if (text === pushed.current) return
    const t = setTimeout(() => {
      pushed.current = text
      setParams(
        prev => {
          const next = new URLSearchParams(prev)
          if (text) next.set(key, text)
          else next.delete(key)
          return next
        },
        { replace: true }
      )
    }, delay)
    return () => clearTimeout(t)
  }, [text, key, delay, setParams])
  return [text, setText]
}

export function useAsync<T>(fn: () => Promise<T>, deps: unknown[]): {
  data: T | null
  error: Error | null
  loading: boolean
} {
  const [state, setState] = useState<{ data: T | null; error: Error | null; loading: boolean }>({
    data: null,
    error: null,
    loading: true
  })
  const fnRef = useRef(fn)
  fnRef.current = fn
  useEffect(() => {
    let alive = true
    setState(s => ({ ...s, loading: true, error: null }))
    fnRef.current().then(
      data => alive && setState({ data, error: null, loading: false }),
      error => alive && setState({ data: null, error, loading: false })
    )
    return () => {
      alive = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)
  return state
}
