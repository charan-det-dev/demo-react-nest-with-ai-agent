// Login page: email/password -> POST /auth/login. Must surface "not
// verified" and "locked out" (Lockout) as distinct messages, not a generic
// one (per Tasks.md > Frontend > Pages).
//
// The backend doesn't pin down exact error text, so this classifies the
// message it gets back by keyword. If the backend's wording changes, update
// the keyword lists below rather than the rest of the page.

import { useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { login } from '../api/auth'
import { ApiError } from '../api/client'
import { useAuth } from '../context/AuthContext'
import { AuthLayout } from '../components/AuthLayout'

type LoginErrorKind = 'not-verified' | 'locked-out' | 'invalid-credentials' | 'other'

function classifyLoginError(err: unknown): { kind: LoginErrorKind; message: string } {
  if (!(err instanceof ApiError)) {
    return { kind: 'other', message: 'เข้าสู่ระบบไม่สำเร็จ กรุณาลองใหม่อีกครั้ง' }
  }

  const lower = err.message.toLowerCase()
  if (lower.includes('verif')) {
    return {
      kind: 'not-verified',
      message: 'บัญชีนี้ยังไม่ได้ยืนยันอีเมล (Verification) กรุณาตรวจสอบอีเมลของคุณก่อนเข้าสู่ระบบ',
    }
  }
  if (lower.includes('lock')) {
    return {
      kind: 'locked-out',
      message: 'บัญชีนี้ถูกล็อกชั่วคราว (Lockout) เนื่องจากเข้าสู่ระบบผิดพลาดหลายครั้ง กรุณาลองใหม่ภายหลัง',
    }
  }
  if (err.status === 401) {
    return { kind: 'invalid-credentials', message: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' }
  }
  return { kind: 'other', message: err.message }
}

export function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<{ kind: LoginErrorKind; message: string } | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const { login: setAuthToken } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      const token = await login({ email, password })
      setAuthToken(token)
      const redirectTo = (location.state as { from?: Location } | null)?.from?.pathname ?? '/'
      navigate(redirectTo, { replace: true })
    } catch (err) {
      setError(classifyLoginError(err))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthLayout title="เข้าสู่ระบบ">
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
          <div className="flex items-center justify-between">
            <label htmlFor="password" className="block text-sm font-medium text-slate-700">
              รหัสผ่าน
            </label>
            <Link to="/forgot-password" className="text-xs font-medium text-indigo-600 hover:text-indigo-500">
              ลืมรหัสผ่าน?
            </Link>
          </div>
          <input
            id="password"
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        {error && (
          <div role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
            {error.message}
            {error.kind === 'not-verified' && (
              <div className="mt-1">
                <Link to="/register" className="font-medium underline hover:no-underline">
                  ไปหน้าสมัครสมาชิกเพื่อขอลิงก์ยืนยันใหม่
                </Link>
              </div>
            )}
          </div>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-md bg-indigo-600 px-3 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-600">
        ยังไม่มีบัญชี?{' '}
        <Link to="/register" className="font-medium text-indigo-600 hover:text-indigo-500">
          สมัครสมาชิก
        </Link>
      </p>
    </AuthLayout>
  )
}
