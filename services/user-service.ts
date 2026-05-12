import { get, patch, post, postForm, del } from '@/utils/api'
import { API_ROUTES } from '@/utils/api-config'
import type { User, Location } from '@/types/user'

export async function updateProfile(data: Partial<User>): Promise<User> {
  return patch<User>(API_ROUTES.updateMe, data)
}

export async function uploadAvatar(file: File): Promise<User> {
  const form = new FormData()
  form.append('file', file)
  return postForm<User>(API_ROUTES.meAvatar, form)
}

export async function addLocation(location: Location): Promise<User> {
  return post<User>(API_ROUTES.meLocations, location)
}

export async function removeLocation(index: number): Promise<User> {
  return del<User>(`${API_ROUTES.meLocations}/${index}`)
}

export async function getAllUsers(page = 1, limit = 50) {
  return get<{ users: User[]; total: number }>(`${API_ROUTES.adminUsers}?page=${page}&limit=${limit}`)
}

export async function toggleUserActive(userId: string): Promise<User> {
  return patch<User>(`${API_ROUTES.adminUsers}/${userId}/toggle-active`, {})
}

export async function changeUserRole(userId: string, role: string): Promise<User> {
  return patch<User>(`${API_ROUTES.adminUsers}/${userId}/role`, { role })
}
