import { useEffect, useRef } from 'react'
import { formatNumber, formatTime } from '../utils/format.js'
import { SparkIcon } from './Icons.jsx'

const SUGGESTIONS = [
  'Explain the proxy pattern with a real-world analogy',
  'Write a haiku about rate limiting',
  'Give me three ideas for a weekend project',
  'Summarize why token quotas matter',
]

function Receipt({ response }) {
  return (
    <dl className="receipt">
      <div><dt>prompt</dt><dd>{formatNumber(response.promptTokens)}</dd></div>
      <div><dt>reply</dt><dd>{formatNumber(response.completionTokens)}</dd></div>
      <div className="receipt__total"><dt>charged</dt><dd>{formatNumber(response.totalTokens)}</dd></div>
      <div><dt>latency</dt><dd>{(response.latencyMs / 1000).toFixed(2)}s</dd></div>
    </dl>
  )
}

function Message({ message }) {
  if (message.kind === 'user') {
    return (
      <article className="message message--user">
        <p>{message.text}</p>
        <time>{formatTime(message.at)}</time>
      </article>
    )
  }
  if (message.kind === 'pending') {
    return (
      <article className="message message--ai message--pending" aria-live="polite">
        <span className="message__sigil"><SparkIcon width={14} height={14} /></span>
        <div className="message__body">
          <span className="typing"><i /><i /><i /></span>
          <span className="message__hint">passing the gate…</span>
        </div>
      </article>
    )
  }
  if (message.kind === 'blocked') {
    return (
      <article className={`message message--blocked message--blocked-${message.code}`}>
        <span className="message__code">{message.code}</span>
        <div className="message__body">
          <strong>{message.title}</strong>
          <p>{message.text}</p>
        </div>
      </article>
    )
  }
  return (
    <article className="message message--ai">
      <span className="message__sigil"><SparkIcon width={14} height={14} /></span>
      <div className="message__body">
        {message.response.text.split('\n\n').map((paragraph, index) => <p key={index}>{paragraph}</p>)}
        <footer className="message__footer">
          <span className="message__model">{message.response.model}</span>
          <time>{formatTime(message.at)}</time>
        </footer>
        <Receipt response={message.response} />
      </div>
    </article>
  )
}

export default function ChatPanel({ messages, onSuggestion, userName }) {
  const endRef = useRef(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [messages])

  return (
    <div className="chat">
      {messages.length === 0 ? (
        <div className="chat__empty">
          <p className="eyebrow">Signed in as {userName ?? '…'}</p>
          <h2>Every prompt pays a toll.</h2>
          <p className="chat__lede">
            Your request crosses two proxies before it reaches the model. One counts how often you knock, the other
            meters how much you spend. Try one of these to watch the gate work.
          </p>
          <div className="chat__suggestions">
            {SUGGESTIONS.map((suggestion) => (
              <button type="button" key={suggestion} onClick={() => onSuggestion(suggestion)}>
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="chat__stream">
          {messages.map((message) => <Message key={message.id} message={message} />)}
          <span ref={endRef} />
        </div>
      )}
    </div>
  )
}
