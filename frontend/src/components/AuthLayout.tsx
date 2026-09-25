// Shared centered-card layout used by every auth page (Register, Login, etc.)
// so each page only has to describe its own form. Kept intentionally tiny —
// just markup, no logic.

import type { ReactNode } from 'react'

export function AuthLayout({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10">
      <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-sm ring-1 ring-slate-200 sm:p-8">
        <h1 className="mb-6 text-center text-xl font-semibold text-slate-900">{title}</h1>
        {children}
      </div>
    </div>
  )
}
