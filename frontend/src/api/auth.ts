// Auth endpoints (per Tasks.md > Backend > Auth module contract):
//   POST /auth/register
//   GET  /auth/verify-email?token=...
//   POST /auth/login
//   POST /auth/forgot-password
//   POST /auth/reset-password
//
// None of these need the caller's own JWT (they run before a User is
// logged in), so every request below is sent with `auth: false`.

import { apiRequest } from './client'

export type RegisterPayload = {
  email: string
  password: string
  phone?: string
}

export async function register(payload: RegisterPayload): Promise<void> {
  await apiRequest('/auth/register', { method: 'POST', body: payload, auth: false })
}

export async function verifyEmail(token: string): Promise<void> {
  await apiRequest('/auth/verify-email', { query: { token }, auth: false })
}

export type LoginPayload = {
  email: string
  password: string
}

/**
 * The backend's exact JWT field name isn't pinned down by Tasks.md; NestJS's
 * own docs use `access_token`. Accept the common variants defensively so a
 * naming choice on the backend side doesn't silently break login.
 */
type LoginResponse = {
  access_token?: string
  accessToken?: string
  token?: string
}

export async function login(payload: LoginPayload): Promise<string> {
  const data = await apiRequest<LoginResponse>('/auth/login', {
    method: 'POST',
    body: payload,
    auth: false,
  })
  const token = data.access_token ?? data.accessToken ?? data.token
  if (!token) {
    throw new Error('ไม่พบ token การเข้าสู่ระบบในคำตอบจากเซิร์ฟเวอร์')
  }
  return token
}

export async function forgotPassword(email: string): Promise<void> {
  await apiRequest('/auth/forgot-password', { method: 'POST', body: { email }, auth: false })
}

export type ResetPasswordPayload = {
  token: string
  password: string
}

export async function resetPassword(payload: ResetPasswordPayload): Promise<void> {
  await apiRequest('/auth/reset-password', { method: 'POST', body: payload, auth: false })
}
