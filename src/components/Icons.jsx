const base = { width: 18, height: 18, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round' }

export const ArrowUpIcon = (props) => (
  <svg {...base} {...props}><path d="M12 19V5" /><path d="m5 12 7-7 7 7" /></svg>
)

export const ChevronIcon = (props) => (
  <svg {...base} {...props}><path d="m6 9 6 6 6-6" /></svg>
)

export const SparkIcon = (props) => (
  <svg {...base} {...props}><path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M6 18l2.5-2.5M15.5 8.5 18 6" /></svg>
)

export const CloseIcon = (props) => (
  <svg {...base} {...props}><path d="M18 6 6 18M6 6l12 12" /></svg>
)

export const ResetIcon = (props) => (
  <svg {...base} {...props}><path d="M3 12a9 9 0 1 0 3-6.7L3 8" /><path d="M3 3v5h5" /></svg>
)

export const CheckIcon = (props) => (
  <svg {...base} {...props}><path d="m5 12 5 5L20 7" /></svg>
)

export const LockIcon = (props) => (
  <svg {...base} {...props}><rect x="4" y="11" width="16" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></svg>
)
