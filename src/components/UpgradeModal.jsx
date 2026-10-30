import { useEffect, useMemo, useState } from 'react'
import { api } from '../api/client.js'
import { formatCompact, formatNumber } from '../utils/format.js'
import PlanBadge from './PlanBadge.jsx'
import { CheckIcon, CloseIcon, LockIcon } from './Icons.jsx'

const TIER = { FREE: 0, PRO: 1, ENTERPRISE: 2 }
const PROCESSING_STEPS = ['Authorizing card', 'Charging the simulated bank', 'Swapping your proxy limits']

function groupCardNumber(value) {
  return value.replace(/\D/g, '').slice(0, 19).replace(/(\d{4})(?=\d)/g, '$1 ')
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export default function UpgradeModal({ open, reason, status, plans, onClose, onUpgraded }) {
  const currentPlan = status?.plan
  const options = useMemo(() => plans.filter((plan) => TIER[plan.plan] > TIER[currentPlan ?? 'FREE']), [plans, currentPlan])
  const [selected, setSelected] = useState('PRO')
  const [step, setStep] = useState('choose')
  const [cardHolder, setCardHolder] = useState('')
  const [cardNumber, setCardNumber] = useState('')
  const [expiry, setExpiry] = useState('')
  const [cvc, setCvc] = useState('')
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState(null)
  const [receipt, setReceipt] = useState(null)

  useEffect(() => {
    if (!open) return
    setStep('choose')
    setSelected(options[0]?.plan ?? 'PRO')
    setError(null)
    setReceipt(null)
    setProgress(0)
  }, [open])

  useEffect(() => {
    if (!open) return undefined
    const onKey = (event) => {
      if (event.key === 'Escape' && step !== 'processing') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, step, onClose])

  if (!open) return null

  const selectedPlan = plans.find((plan) => plan.plan === selected)
  const digits = cardNumber.replace(/\D/g, '')
  const canPay = cardHolder.trim().length > 1 && digits.length >= 13 && /^\d{2}\/\d{2}$/.test(expiry) && cvc.length >= 3

  const pay = async (event) => {
    event.preventDefault()
    if (!canPay) return
    setStep('processing')
    setError(null)
    try {
      setProgress(1)
      await wait(700)
      setProgress(2)
      const [result] = await Promise.all([
        api.upgrade(status.userId, { targetPlan: selected, cardHolder: cardHolder.trim(), cardNumber: digits }),
        wait(800),
      ])
      setProgress(3)
      await wait(600)
      setReceipt(result)
      setStep('done')
      onUpgraded(result)
    } catch (exception) {
      setError(exception.message)
      setStep('pay')
    }
  }

  return (
    <div className="modal" role="dialog" aria-modal="true" aria-labelledby="upgrade-title">
      <div className="modal__backdrop" onClick={() => step !== 'processing' && onClose()} />
      <div className="modal__sheet">
        <button type="button" className="modal__close" onClick={onClose} disabled={step === 'processing'} aria-label="Close">
          <CloseIcon />
        </button>

        {step === 'choose' && (
          <>
            <p className="eyebrow">{reason === 'quota' ? '402 · Payment required' : 'Plans'}</p>
            <h2 id="upgrade-title">{reason === 'quota' ? 'Your monthly tokens ran out.' : 'Raise the gate.'}</h2>
            <p className="modal__lede">
              {reason === 'quota'
                ? `The quota proxy stopped your last request after ${formatNumber(status?.tokensUsed)} tokens. Upgrade to keep the conversation going.`
                : 'Pick a plan with a higher ceiling. The proxies read your new limits on the very next request.'}
            </p>
            <div className="plans">
              {options.map((plan) => (
                <button
                  type="button"
                  key={plan.plan}
                  className={`plan-card plan-card--${plan.plan.toLowerCase()} ${selected === plan.plan ? 'is-selected' : ''}`}
                  onClick={() => setSelected(plan.plan)}
                >
                  <PlanBadge plan={plan.plan} size="sm" />
                  <span className="plan-card__price">
                    ${Number(plan.monthlyPriceUsd).toFixed(0)}<small>/month</small>
                  </span>
                  <ul>
                    <li>{plan.requestsPerMinute ? `${plan.requestsPerMinute} requests per minute` : 'Unlimited requests'}</li>
                    <li>{plan.monthlyTokenQuota ? `${formatCompact(plan.monthlyTokenQuota)} tokens per month` : 'Unlimited tokens'}</li>
                    <li>{plan.plan === 'ENTERPRISE' ? 'Proxies wave you through' : 'Usage history and live meters'}</li>
                  </ul>
                  <span className="plan-card__check"><CheckIcon width={14} height={14} /></span>
                </button>
              ))}
            </div>
            <button type="button" className="button button--primary" disabled={!selectedPlan} onClick={() => setStep('pay')}>
              Continue to payment
            </button>
          </>
        )}

        {(step === 'pay' || step === 'processing') && (
          <form onSubmit={pay} className="payment">
            <p className="eyebrow">Simulated checkout</p>
            <h2 id="upgrade-title">
              {selectedPlan?.plan === 'ENTERPRISE' ? 'Enterprise' : 'Pro'} for ${Number(selectedPlan?.monthlyPriceUsd ?? 0).toFixed(2)}
            </h2>
            <div className={`card-preview card-preview--${selected.toLowerCase()}`}>
              <span className="card-preview__chip" />
              <span className="card-preview__brand">TOLLGATE</span>
              <span className="card-preview__number">{groupCardNumber(cardNumber) || '•••• •••• •••• ••••'}</span>
              <span className="card-preview__holder">{cardHolder || 'CARD HOLDER'}</span>
              <span className="card-preview__expiry">{expiry || 'MM/YY'}</span>
            </div>
            <label className="field">
              <span>Card holder</span>
              <input value={cardHolder} onChange={(event) => setCardHolder(event.target.value)} placeholder="Name on card" autoComplete="off" disabled={step === 'processing'} />
            </label>
            <label className="field">
              <span>Card number</span>
              <input
                value={groupCardNumber(cardNumber)}
                onChange={(event) => setCardNumber(event.target.value)}
                placeholder="4242 4242 4242 4242"
                inputMode="numeric"
                autoComplete="off"
                disabled={step === 'processing'}
              />
            </label>
            <div className="field-row">
              <label className="field">
                <span>Expiry</span>
                <input
                  value={expiry}
                  onChange={(event) => {
                    const raw = event.target.value.replace(/\D/g, '').slice(0, 4)
                    setExpiry(raw.length > 2 ? `${raw.slice(0, 2)}/${raw.slice(2)}` : raw)
                  }}
                  placeholder="MM/YY"
                  inputMode="numeric"
                  disabled={step === 'processing'}
                />
              </label>
              <label className="field">
                <span>CVC</span>
                <input value={cvc} onChange={(event) => setCvc(event.target.value.replace(/\D/g, '').slice(0, 4))} placeholder="123" inputMode="numeric" disabled={step === 'processing'} />
              </label>
            </div>
            <p className="payment__hint">No real charge happens. Any number works, a card ending in 0000 is declined.</p>
            {error && <p className="payment__error">{error}</p>}
            {step === 'processing' ? (
              <ol className="processing">
                {PROCESSING_STEPS.map((label, index) => (
                  <li key={label} className={progress > index + 1 ? 'is-done' : progress === index + 1 ? 'is-active' : ''}>
                    <span className="processing__dot" />
                    {label}
                  </li>
                ))}
              </ol>
            ) : (
              <div className="payment__actions">
                <button type="button" className="button button--ghost" onClick={() => setStep('choose')}>Back</button>
                <button type="submit" className="button button--primary" disabled={!canPay}>
                  <LockIcon width={15} height={15} /> Pay ${Number(selectedPlan?.monthlyPriceUsd ?? 0).toFixed(2)}
                </button>
              </div>
            )}
          </form>
        )}

        {step === 'done' && receipt && (
          <div className="success">
            <span className="success__seal"><CheckIcon width={28} height={28} /></span>
            <p className="eyebrow">Payment approved</p>
            <h2 id="upgrade-title">Welcome to {receipt.newPlan === 'PRO' ? 'Pro' : 'Enterprise'}.</h2>
            <dl className="success__receipt">
              <div><dt>Transaction</dt><dd>{receipt.transactionId}</dd></div>
              <div><dt>Card</dt><dd>•••• {receipt.cardLast4}</dd></div>
              <div><dt>Amount</dt><dd>${Number(receipt.amountUsd).toFixed(2)}</dd></div>
              <div><dt>Plan</dt><dd>{receipt.previousPlan} → {receipt.newPlan}</dd></div>
            </dl>
            <button type="button" className="button button--primary" onClick={onClose}>Back to the chat</button>
          </div>
        )}
      </div>
    </div>
  )
}
