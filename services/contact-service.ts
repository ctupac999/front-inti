import { post } from '@/utils/api'
import { API_ROUTES } from '@/utils/api-config'

export async function submitContact(data: {
  name?: string
  email?: string
  subject: string
  message: string
}): Promise<{ success: boolean; id: string }> {
  return post(API_ROUTES.contact, data)
}
