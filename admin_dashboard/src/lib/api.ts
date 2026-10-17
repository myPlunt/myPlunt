const API_URL = import.meta.env.VITE_API_URL

export type Admin = {
  id: string
  email: string
  displayName: string
}

type AuthResponse = {
  accessToken: string
  admin: Admin
}

export class ApiError extends Error {
  readonly status: number

  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

// The access token lives only in memory, never in localStorage, where any injected script could
// read it. The refresh token is in an httpOnly cookie the backend sets, which this code can't see;
// credentials: 'include' makes the browser send it.
let accessToken: string | null = null
let refreshing: Promise<Admin | null> | null = null
let sessionEnded: () => void = () => {}

// AuthProvider registers this to show the login page when a request finds the session is over.
export function onSessionEnded(callback: () => void) {
  sessionEnded = callback
}

function send(path: string, init: RequestInit = {}): Promise<Response> {
  const headers = new Headers(init.headers)
  if (init.body) headers.set('Content-Type', 'application/json')
  if (accessToken) headers.set('Authorization', `Bearer ${accessToken}`)
  return fetch(`${API_URL}${path}`, { ...init, headers, credentials: 'include' })
}

// The backend's ProblemDetail detail is written to be shown to the user.
async function toError(response: Response): Promise<ApiError> {
  const body = await response.json().catch(() => null)
  return new ApiError(response.status, body?.detail ?? 'Something went wrong. Please try again.')
}

function startSession(response: AuthResponse): Admin {
  accessToken = response.accessToken
  return response.admin
}

export async function login(email: string, password: string): Promise<Admin> {
  const response = await send('/v1/admin/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) })
  if (!response.ok) throw await toError(response)
  return startSession(await response.json())
}

// Resumes the session from the refresh cookie (e.g. after a page reload); null when there's none.
// Only one runs at a time: each refresh uses up the cookie's token, so a second one in parallel
// would be rejected.
export function refreshSession(): Promise<Admin | null> {
  refreshing ??= (async () => {
    try {
      const response = await send('/v1/admin/auth/refresh', { method: 'POST' })
      if (!response.ok) {
        accessToken = null
        return null
      }
      return startSession(await response.json())
    } finally {
      refreshing = null
    }
  })()
  return refreshing
}

// For the dashboard's requests. A 401 means the access token expired: refresh once and retry; if
// that fails too, the session is over.
async function authorizedSend(path: string, init?: RequestInit): Promise<Response> {
  let response = await send(path, init)
  if (response.status === 401) {
    if (!(await refreshSession())) {
      sessionEnded()
      throw await toError(response)
    }
    response = await send(path, init)
  }
  if (!response.ok) throw await toError(response)
  return response
}

export async function apiGet<T>(path: string): Promise<T> {
  return (await authorizedSend(path)).json()
}

// For actions that answer 204 No Content.
export async function apiAction(path: string, method: 'POST' | 'DELETE'): Promise<void> {
  await authorizedSend(path, { method })
}

export async function logout(): Promise<void> {
  try {
    await send('/v1/admin/auth/logout', { method: 'POST' })
  } finally {
    accessToken = null
  }
}
