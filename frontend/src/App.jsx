import { Routes, Route, NavLink } from 'react-router-dom'
import Dashboard from './components/Dashboard.jsx'
import LoanForm from './components/LoanForm.jsx'
import LoanDetail from './components/LoanDetail.jsx'

export default function App() {
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-brand">
          Recovery<span className="accent">Path</span>
        </div>
        <nav className="sidebar-nav">
          <NavLink to="/" end className={({ isActive }) => (isActive ? 'active' : '')}>
            Dashboard
          </NavLink>
          <NavLink to="/add-loan" className={({ isActive }) => (isActive ? 'active' : '')}>
            Add Loan
          </NavLink>
        </nav>
      </aside>
      <main className="main-area">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/add-loan" element={<LoanForm />} />
          <Route path="/loans/:id" element={<LoanDetail />} />
        </Routes>
      </main>
    </div>
  )
}
