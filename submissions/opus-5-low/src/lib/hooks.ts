import { useCallback, useEffect, useRef, useState } from 'react'

export function useAsync<T>(fn: () => Promise<T>, deps: unknown[]) {
  const [state, setState] = useState<{ data: T | null; loading: boolean; error: Error | null }>({
    data: null,
    loading: true,
    error: null,
  })
  const ref = useRef(0)
  useEffect(() => {
    const token = ++ref.current
    setState((s) => ({ ...s, loading: true, error: null }))
    fn().then(
      (data) => { if (ref.current === token) setState({ data, loading: false, error: null }) },
      (error) => { if (ref.current === token) setState({ data: null, loading: false, error }) },
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)
  return state
}

export function useLocalStorage<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(key)
      return raw ? (JSON.parse(raw) as T) : initial
    } catch {
      return initial
    }
  })
  const set = useCallback(
    (v: T | ((prev: T) => T)) => {
      setValue((prev) => {
        const next = typeof v === 'function' ? (v as (p: T) => T)(prev) : v
        try { localStorage.setItem(key, JSON.stringify(next)) } catch { /* quota */ }
        return next
      })
    },
    [key],
  )
  return [value, set] as const
}

export function useDebounced<T>(value: T, ms = 180) {
  const [v, setV] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms)
    return () => clearTimeout(t)
  }, [value, ms])
  return v
}

export function useInfinite(total: number, step = 60) {
  const [count, setCount] = useState(step)
  const sentinel = useRef<HTMLDivElement | null>(null)
  useEffect(() => { setCount(step) }, [total, step])
  useEffect(() => {
    const el = sentinel.current
    if (!el) return
    const io = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) setCount((c) => Math.min(total, c + step))
    }, { rootMargin: '600px' })
    io.observe(el)
    return () => io.disconnect()
  }, [total, step])
  return { count: Math.min(count, total), sentinel }
}
