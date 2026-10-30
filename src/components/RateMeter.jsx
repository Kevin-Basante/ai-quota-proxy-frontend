import { formatClock } from '../utils/format.js'

const RING_RADIUS = 34
const RING_LENGTH = 2 * Math.PI * RING_RADIUS

export default function RateMeter({ status, secondsToReset, locked }) {
  if (!status) return <section className="panel panel--rate is-loading" aria-busy="true" />
  const limit = status.requestsPerMinuteLimit
  const used = status.requestsThisMinute
  const unlimited = status.unlimitedRequests
  const progress = Math.min(1, Math.max(0, secondsToReset / 60))

  return (
    <section className={`panel panel--rate ${locked ? 'rate--locked' : ''}`}>
      <header className="panel__header">
        <span className="eyebrow">Requests this minute</span>
        <span className="panel__meta">{unlimited ? 'no ceiling' : `${limit} / min`}</span>
      </header>
      <div className="rate__body">
        <div className="rate__dial">
          <svg viewBox="0 0 80 80" aria-hidden="true">
            <circle className="rate__dial-track" cx="40" cy="40" r={RING_RADIUS} />
            <circle
              className="rate__dial-progress"
              cx="40"
              cy="40"
              r={RING_RADIUS}
              strokeDasharray={RING_LENGTH}
              strokeDashoffset={RING_LENGTH * (1 - progress)}
            />
          </svg>
          <span className="rate__dial-time">{formatClock(secondsToReset)}</span>
          <span className="rate__dial-label">until reset</span>
        </div>
        <div className="rate__count">
          <span className="rate__used">{used}</span>
          <span className="rate__limit">{unlimited ? 'requests · unlimited' : `of ${limit} requests`}</span>
        </div>
      </div>
      {!unlimited && (
        <div className={`rate__cells rate__cells--${limit > 20 ? 'dense' : 'sparse'}`} aria-hidden="true">
          {Array.from({ length: limit }, (_, index) => (
            <span key={index} className={`rate__cell ${index < used ? 'is-used' : ''}`} />
          ))}
        </div>
      )}
      {locked && <p className="rate__notice">Rate limit reached. Sending unlocks when the window resets.</p>}
    </section>
  )
}
