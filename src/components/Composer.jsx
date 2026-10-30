import { useEffect, useRef } from 'react'
import { estimateRequest } from '../utils/tokens.js'
import { formatNumber } from '../utils/format.js'
import { ArrowUpIcon, LockIcon } from './Icons.jsx'

const MAX_LENGTH = 4000

export default function Composer({ value, onChange, onSubmit, sending, lockedSeconds, tokensRemaining }) {
  const textareaRef = useRef(null)
  const estimate = estimateRequest(value)
  const locked = lockedSeconds > 0
  const exceedsBudget = tokensRemaining !== null && tokensRemaining !== undefined && estimate.total > tokensRemaining
  const disabled = sending || locked || !value.trim()

  useEffect(() => {
    const element = textareaRef.current
    if (!element) return
    element.style.height = 'auto'
    element.style.height = `${Math.min(element.scrollHeight, 180)}px`
  }, [value])

  const submit = (event) => {
    event.preventDefault()
    if (!disabled) onSubmit()
  }

  return (
    <form className={`composer ${locked ? 'composer--locked' : ''}`} onSubmit={submit}>
      <textarea
        ref={textareaRef}
        className="composer__input"
        rows={1}
        maxLength={MAX_LENGTH}
        placeholder={locked ? 'The gate is closed for a moment…' : 'Ask the model anything…'}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter' && !event.shiftKey) submit(event)
        }}
      />
      <div className="composer__footer">
        <div className={`estimator ${exceedsBudget ? 'estimator--over' : ''}`} aria-live="polite">
          <span className="estimator__chip">
            ≈ <strong>{formatNumber(estimate.prompt)}</strong> prompt
          </span>
          <span className="estimator__plus">+</span>
          <span className="estimator__chip">
            ~<strong>{formatNumber(estimate.completion)}</strong> reply
          </span>
          <span className="estimator__equals">=</span>
          <span className="estimator__chip estimator__chip--total">
            <strong>{formatNumber(estimate.total)}</strong> tokens
          </span>
          {exceedsBudget && <span className="estimator__warning">exceeds your remaining quota</span>}
        </div>
        <span className="composer__counter">{value.length}/{MAX_LENGTH}</span>
        <button type="submit" className="composer__send" disabled={disabled} aria-label={locked ? `Locked for ${Math.ceil(lockedSeconds)} seconds` : 'Send prompt'}>
          {locked ? (
            <span className="composer__countdown">
              <LockIcon width={15} height={15} />
              {Math.ceil(lockedSeconds)}s
            </span>
          ) : sending ? (
            <span className="composer__spinner" />
          ) : (
            <ArrowUpIcon />
          )}
        </button>
      </div>
    </form>
  )
}
