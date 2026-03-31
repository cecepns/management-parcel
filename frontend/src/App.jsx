import { Navigate, Route, Routes } from 'react-router-dom'
import PropTypes from 'prop-types'
import Layout from './components/Layout'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import ProductsPage from './pages/ProductsPage'
import ResellersPage from './pages/ResellersPage'
import OrdersPage from './pages/OrdersPage'
import ReportsPage from './pages/ReportsPage'

function Protected({ children }) {
  const token = localStorage.getItem('token')
  return token ? children : <Navigate to="/login" replace />
}
Protected.propTypes = { children: PropTypes.node.isRequired }

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/" element={<Protected><Layout><DashboardPage /></Layout></Protected>} />
      <Route path="/products" element={<Protected><Layout><ProductsPage /></Layout></Protected>} />
      <Route path="/resellers" element={<Protected><Layout><ResellersPage /></Layout></Protected>} />
      <Route path="/orders" element={<Protected><Layout><OrdersPage /></Layout></Protected>} />
      <Route path="/reports" element={<Protected><Layout><ReportsPage /></Layout></Protected>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
