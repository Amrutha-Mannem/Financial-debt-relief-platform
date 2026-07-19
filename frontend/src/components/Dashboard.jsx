import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api/client.js'

const STEPS = [
  { num: '01', title: 'Add your loan', desc: 'Enter outstanding amount, EMI, overdue duration and income.' },
  { num: '02', title: 'Analyze health', desc: 'Get a debt stress score and a fair settlement estimate.' },
  { num: '03', title: 'Negotiate', desc: 'Generate a lender-specific settlement letter with one click.' },
  { num: '04', title: 'Track recovery', desc: 'Monitor every offer sent and your progress over time.' },
]

function formatCurrency(v) {
  return '₹' + Number(v || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })
}

function stressBadgeClass(score) {
  if (score >= 70) return 'badge-severe'
  if (score >= 45) return 'badge-high'
  if (score >= 25) return 'badge-moderate'
  return 'badge-low'
}

export default function Dashboard() {
  const [summary, setSummary] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api
      .getDashboard()
      .then(setSummary)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div>
      <div className="page-header">
        <span className="page-eyebrow">Financial Recovery Overview</span>
        <h1>Your path back to solid ground</h1>
        <p>Track every loan, understand your debt stress, and let AI draft the negotiation for you.</p>
      </div>

      <div className="steps">
        {STEPS.map((s) => (
          <div className="step" key={s.num}>
            <div className="step-num">{s.num}</div>
            <div className="step-title">{s.title}</div>
            <div className="step-desc">{s.desc}</div>
          </div>
        ))}
      </div>

      {error && <div className="card" style={{ color: '#B5533C' }}>{error}. Is the backend running on port 8000?</div>}

      {!error && loading && <p>Loading your dashboard…</p>}

      {!error && summary && (
        <>
          <div className="grid-3">
            <div className="card">
              <div className="stat-label">Total Outstanding</div>
              <div className="stat-value">{formatCurrency(summary.total_outstanding)}</div>
            </div>
            <div className="card">
              <div className="stat-label">Total Monthly EMI</div>
              <div className="stat-value">{formatCurrency(summary.total_emi)}</div>
            </div>
            <div className="card">
              <div className="stat-label">Avg. Debt Stress Score</div>
              <div className="stat-value">{summary.average_stress_score} / 100</div>
            </div>
          </div>

          <div className="card" style={{ marginTop: 16 }}>
            <h3 style={{ marginBottom: 12 }}>Loan Accounts</h3>
            {summary.loans.length === 0 ? (
              <div className="empty-state">
                <p>No loans added yet.</p>
                <Link to="/add-loan" className="btn btn-primary">Add your first loan</Link>
              </div>
            ) : (
              summary.loans.map((loan) => (
                <Link to={`/loans/${loan.id}`} className="loan-row" key={loan.id}>
                  <div className="loan-row-main">
                    <span className="loan-row-name">{loan.lender_name} — {loan.loan_type}</span>
                    <span className="loan-row-sub">
                      Borrower: {loan.borrower_name} · EMI {formatCurrency(loan.emi_amount)}/mo
                      {loan.overdue_months > 0 ? ` · ${loan.overdue_months} mo overdue` : ''}
                    </span>
                  </div>
                  <div className="mono">{formatCurrency(loan.outstanding_amount)}</div>
                </Link>
              ))
            )}
          </div>
        </>
      )}
    </div>
  )
}