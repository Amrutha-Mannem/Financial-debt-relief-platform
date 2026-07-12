import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { api } from '../api/client.js'
import RecoveryGauge from './RecoveryGauge.jsx'

const STRATEGY_TYPES = ['Settlement Letter', 'Negotiation Email', 'Hardship Explanation Letter']

function formatCurrency(v) {
  return '₹' + Number(v || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })
}

export default function LoanDetail() {
  const { id } = useParams()
  const [loan, setLoan] = useState(null)
  const [health, setHealth] = useState(null)
  const [history, setHistory] = useState([])
  const [strategyType, setStrategyType] = useState(STRATEGY_TYPES[0])
  const [tone, setTone] = useState('professional')
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState('')

  const load = () => {
    Promise.all([api.getLoan(id), api.getFinancialHealth(id), api.getNegotiationHistory(id)])
      .then(([l, h, hist]) => {
        setLoan(l)
        setHealth(h)
        setHistory(hist)
      })
      .catch((e) => setError(e.message))
  }

  useEffect(load, [id])

  const handleGenerate = async () => {
    setGenerating(true)
    setError('')
    try {
      await api.createNegotiation({ loan_id: Number(id), strategy_type: strategyType, tone })
      load()
    } catch (e) {
      setError(e.message)
    } finally {
      setGenerating(false)
    }
  }

  if (error) return <div className="card" style={{ color: '#B5533C' }}>{error}</div>
  if (!loan || !health) return <p>Loading loan details…</p>

  return (
    <div>
      <div className="page-header">
        <span className="page-eyebrow"><Link to="/">← All loans</Link></span>
        <h1>{loan.lender_name} · {loan.loan_type}</h1>
        <p>Borrower: {loan.borrower_name}</p>
      </div>

      <div className="grid-2">
        <div className="card">
          <h3>Loan Summary</h3>
          <div className="grid-2">
            <div>
              <div className="stat-label">Outstanding</div>
              <div className="stat-value">{formatCurrency(loan.outstanding_amount)}</div>
            </div>
            <div>
              <div className="stat-label">Monthly EMI</div>
              <div className="stat-value">{formatCurrency(loan.emi_amount)}</div>
            </div>
            <div>
              <div className="stat-label">Overdue</div>
              <div className="stat-value">{loan.overdue_months} mo</div>
            </div>
            <div>
              <div className="stat-label">Interest Rate</div>
              <div className="stat-value">{loan.interest_rate}%</div>
            </div>
          </div>
        </div>

        <div className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <RecoveryGauge score={health.debt_stress_score} level={health.debt_stress_level} />
        </div>
      </div>

      <div className="card">
        <h3>Financial Health Insight</h3>
        <div className="grid-3" style={{ marginBottom: 14 }}>
          <div>
            <div className="stat-label">Monthly Surplus</div>
            <div className="stat-value" style={{ fontSize: '1.2rem' }}>{formatCurrency(health.monthly_surplus)}</div>
          </div>
          <div>
            <div className="stat-label">EMI-to-Income Ratio</div>
            <div className="stat-value" style={{ fontSize: '1.2rem' }}>{health.emi_to_income_ratio}%</div>
          </div>
          <div>
            <div className="stat-label">Recommended Settlement</div>
            <div className="stat-value" style={{ fontSize: '1.2rem' }}>{health.recommended_settlement_percentage}%</div>
          </div>
        </div>
        <p>{health.insight_summary}</p>
        <p className="mono" style={{ color: 'var(--green)', fontWeight: 600 }}>
          Suggested one-time settlement: {formatCurrency(health.recommended_settlement_amount)}
        </p>
      </div>

      <div className="card">
        <h3>Generate Negotiation Strategy</h3>
        <p>AI drafts a lender-specific settlement letter based on this financial profile.</p>
        <div className="grid-2">
          <div className="field">
            <label>Strategy type</label>
            <select value={strategyType} onChange={(e) => setStrategyType(e.target.value)}>
              {STRATEGY_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div className="field">
            <label>Tone</label>
            <select value={tone} onChange={(e) => setTone(e.target.value)}>
              <option value="professional">Professional</option>
              <option value="firm">Firm</option>
              <option value="empathetic">Empathetic</option>
            </select>
          </div>
        </div>
        <button className="btn btn-primary" onClick={handleGenerate} disabled={generating}>
          {generating ? <><span className="spinner" /> Generating…</> : 'Generate letter'}
        </button>
      </div>

      <div className="card">
        <h3>Negotiation History</h3>
        {history.length === 0 ? (
          <p>No negotiation letters generated yet for this loan.</p>
        ) : (
          history.map((n) => (
            <div key={n.id} style={{ marginBottom: 18 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <strong>{n.strategy_type}</strong>
                <span className={`badge badge-${(n.debt_stress_level || 'low').toLowerCase()}`}>
                  {n.settlement_percentage}% waiver
                </span>
              </div>
              <div className="letter-box">{n.generated_content}</div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
