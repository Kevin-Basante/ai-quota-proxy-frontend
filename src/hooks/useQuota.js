import { useCallback, useEffect, useRef, useState } from 'react'
import { api } from '../api/client.js'

const POLL_INTERVAL_MS = 5000

export function useQuota(userId, now) {
  const [status, setStatus] = useState(null)
  const [history, setHistory] = useState(null)
  const [rateResetAt, setRateResetAt] = useState(null)
  const [error, setError] = useState(null)
  const activeUser = useRef(userId)

  const applyStatus = useCallback((next) => {
    if (!next || next.userId !== activeUser.current) return
    setStatus(next)
    setRateResetAt(Date.now() + next.secondsUntilRateReset * 1000)
  }, [])

  const refreshStatus = useCallback(async () => {
    if (!activeUser.current) return
    try {
      applyStatus(await api.status(activeUser.current))
      setError(null)
    } catch (exception) {
      setError(exception)
    }
  }, [applyStatus])

  const refreshHistory = useCallback(async () => {
    if (!activeUser.current) return
    try {
      const next = await api.history(activeUser.current)
      if (next.userId === activeUser.current) setHistory(next)
    } catch (exception) {
      setError(exception)
    }
  }, [])

  useEffect(() => {
    activeUser.current = userId
    setStatus(null)
    setHistory(null)
    if (!userId) return undefined
    refreshStatus()
    refreshHistory()
    const id = setInterval(refreshStatus, POLL_INTERVAL_MS)
    return () => clearInterval(id)
  }, [userId, refreshStatus, refreshHistory])

  const secondsToRateReset = rateResetAt ? Math.max(0, (rateResetAt - now) / 1000) : 60

  useEffect(() => {
    if (rateResetAt && now >= rateResetAt + 400) {
      setRateResetAt(null)
      refreshStatus()
    }
  }, [now, rateResetAt, refreshStatus])

  return { status, history, error, applyStatus, refreshStatus, refreshHistory, secondsToRateReset }
}
