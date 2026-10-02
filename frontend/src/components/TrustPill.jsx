function TrustPill({ label }) {
  return (
    <div className="trust-pill" aria-label={label}>
      <span className="trust-dot" aria-hidden="true" />
      <span>{label}</span>
    </div>
  )
}

export default TrustPill
