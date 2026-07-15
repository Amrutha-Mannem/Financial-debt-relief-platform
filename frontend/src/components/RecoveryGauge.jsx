// Signature visual element: a semi-circular "recovery arc" gauge that
// represents debt stress score (0 = healthy, 100 = severe stress).
const COLORS = {
  Low: '#2F6F52',
  Moderate: '#B8862E',
  High: '#B5533C',
  Severe: '#8C3A28',
}

export default function RecoveryGauge({ score = 0, level = 'Low' }) {
  const clamped = Math.max(0, Math.min(100, score))
  const radius = 70
  const circumference = Math.PI * radius // half circle
  const offset = circumference - (clamped / 100) * circumference
  const color = COLORS[level] || COLORS.Low

  return (
    <div className="gauge-wrap">
      <svg width="180" height="100" viewBox="0 0 180 100">
        <path
          d="M 20 90 A 70 70 0 0 1 160 90"
          fill="none"
          stroke="#E3E8E3"
          strokeWidth="14"
          strokeLinecap="round"
        />
        <path
          d="M 20 90 A 70 70 0 0 1 160 90"
          fill="none"
          stroke={color}
          strokeWidth="14"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 0.6s ease, stroke 0.3s ease' }}
        />
      </svg>
      <div className="gauge-score" style={{ color }}>{clamped}</div>
      <div className="gauge-caption">Debt stress score — <strong style={{ color }}>{level}</strong></div>
    </div>
  )
}
