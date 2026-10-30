import { daysUntil, formatCompact, formatDate, formatNumber } from '../utils/format.js'

const SEGMENTS = 32

function tone(percent) {
  if (percent >= 90) return 'critical'
  if (percent >= 70) return 'warning'
  return 'healthy'
}

export default function QuotaMeter({ status, onUpgrade }) {
  if (!status) return <section className="panel panel--quota is-loading" aria-busy="true" />
  const unlimited = status.unlimitedTokens
  const percent = unlimited ? 0 : status.usagePercent
  const filled = Math.round((percent / 100) * SEGMENTS)
  const level = unlimited ? 'unlimited' : tone(percent)
  const remainingDays = daysUntil(status.resetDate)

  return (
    <section className={`panel panel--quota quota--${level}`}>
      <header className="panel__header">
        <span className="eyebrow">Monthly tokens</span>
        <span className="panel__meta">resets {formatDate(status.resetDate)}</span>
      </header>
      <div className="quota__figure">
        {unlimited ? (
          <>
            <span className="quota__big quota__big--infinite">∞</span>
            <span className="quota__label">unmetered · {formatCompact(status.tokensUsed)} used this month</span>
          </>
        ) : (
          <>
            <span className="quota__big">{formatNumber(status.tokensRemaining)}</span>
            <span className="quota__label">tokens left of {formatCompact(status.tokenQuota)}</span>
          </>
        )}
      </div>
      <div
        className="quota__bar"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percent}
        aria-label="Token quota used"
      >
        {Array.from({ length: SEGMENTS }, (_, index) => (
          <span key={index} className={`quota__segment ${index < filled ? 'is-filled' : ''}`} style={{ '--i': index }} />
        ))}
      </div>
      <dl className="quota__stats">
        <div>
          <dt>Used</dt>
          <dd>{formatNumber(status.tokensUsed)}</dd>
        </div>
        <div>
          <dt>Consumed</dt>
          <dd>{unlimited ? '—' : `${percent.toFixed(1)}%`}</dd>
        </div>
        <div>
          <dt>Days left</dt>
          <dd>{remainingDays ?? '—'}</dd>
        </div>
      </dl>
      {!unlimited && status.plan !== 'ENTERPRISE' && (
        <button type="button" className={`quota__upgrade ${percent >= 90 ? 'is-urgent' : ''}`} onClick={onUpgrade}>
          {status.tokensRemaining === 0 ? 'Quota exhausted · upgrade to continue' : 'Upgrade plan'}
        </button>
      )}
    </section>
  )
}
