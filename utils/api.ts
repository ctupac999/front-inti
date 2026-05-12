import { API_BASE_URL } from './api-config'

function getToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('token')
}

function buildHeaders(isFormData = false): HeadersInit {
  const token = getToken()
  const headers: HeadersInit = {}
  if (!isFormData) headers['Content-Type'] = 'application/json'
  if (token) headers['Authorization'] = `Bearer ${token}`
  return headers
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: 'Error de servidor' }))
    throw new Error(error.message || `Error ${res.status}`)
  }
  return res.json()
}

export async function get<T>(endpoint: string): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${endpoint}`, {
    headers: buildHeaders(),
    credentials: 'include',
  })
  return handleResponse<T>(res)
}

export async function post<T>(endpoint: string, body: unknown): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: 'POST',
    headers: buildHeaders(),
    body: JSON.stringify(body),
    credentials: 'include',
  })
  return handleResponse<T>(res)
}

export async function postForm<T>(endpoint: string, formData: FormData): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: 'POST',
    headers: buildHeaders(true),
    body: formData,
    credentials: 'include',
  })
  return handleResponse<T>(res)
}

export async function patch<T>(endpoint: string, body: unknown): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: 'PATCH',
    headers: buildHeaders(),
    body: JSON.stringify(body),
    credentials: 'include',
  })
  return handleResponse<T>(res)
}

export async function patchForm<T>(endpoint: string, formData: FormData): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: 'PATCH',
    headers: buildHeaders(true),
    body: formData,
    credentials: 'include',
  })
  return handleResponse<T>(res)
}

export async function del<T>(endpoint: string): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: 'DELETE',
    headers: buildHeaders(),
    credentials: 'include',
  })
  return handleResponse<T>(res)
}
