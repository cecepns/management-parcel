import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import api from '../lib/api'

export default function LoginPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ username: '', password: '' })

  const submit = async (e) => {
    e.preventDefault()
    try {
      const { data } = await api.post('/login.php', form)
      const token = (data?.data?.token || '').trim()
      localStorage.setItem('token', token)
      api.defaults.headers.common.Authorization = `Bearer ${token}`
      toast.success('Login berhasil')
      navigate('/')
    } catch {
      toast.error('Login gagal')
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-brand-700 to-slate-900 p-6">
      <form onSubmit={submit} className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <h1 className="mb-6 text-2xl font-bold">Login Admin</h1>
        <input
          className="mb-3 w-full rounded-lg border p-3"
          placeholder="Username"
          value={form.username}
          onChange={(e) => setForm({ ...form, username: e.target.value })}
        />
        <input
          type="password"
          className="mb-4 w-full rounded-lg border p-3"
          placeholder="Password"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
        />
        <button className="w-full rounded-lg bg-brand-600 py-3 font-semibold text-white">Masuk</button>
      </form>
    </div>
  )
}
