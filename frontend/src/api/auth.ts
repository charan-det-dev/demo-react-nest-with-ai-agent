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

/** Matches `AuthService.login`'s return shape (backend/src/auth/auth.service.ts). */
type LoginResponse = {
  accessToken?: string
}

export async function login(payload: LoginPayload): Promise<string> {
  const data = await apiRequest<LoginResponse>('/auth/login', {
    method: 'POST',
    body: payload,
    auth: false,
  })
  const token = data.accessToken
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
  /** Field name must be `newPassword` — matches ResetPasswordDto on the
   *  backend (backend/src/auth/dto/reset-password.dto.ts). */
  newPassword: string
}

export async function resetPassword(payload: ResetPasswordPayload): Promise<void> {
  await apiRequest('/auth/reset-password', { method: 'POST', body: payload, auth: false })
}
