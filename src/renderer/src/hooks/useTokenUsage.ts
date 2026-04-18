import { loggerService } from '@logger'
import { useCallback, useEffect, useState } from 'react'

const logger = loggerService.withContext('useTokenUsage')

export interface DailyTokenUsage {
  date: string
  input_tokens: number
  output_tokens: number
  total_tokens: number
}

const onUpdateCallbacks = new Set<(usage: DailyTokenUsage) => void>()
let removeIpcListener: (() => void) | null = null

const ensureIpcSubscribed = () => {
  if (!removeIpcListener && window.api.tokenUsage) {
    removeIpcListener = window.api.tokenUsage.onUpdate((usage) => {
      onUpdateCallbacks.forEach((cb) => cb(usage))
    })
  }
}

const cleanupIpcIfEmpty = () => {
  if (onUpdateCallbacks.size === 0 && removeIpcListener) {
    removeIpcListener()
    removeIpcListener = null
  }
}

const getTodayString = (): string => {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
}

export const useTokenUsage = () => {
  const [usage, setUsage] = useState<DailyTokenUsage>({
    date: getTodayString(),
    input_tokens: 0,
    output_tokens: 0,
    total_tokens: 0
  })
  const [loading, setLoading] = useState(true)

  const fetchUsage = useCallback(async () => {
    try {
      if (window.api.tokenUsage) {
        const data = await window.api.tokenUsage.getTodayUsage()
        setUsage(data)
      }
    } catch (error) {
      logger.error('Failed to fetch token usage:', error as Error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void fetchUsage()
  }, [fetchUsage])

  const handleUpdate = useCallback((newUsage: DailyTokenUsage) => {
    setUsage(newUsage)
    setLoading(false)
  }, [])

  useEffect(() => {
    ensureIpcSubscribed()
    onUpdateCallbacks.add(handleUpdate)

    return () => {
      onUpdateCallbacks.delete(handleUpdate)
      cleanupIpcIfEmpty()
    }
  }, [handleUpdate])

  useEffect(() => {
    const checkDateChange = () => {
      const today = getTodayString()
      if (usage.date !== today) {
        logger.info('Date changed, resetting token usage')
        void fetchUsage()
      }
    }

    const interval = setInterval(checkDateChange, 60000)

    return () => clearInterval(interval)
  }, [usage.date, fetchUsage])

  return {
    usage,
    loading,
    refresh: fetchUsage
  }
}
