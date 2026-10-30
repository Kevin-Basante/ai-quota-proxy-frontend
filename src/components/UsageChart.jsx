import { useState } from 'react'
import { formatCompact, formatNumber } from '../utils/format.js'

const WIDTH = 320
const HEIGHT = 150
const BASELINE = 124
const TOP = 18

export default function UsageChart({ history }) {
  const [hovered, setHovered] = useState(null)
  if (!history) return <section className="panel panel--history is-loading" aria-busy="true" />
  const days = history.days
  const peak = Math.max(1, ...days.map((day) => day.tokens))
  const slot = WIDTH / days.length
  const barWidth = slot * 0.46
  const active = hovered === null ? days.length - 1 : hovered
  const focus = days[active]

  return (
    <section className="panel panel--history">
      <header className="panel__header">
        <span className="eyebrow">Last 7 days</span>
        <span className="panel__meta">{formatCompact(history.totalTokens)} tokens · {history.totalRequests} req</span>
      </header>
      <div className="history__focus">
        <span className="history__focus-value">{formatNumber(focus.tokens)}</span>
        <span className="history__focus-label">
          tokens on {new Date(`${focus.date}T00:00:00`).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })} · {focus.requests} {focus.requests === 1 ? 'request' : 'requests'}
        </span>
      </div>
      <svg className="history__chart" viewBox={`0 0 ${WIDTH} ${HEIGHT}`} role="img" aria-label="Daily token usage for the last seven days" onMouseLeave={() => setHovered(null)}>
        {[0.5, 1].map((ratio) => (
          <line key={ratio} className="history__grid" x1="0" x2={WIDTH} y1={BASELINE - (BASELINE - TOP) * ratio} y2={BASELINE - (BASELINE - TOP) * ratio} />
        ))}
        {days.map((day, index) => {
          const height = Math.max(day.tokens > 0 ? 3 : 1.5, ((BASELINE - TOP) * day.tokens) / peak)
          const x = index * slot + (slot - barWidth) / 2
          const isToday = index === days.length - 1
          return (
            <g key={day.date} onMouseEnter={() => setHovered(index)} className={`history__bar-group ${index === active ? 'is-active' : ''} ${isToday ? 'is-today' : ''}`}>
              <rect className="history__hit" x={index * slot} y="0" width={slot} height={HEIGHT} />
              <rect className="history__bar" x={x} y={BASELINE - height} width={barWidth} height={height} rx="3" style={{ '--i': index }} />
              <text className="history__day" x={x + barWidth / 2} y={HEIGHT - 6} textAnchor="middle">
                {isToday ? 'Today' : day.dayLabel}
              </text>
            </g>
          )
        })}
        <line className="history__baseline" x1="0" x2={WIDTH} y1={BASELINE} y2={BASELINE} />
      </svg>
    </section>
  )
}
