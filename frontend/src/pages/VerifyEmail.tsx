// VerifyEmail page: reads `token` from the URL query, calls
// GET /auth/verify-email, and shows the result (per Tasks.md > Frontend > Pages).

import { useEffect, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { verifyEmail } from '../api/auth'
import { ApiError } from '../api/client'
import { AuthLayout } from '../components/AuthLayout'

type Status = 'verifying' | 'success' | 'error'

export function VerifyEmail() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')
  const [status, setStatus] = useState<Status>('verifying')
  const [error, setError] = useState<string | null>(null)

  // The verification token is consume-once on the backend (it's deleted
  // after the first successful use), but <StrictMode> double-invokes this
  // effect in dev, which would send the request twice and turn the second,
  // now-invalid attempt into a false "expired" error. Guard by token so the
  // request only ever actually fires once per token, instead of using a
  // cancellation flag that would just as wrongly discard the *first* (real)
  // response when StrictMode's synchronous cleanup runs before it resolves.
  const requestedTokenRef = useRef<string | null>(null)

  useEffect(() => {
    if (!token) {
      setStatus('error')
      setError('ไม่พบ token สำหรับยืนยันอีเมลใน URL')
      return
    }
    if (requestedTokenRef.current === token) return
    requestedTokenRef.current = token

    verifyEmail(token)
      .then(() => setStatus('success'))
      .catch((err: unknown) => {
        setStatus('error')
        setError(
          err instanceof ApiError
            ? err.message
            : 'ยืนยันอีเมลไม่สำเร็จ ลิงก์อาจหมดอายุหรือไม่ถูกต้อง',
        )
      })
  }, [token])

  return (
    <AuthLayout title="ยืนยันอีเมล (Verification)">
      {status === 'verifying' && (
        <p className="text-center text-sm text-slate-600">กำลังยืนยันอีเมลของคุณ...</p>
      )}

      {status === 'success' && (
        <>
          <p className="rounded-md bg-green-50 px-3 py-2 text-center text-sm text-green-700">
            ยืนยันอีเมลสำเร็จแล้ว ตอนนี้คุณสามารถเข้าสู่ระบบได้
          </p>
          <Link
            to="/login"
            className="mt-6 block text-center text-sm font-medium text-indigo-600 hover:text-indigo-500"
          >
            ไปหน้าเข้าสู่ระบบ
          </Link>
        </>
      )}

      {status === 'error' && (
        <>
          <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-center text-sm text-red-700">
            {error}
          </p>
          <Link
            to="/register"
            className="mt-6 block text-center text-sm font-medium text-indigo-600 hover:text-indigo-500"
          >
            กลับไปหน้าสมัครสมาชิก
          </Link>
        </>
      )}
    </AuthLayout>
  )
}
