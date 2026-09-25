// API client wrapper (per Tasks.md > Frontend > Project scaffolding)
//
// Attaches the JWT stored in localStorage as `Authorization: Bearer <token>`
// on every request, per ADR-0001 (JWT via Authorization header). The backend
// is stateless: it never sets cookies, so every authenticated request must
// carry this header explicitly.

export const AUTH_TOKEN_STORAGE_KEY = 'auth_token'

const API_BASE_URL: string =
  (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:3000'

export class ApiError extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

function getStoredToken(): string | null {
  try {
    return localStorage.getItem(AUTH_TOKEN_STORAGE_KEY)
  } catch {
    return null
  }
}

/**
 * Nest's global exception filter / ValidationPipe responds with
 * `{ statusCode, message, error }`, where `message` is either a string
 * (a single error) or a string[] (class-validator errors, one per field).
 * This normalizes both shapes into one display string.
 */
function extractErrorMessage(body: unknown, fallback: string): string {
  if (body && typeof body === 'object' && 'message' in body) {
    const message = (body as { message?: unknown }).message
    if (typeof message === 'string') return message
    if (Array.isArray(message)) return message.filter((m) => typeof m === 'string').join(', ')
  }
  return fallback
}

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE'
  body?: unknown
  query?: Record<string, string | undefined>
  auth?: boolean
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, query, auth = true } = options

  const url = new URL(path, API_BASE_URL)
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined) url.searchParams.set(key, value)
    }
  }

  const headers: Record<string, string> = {}
  if (body !== undefined) headers['Content-Type'] = 'application/json'
  if (auth) {
    const token = getStoredToken()
    if (token) headers.Authorization = `Bearer ${token}`
  }

  let response: Response
  try {
    response = await fetch(url, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })
  } catch {
    throw new ApiError('ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้ กรุณาลองใหม่อีกครั้ง', 0)
  }

  const text = await response.text()
  const data = text ? (JSON.parse(text) as unknown) : undefined

  if (!response.ok) {
    throw new ApiError(extractErrorMessage(data, 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง'), response.status)
  }

  return data as T
}
