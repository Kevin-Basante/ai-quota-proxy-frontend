const integer = new Intl.NumberFormat('en-US')
const compact = new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 })

export const formatNumber = (value) => integer.format(value ?? 0)
export const formatCompact = (value) => compact.format(value ?? 0)

export function formatDate(isoDate) {
  if (!isoDate) return '—'
  const [year, month, day] = isoDate.split('-').map(Number)
  return new Date(year, month - 1, day).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export function formatClock(seconds) {
  const safe = Math.min(60, Math.max(0, Math.ceil(seconds)))
  return safe === 60 ? '1:00' : `0:${String(safe).padStart(2, '0')}`
}

export function formatTime(date) {
  return new Date(date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
}

export function daysUntil(isoDate) {
  if (!isoDate) return null
  const [year, month, day] = isoDate.split('-').map(Number)
  const target = new Date(year, month - 1, day)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return Math.max(0, Math.round((target - today) / 86400000))
}
