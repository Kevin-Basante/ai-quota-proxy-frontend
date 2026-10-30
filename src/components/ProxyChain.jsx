const STATIONS = [
  { key: 'rate', name: 'RateLimitProxyService', role: 'Requests per minute', code: '429' },
  { key: 'quota', name: 'QuotaProxyService', role: 'Monthly token budget', code: '402' },
  { key: 'service', name: 'MockAIGenerationService', role: 'Real subject · 1200 ms', code: '200' },
]

function stationState(phase, index) {
  if (phase === 'idle') return 'idle'
  if (phase === 'running') return 'running'
  if (phase === 'passed') return 'pass'
  if (phase === 'rate-blocked') return index === 0 ? 'blocked' : 'skipped'
  if (phase === 'quota-blocked') return index === 0 ? 'pass' : index === 1 ? 'blocked' : 'skipped'
  return index === 2 ? 'blocked' : 'pass'
}

const PHASE_CAPTION = {
  idle: 'Waiting for a prompt',
  running: 'Request travelling through the chain',
  passed: 'Both proxies approved · real service answered',
  'rate-blocked': 'Stopped at the first proxy · 429 Too Many Requests',
  'quota-blocked': 'Stopped at the second proxy · 402 Payment Required',
  failed: 'The request failed before completing',
}

export default function ProxyChain({ phase, runId }) {
  return (
    <section className={`chain chain--${phase}`} aria-label="Proxy chain">
      <header className="chain__header">
        <span className="eyebrow">Proxy chain</span>
        <span className="chain__caption">{PHASE_CAPTION[phase]}</span>
      </header>
      <ol className="chain__track" key={runId}>
        <li className="chain__client">
          <span className="chain__client-dot" />
          <span>Client</span>
        </li>
        {STATIONS.map((station, index) => {
          const state = stationState(phase, index)
          return (
            <li key={station.key} className={`chain__station chain__station--${state}`} style={{ '--delay': `${index * 0.32}s` }}>
              <span className="chain__wire" aria-hidden="true"><span className="chain__packet" /></span>
              <div className="chain__card">
                <span className="chain__lamp" aria-hidden="true" />
                <span className="chain__name">{station.name}</span>
                <span className="chain__role">{station.role}</span>
                <span className="chain__code">{state === 'blocked' ? station.code : state === 'pass' ? 'pass' : state === 'skipped' ? 'skipped' : '···'}</span>
              </div>
            </li>
          )
        })}
      </ol>
    </section>
  )
}
