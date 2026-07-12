import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api/client.js'

const LOAN_TYPES = ['Personal Loan', 'Credit Card', 'Auto Loan', 'Home Loan', 'Education Loan', 'Business Loan']

const EMPTY = {
  borrower_name: '',
  lender_name: '',
  loan_type: 'Personal Loan',
  outstanding_amount: '',
  emi_amount: '',
  overdue_months: '',
  monthly_income: '',
  monthly_expenses: '',
  interest_rate: '',
}

export default function LoanForm() {
  const [form, setForm] = useState(EMPTY)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const update = (key) => (e) => setForm({ ...form, [key]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      const payload = {
        ...form,
        outstanding_amount: Number(form.outstanding_amount),
        emi_amount: Number(form.emi_amount),
        overdue_months: Number(form.overdue_months || 0),
        monthly_income: Number(form.monthly_income),
        monthly_expenses: Number(form.monthly_expenses || 0),
        interest_rate: Number(form.interest_rate || 0),
      }
      const loan = await api.createLoan(payload)
      navigate(`/loans/${loan.id}`)
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div>
      <div className="page-header">
        <span className="page-eyebrow">Step 01</span>
        <h1>Add a loan account</h1>
        <p>These details drive the debt stress score and settlement recommendation.</p>
      </div>

      <div className="card" style={{ maxWidth: 640 }}>
        <form onSubmit={handleSubmit}>
          <div className="grid-2">
            <div className="field">
              <label>Borrower name</label>
              <input required value={form.borrower_name} onChange={update('borrower_name')} placeholder="e.g. Arjun Rao" />
            </div>
            <div className="field">
              <label>Lender name</label>
              <input required value={form.lender_name} onChange={update('lender_name')} placeholder="e.g. HDFC Bank" />
            </div>
          </div>

          <div className="field">
            <label>Loan type</label>
            <select value={form.loan_type} onChange={update('loan_type')}>
              {LOAN_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          <div className="grid-2">
            <div className="field">
              <label>Outstanding amount (₹)</label>
              <input required type="number" min="1" value={form.outstanding_amount} onChange={update('outstanding_amount')} placeholder="250000" />
            </div>
            <div className="field">
              <label>Monthly EMI (₹)</label>
              <input required type="number" min="1" value={form.emi_amount} onChange={update('emi_amount')} placeholder="8500" />
            </div>
          </div>

          <div className="grid-2">
            <div className="field">
              <label>Overdue duration (months)</label>
              <input type="number" min="0" value={form.overdue_months} onChange={update('overdue_months')} placeholder="3" />
            </div>
            <div className="field">
              <label>Interest rate (% p.a.)</label>
              <input type="number" min="0" step="0.1" value={form.interest_rate} onChange={update('interest_rate')} placeholder="14.5" />
            </div>
          </div>

          <div className="grid-2">
            <div className="field">
              <label>Monthly income (₹)</label>
              <input required type="number" min="1" value={form.monthly_income} onChange={update('monthly_income')} placeholder="35000" />
            </div>
            <div className="field">
              <label>Monthly expenses (₹)</label>
              <input type="number" min="0" value={form.monthly_expenses} onChange={update('monthly_expenses')} placeholder="18000" />
            </div>
          </div>

          {error && <p style={{ color: '#B5533C' }}>{error}</p>}

          <button className="btn btn-primary" type="submit" disabled={submitting}>
            {submitting ? <><span className="spinner" /> Saving…</> : 'Save loan & analyze'}
          </button>
        </form>
      </div>
    </div>
  )
}
