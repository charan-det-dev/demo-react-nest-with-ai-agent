// Home page (protected): simple landing page after login (per Tasks.md >
// Frontend > Pages).

import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export function Home() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-slate-50 px-4 py-10 text-center">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">ยินดีต้อนรับ</h1>
        {user?.email && <p className="mt-2 text-sm text-slate-600">เข้าสู่ระบบในชื่อ {user.email}</p>}
      </div>
      <button
        type="button"
        onClick={handleLogout}
        className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-500"
      >
        ออกจากระบบ
      </button>
    </div>
  )
}
