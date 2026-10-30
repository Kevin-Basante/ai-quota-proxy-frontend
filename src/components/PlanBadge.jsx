const LABELS = { FREE: 'Free', PRO: 'Pro', ENTERPRISE: 'Enterprise' }

export default function PlanBadge({ plan, size = 'md' }) {
  if (!plan) return <span className={`plan-badge plan-badge--${size} plan-badge--loading`}>···</span>
  return (
    <span className={`plan-badge plan-badge--${size} plan-badge--${plan.toLowerCase()}`}>
      <span className="plan-badge__gem" aria-hidden="true" />
      {LABELS[plan]}
    </span>
  )
}
