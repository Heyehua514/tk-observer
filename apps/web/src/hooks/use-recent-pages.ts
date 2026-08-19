import { useSyncExternalStore, useEffect } from 'react'
import { useLocation } from '@tanstack/react-router'

const STORAGE_KEY = 'tk-observer:recent-pages'
const MAX_RECENT = 5

const trackedPrefixes = [
  '/overview',
  '/market',
  '/business',
  '/design',
  '/editing',
] as const
type RecentPath = (typeof trackedPrefixes)[number]

function currentTrackedPath(pathname: string): RecentPath | null {
  return (
    trackedPrefixes.find((p) => pathname === p) ??
    trackedPrefixes.find((p) => pathname.startsWith(p + '/')) ??
    null
  )
}

function readRecent(): RecentPath[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY)
    const parsed: unknown = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed)
      ? parsed.filter(
          (item): item is RecentPath =>
            typeof item === 'string' &&
            (trackedPrefixes as readonly string[]).includes(item)
        )
      : []
  } catch {
    return []
  }
}
const listeners = new Set<() => void>()
let cache: RecentPath[] = readRecent()

function getSnapshot(): RecentPath[] {
  return cache
}

function updateCache(value: RecentPath[]) {
  cache = value
  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(value))
  } catch {
    /* 存储不可用则仅内存 */
  }
  listeners.forEach((listener) => listener())
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function useRecentPages() {
  const location = useLocation()
  const recent = useSyncExternalStore(subscribe, getSnapshot, getSnapshot)

  useEffect(() => {
    const tracked = currentTrackedPath(location.pathname)
    if (!tracked) return
    const next = [tracked, ...getSnapshot().filter((p) => p !== tracked)].slice(
      0,
      MAX_RECENT
    )
    if (next.join(',') !== getSnapshot().join(',')) {
      updateCache(next)
    }
  }, [location.pathname])

  return recent.filter((path) => path !== location.pathname)
}
