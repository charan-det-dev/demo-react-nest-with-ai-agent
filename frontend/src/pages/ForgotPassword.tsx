// ForgotPassword page: email input -> POST /auth/forgot-password (per
// Tasks.md > Frontend > Pages). The backend always responds generically to
// avoid email enumeration, so this page shows the same success message
// regardless of whether the email exists.

import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { forgotPassword } from '../api/auth'
import { ApiError } from '../api/client'
import { AuthLayout } from '../components/AuthLayout'

export function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [sent, setSent] = useState(false)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      await forgotPassword(email)
      setSent(true)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'ส่งคำขอไม่สำเร็จ กรุณาลองใหม่อีกครั้ง')
    } finally {
      setSubmitting(false)
    }
  }

  if (sent) {
    return (
      <AuthLayout title="ตรวจสอบอีเมลของคุณ">
        <p className="text-center text-sm text-slate-600">
          หากมีบัญชีที่ใช้อีเมล <span className="font-medium text-slate-900">{email}</span>{' '}
          เราได้ส่งลิงก์สำหรับตั้งรหัสผ่านใหม่ไปให้แล้ว
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
    <AuthLayout title="ลืมรหัสผ่าน">
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-slate-700">
            อีเมลที่ใช้สมัครสมาชิก
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
          {submitting ? 'กำลังส่งคำขอ...' : 'ส่งลิงก์ตั้งรหัสผ่านใหม่'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-600">
        <Link to="/login" className="font-medium text-indigo-600 hover:text-indigo-500">
          กลับไปหน้าเข้าสู่ระบบ
        </Link>
      </p>
    </AuthLayout>
  )
}
