// Register page: email, password, phone (optional) -> POST /auth/register,
// then shows a "check your email" state (per Tasks.md > Frontend > Pages).

import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { register } from '../api/auth'
import { ApiError } from '../api/client'
import { AuthLayout } from '../components/AuthLayout'

export function Register() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [phone, setPhone] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [registered, setRegistered] = useState(false)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      await register({ email, password, phone: phone.trim() ? phone.trim() : undefined })
      setRegistered(true)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'สมัครสมาชิกไม่สำเร็จ กรุณาลองใหม่อีกครั้ง')
    } finally {
      setSubmitting(false)
    }
  }

  if (registered) {
    return (
      <AuthLayout title="สมัครสมาชิกสำเร็จ">
        <p className="text-center text-sm text-slate-600">
          กรุณาตรวจสอบอีเมล <span className="font-medium text-slate-900">{email}</span>{' '}
          เพื่อยืนยันตัวตน (Verification) ก่อนเข้าสู่ระบบ
        </p>
        <Link
          to="/login"
          className="mt-6 block text-center text-sm font-medium text-indigo-600 hover:text-indigo-500"
        >
          กลับไปหน้าเข้าสู่ระบบ
        </Link>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout title="สมัครสมาชิก (Registration)">
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-slate-700">
            อีเมล
          </label>
          <input
            id="email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-slate-700">
            รหัสผ่าน
          </label>
          <input
            id="password"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-slate-700">
            เบอร์โทรศัพท์ <span className="text-slate-400">(ไม่บังคับ)</span>
          </label>
          <input
            id="phone"
            type="tel"
            autoComplete="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        {error && (
          <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-md bg-indigo-600 px-3 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? 'กำลังสมัครสมาชิก...' : 'สมัครสมาชิก'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-600">
        มีบัญชีอยู่แล้ว?{' '}
        <Link to="/login" className="font-medium text-indigo-600 hover:text-indigo-500">
          เข้าสู่ระบบ
        </Link>
      </p>
    </AuthLayout>
  )
}
