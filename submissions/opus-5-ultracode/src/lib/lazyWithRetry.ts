import { lazy, type ComponentType } from 'react'

const RELOAD_FLAG = 'pokedex:chunk-reload'

/**
 * Route chunks are content-hashed, so a browser holding an HTML shell from a previous deploy asks
 * for filenames that no longer exist. Workers' single-page-application fallback answers those with
 * index.html, which the module loader rejects on MIME type — the app would white-screen.
 *
 * One forced reload pulls the current shell and its matching hashes. The session flag makes it a
 * single attempt so a genuinely broken build surfaces its error instead of looping.
 */
export function lazyWithRetry<T extends ComponentType<unknown>>(factory: () => Promise<{ default: T }>) {
  return lazy(async () => {
    try {
      const module = await factory()
      sessionStorage.removeItem(RELOAD_FLAG)
      return module
    } catch (error) {
      if (sessionStorage.getItem(RELOAD_FLAG)) throw error
      sessionStorage.setItem(RELOAD_FLAG, '1')
      window.location.reload()
      return new Promise<{ default: T }>(() => {})
    }
  })
}
