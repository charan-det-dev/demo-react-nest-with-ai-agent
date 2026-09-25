// ResetPassword page: reads `token` from the URL, a new-password form ->
// POST /auth/reset-password (per Tasks.md > Frontend > Pages).

import { useState, type FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { resetPassword } from '../api/auth'
import { ApiError } from '../api/client'
import { AuthLayout } from '../components/AuthLayout'

export function ResetPassword() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)

    if (!token) {
      setError('ไม่พบ token สำหรับตั้งรหัสผ่านใหม่ใน URL')
      return
    }
    if (password !== confirmPassword) {
      setError('รหัสผ่านทั้งสองช่องไม่ตรงกัน')
      return
    }

    setSubmitting(true)
    try {
      await resetPassword({ token, password })
      setDone(true)
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : 'ตั้งรหัสผ่านใหม่ไม่สำเร็จ ลิงก์อาจหมดอายุหรือไม่ถูกต้อง',
      )
    } finally {
      setSubmitting(false)
    }
  }

  if (done) {
    return (
      <AuthLayout title="ตั้งรหัสผ่านใหม่สำเร็จ">
        <p className="rounded-md bg-green-50 px-3 py-2 text-center text-sm text-green-700">
          ตั้งรหัสผ่านใหม่เรียบร้อยแล้ว คุณสามารถเข้าสู่ระบบด้วยรหัสผ่านใหม่ได้ทันที
        </p>
        <Link
          to="/login"
          className="mt-6 block text-center text-sm font-medium text-indigo-600 hover:text-indigo-500"
        >
          ไปหน้าเข้าสู่ระบบ
        </Link>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout title="ตั้งรหัสผ่านใหม่">
      {!token && (
        <p role="alert" className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          ไม่พบ token สำหรับตั้งรหัสผ่านใหม่ใน URL กรุณาใช้ลิงก์จากอีเมลที่ได้รับ
        </p>
      )}
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-slate-700">
            รหัสผ่านใหม่
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
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-700">
            ยืนยันรหัสผ่านใหม่
          </label>
          <input
            id="confirmPassword"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
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
          disabled={submitting || !token}
          className="w-full rounded-md bg-indigo-600 px-3 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? 'กำลังบันทึก...' : 'ตั้งรหัสผ่านใหม่'}
        </button>
      </form>
    </AuthLayout>
  )
}
