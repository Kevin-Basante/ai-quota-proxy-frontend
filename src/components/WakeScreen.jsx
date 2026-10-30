export default function WakeScreen({ attempts, apiUrl }) {
  return (
    <div className="wake">
      <div className="wake__gate" aria-hidden="true">
        <span className="wake__arm" />
        <span className="wake__post" />
      </div>
      <p className="eyebrow">Opening the gate</p>
      <h1>Waking up the backend</h1>
      <p>
        The API sleeps when nobody uses it. The first visit can take up to a minute while the server starts.
      </p>
      <code>{apiUrl}</code>
      <span className="wake__attempts">attempt {attempts}</span>
    </div>
  )
}
