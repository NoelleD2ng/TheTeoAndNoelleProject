'use client'

import { useState, useEffect, useCallback } from 'react'

export function useLocalStorage<T>(key: string, initialValue: T) {
  const [hydrated, setHydrated] = useState(false)
  const [value, setValue] = useState<T>(initialValue)

  useEffect(() => {
    setHydrated(true)
    try {
      const stored = window.localStorage.getItem(key)
      if (stored !== null) setValue(JSON.parse(stored))
    } catch {}
  }, [key])

  const set = useCallback(
    (newValue: T | ((prev: T) => T)) => {
      setValue(prev => {
        const next =
          typeof newValue === 'function'
            ? (newValue as (v: T) => T)(prev)
            : newValue
        try {
          window.localStorage.setItem(key, JSON.stringify(next))
        } catch {}
        return next
      })
    },
    [key]
  )

  return [value, set, hydrated] as const
}
