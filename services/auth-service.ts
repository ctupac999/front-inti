import { get, post, patch, patchForm, postForm } from '@/utils/api'
import { API_ROUTES } from '@/utils/api-config'
import type { AuthResponse, User } from '@/types/user'

export async function login(email: string, password: string): Promise<AuthResponse> {
  const res = await post<AuthResponse>(API_ROUTES.login, { email, password })
  if (res.token) {
    localStorage.setItem('token', res.token)
    localStorage.setItem('user', JSON.stringify(res.user))
  }
  return res
}

export async function register(data: {
  firstName: string
  lastName: string
  email: string
  password: string
  phone?: string
  acceptedTerms: boolean
  acceptedPrivacy: boolean
  legalVersion?: string
  marketingConsent?: boolean
}): Promise<AuthResponse> {
  const res = await post<AuthResponse>(API_ROUTES.register, data)
  if (res.token) {
    localStorage.setItem('token', res.token)
    localStorage.setItem('user', JSON.stringify(res.user))
  }
  return res
}

export async function getMe(): Promise<User> {
  return get<User>(API_ROUTES.me)
}

export function logout() {
  localStorage.removeItem('token')
  localStorage.removeItem('user')
}
