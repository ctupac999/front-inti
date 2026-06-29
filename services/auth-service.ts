import { get, post } from '@/utils/api'
import { API_ROUTES } from '@/utils/api-config'
import type { AuthResponse, User } from '@/types/user'

export async function login(email: string, password: string): Promise<AuthResponse> {
  return post<AuthResponse>(API_ROUTES.login, { email, password })
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
  return post<AuthResponse>(API_ROUTES.register, data)
}

export async function getMe(): Promise<User> {
  return get<User>(API_ROUTES.me)
}

export async function forgotPassword(email: string): Promise<{ message: string }> {
  return post<{ message: string }>(API_ROUTES.forgotPassword, { email })
}

export async function resetPassword(token: string, newPassword: string): Promise<{ message: string }> {
  return post<{ message: string }>(API_ROUTES.resetPassword, { token, newPassword })
}
