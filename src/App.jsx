import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { api } from './api/client.js'
import { useNow } from './hooks/useNow.js'
import { useQuota } from './hooks/useQuota.js'
import ChatPanel from './components/ChatPanel.jsx'
import Composer from './components/Composer.jsx'
import PlanBadge from './components/PlanBadge.jsx'
import ProxyChain from './components/ProxyChain.jsx'
import QuotaMeter from './components/QuotaMeter.jsx'
import RateMeter from './components/RateMeter.jsx'
import UpgradeModal from './components/UpgradeModal.jsx'
import UsageChart from './components/UsageChart.jsx'
import UserSwitcher from './components/UserSwitcher.jsx'
import WakeScreen from './components/WakeScreen.jsx'
import { ResetIcon } from './components/Icons.jsx'

const STORAGE_KEY = 'tollgate.user'

function readStoredUser() {
  try {
    return localStorage.getItem(STORAGE_KEY)
  } catch {
    return null
  }
}

function storeUser(userId) {
  try {
    localStorage.setItem(STORAGE_KEY, userId)
  } catch {
    return
  }
}

let sequence = 0
const nextId = () => `m${Date.now()}-${sequence++}`

export default function App() {
  const now = useNow(250)
  const [ready, setReady] = useState(false)
  const [wakeAttempts, setWakeAttempts] = useState(1)
  const [users, setUsers] = useState([])
  const [plans, setPlans] = useState([])
  const [userId, setUserId] = useState(readStoredUser)
  const [conversations, setConversations] = useState({})
  const [draft, setDraft] = useState('')
  const [sending, setSending] = useState(false)
  const [phase, setPhase] = useState('idle')
  const [runId, setRunId] = useState(0)
  const [lockedUntil, setLockedUntil] = useState({})
  const [modal, setModal] = useState({ open: false, reason: null })
  const [toast, setToast] = useState(null)
  const toastTimer = useRef(null)

  const { status, history, applyStatus, refreshStatus, refreshHistory, secondsToRateReset } = useQuota(ready ? userId : null, now)

  const showToast = useCallback((text, tone = 'neutral') => {
    clearTimeout(toastTimer.current)
    setToast({ text, tone })
    toastTimer.current = setTimeout(() => setToast(null), 4200)
  }, [])

  const loadDirectory = useCallback(async () => {
    const [userList, planList] = await Promise.all([api.users(), api.plans()])
    setUsers(userList)
    setPlans(planList)
    setUserId((current) => (userList.some((user) => user.id === current) ? current : userList[0]?.id ?? null))
  }, [])

  useEffect(() => {
    let cancelled = false
    let attempt = 1
    const boot = async () => {
      while (!cancelled) {
        try {
          await api.health()
          await loadDirectory()
          if (!cancelled) setReady(true)
          return
        } catch {
          attempt += 1
          if (!cancelled) setWakeAttempts(attempt)
          await new Promise((resolve) => setTimeout(resolve, 3000))
        }
      }
    }
    boot()
    return () => {
      cancelled = true
    }
  }, [loadDirectory])

  useEffect(() => {
    if (userId) storeUser(userId)
    setPhase('idle')
  }, [userId])

  const currentUser = users.find((user) => user.id === userId)
  const messages = conversations[userId] ?? []

  const serverLockSeconds = lockedUntil[userId] ? Math.max(0, (lockedUntil[userId] - now) / 1000) : 0
  const windowFull = status && !status.unlimitedRequests && status.requestsThisMinute >= status.requestsPerMinuteLimit
  const lockSeconds = Math.max(serverLockSeconds, windowFull ? secondsToRateReset : 0)

  const appendMessages = useCallback((targetUser, update) => {
    setConversations((previous) => ({ ...previous, [targetUser]: update(previous[targetUser] ?? []) }))
  }, [])

  const send = useCallback(async (prompt) => {
    const text = prompt.trim()
    if (!text || sending || !userId) return
    const targetUser = userId
    const pendingId = nextId()
    setDraft('')
    setSending(true)
    setPhase('running')
    setRunId((value) => value + 1)
    appendMessages(targetUser, (list) => [
      ...list,
      { id: nextId(), kind: 'user', text, at: Date.now() },
      { id: pendingId, kind: 'pending' },
    ])
    try {
      const result = await api.generate(targetUser, text)
      appendMessages(targetUser, (list) => list.map((message) => (message.id === pendingId ? { id: pendingId, kind: 'ai', response: result.response, at: Date.now() } : message)))
      applyStatus(result.quota)
      setPhase('passed')
      refreshHistory()
    } catch (exception) {
      let blocked
      if (exception.status === 429) {
        const seconds = exception.retryAfter ?? 60
        setLockedUntil((previous) => ({ ...previous, [targetUser]: Date.now() + seconds * 1000 }))
        setPhase('rate-blocked')
        blocked = { code: 429, title: 'Too many requests', text: `RateLimitProxyService closed the gate. Retry after ${seconds} seconds.` }
      } else if (exception.status === 402) {
        setPhase('quota-blocked')
        setModal({ open: true, reason: 'quota' })
        blocked = { code: 402, title: 'Payment required', text: 'QuotaProxyService found no tokens left in your monthly budget.' }
      } else {
        setPhase('failed')
        blocked = { code: exception.status || 'ERR', title: 'Request failed', text: exception.message }
      }
      appendMessages(targetUser, (list) => list.map((message) => (message.id === pendingId ? { id: pendingId, kind: 'blocked', ...blocked } : message)))
      refreshStatus()
    } finally {
      setSending(false)
    }
  }, [sending, userId, appendMessages, applyStatus, refreshHistory, refreshStatus])

  const handleUpgraded = useCallback((receipt) => {
    applyStatus(receipt.quota)
    setUsers((list) => list.map((user) => (user.id === receipt.quota.userId ? { ...user, plan: receipt.newPlan } : user)))
    setPhase('idle')
    showToast(`Plan upgraded to ${receipt.newPlan}. The proxies already know.`, 'success')
  }, [applyStatus, showToast])

  const resetDemo = useCallback(async () => {
    try {
      const userList = await api.resetDemo()
      setUsers(userList)
      setConversations({})
      setLockedUntil({})
      setPhase('idle')
      await Promise.all([refreshStatus(), refreshHistory()])
      showToast('Demo data restored to its initial state.')
    } catch (exception) {
      showToast(exception.message, 'danger')
    }
  }, [refreshHistory, refreshStatus, showToast])

  const tokensRemaining = useMemo(() => (status && !status.unlimitedTokens ? status.tokensRemaining : null), [status])

  if (!ready) return <WakeScreen attempts={wakeAttempts} apiUrl={api.baseUrl} />

  return (
    <div className={`app app--${status?.plan?.toLowerCase() ?? 'free'}`}>
      <header className="topbar">
        <div className="brand">
          <span className="brand__mark" aria-hidden="true">
            <svg viewBox="0 0 32 32"><path d="M8 23V12a8 8 0 0 1 16 0v11" /><rect x="6" y="21" width="20" height="3" rx="1.5" /><circle cx="16" cy="13" r="2.6" /></svg>
          </span>
          <div>
            <span className="brand__name">Tollgate</span>
            <span className="brand__tagline">AI consumption behind a proxy chain</span>
          </div>
        </div>
        <div className="topbar__actions">
          <PlanBadge plan={status?.plan} />
          <UserSwitcher users={users} currentUserId={userId} onSelect={setUserId} />
          <button type="button" className="icon-button" onClick={resetDemo} title="Restore demo data" aria-label="Restore demo data">
            <ResetIcon />
          </button>
        </div>
      </header>

      <main className="layout">
        <section className="workspace">
          <ProxyChain phase={phase} runId={runId} />
          <ChatPanel messages={messages} userName={currentUser?.displayName} onSuggestion={send} />
          <Composer
            value={draft}
            onChange={setDraft}
            onSubmit={() => send(draft)}
            sending={sending}
            lockedSeconds={lockSeconds}
            tokensRemaining={tokensRemaining}
          />
        </section>

        <aside className="rail">
          <QuotaMeter status={status} onUpgrade={() => setModal({ open: true, reason: 'manual' })} />
          <RateMeter status={status} secondsToReset={secondsToRateReset} locked={lockSeconds > 0} />
          <UsageChart history={history} />
        </aside>
      </main>

      <UpgradeModal
        open={modal.open}
        reason={modal.reason}
        status={status}
        plans={plans}
        onClose={() => setModal({ open: false, reason: null })}
        onUpgraded={handleUpgraded}
      />

      {toast && <div className={`toast toast--${toast.tone}`} role="status">{toast.text}</div>}
    </div>
  )
}
