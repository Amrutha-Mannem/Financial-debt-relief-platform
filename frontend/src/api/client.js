const BASE_URL = '/api'

async function handle(res) {
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }))
    throw new Error(err.detail || 'Request failed')
  }
  return res.json()
}

export const api = {
  listLoans: () => fetch(`${BASE_URL}/loans`).then(handle),
  getLoan: (id) => fetch(`${BASE_URL}/loans/${id}`).then(handle),
  createLoan: (data) =>
    fetch(`${BASE_URL}/loans`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then(handle),
  deleteLoan: (id) =>
    fetch(`${BASE_URL}/loans/${id}`, { method: 'DELETE' }).then(handle),
  getFinancialHealth: (id) =>
    fetch(`${BASE_URL}/loans/${id}/financial-health`).then(handle),
  createNegotiation: (data) =>
    fetch(`${BASE_URL}/negotiate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then(handle),
  getNegotiationHistory: (loanId) =>
    fetch(`${BASE_URL}/loans/${loanId}/negotiations`).then(handle),
  getDashboard: () => fetch(`${BASE_URL}/dashboard`).then(handle),
}
