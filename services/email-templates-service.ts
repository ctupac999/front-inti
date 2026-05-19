import { get, put, del, post } from '@/utils/api'
import { API_ROUTES } from '@/utils/api-config'

export interface EmailTemplate {
  _id?: string
  key: string
  locale: string
  subject: string
  html: string
  updatedAt?: string
}

export async function getAllEmailTemplates(key?: string): Promise<EmailTemplate[]> {
  const url = key
    ? `${API_ROUTES.emailTemplates}?key=${encodeURIComponent(key)}`
    : API_ROUTES.emailTemplates
  return get<EmailTemplate[]>(url)
}

export async function getEmailTemplate(key: string, locale: string): Promise<EmailTemplate> {
  return get<EmailTemplate>(`${API_ROUTES.emailTemplates}/${key}/${locale}`)
}

export async function upsertEmailTemplate(
  key: string,
  locale: string,
  data: { subject: string; html: string },
): Promise<EmailTemplate> {
  return put<EmailTemplate>(`${API_ROUTES.emailTemplates}/${key}/${locale}`, data)
}

export async function deleteEmailTemplate(key: string, locale: string): Promise<{ deleted: boolean }> {
  return del<{ deleted: boolean }>(`${API_ROUTES.emailTemplates}/${key}/${locale}`)
}

export async function previewEmailTemplate(
  key: string,
  locale: string,
  vars: Record<string, string>,
): Promise<{ subject: string; html: string }> {
  return post<{ subject: string; html: string }>(
    `${API_ROUTES.emailTemplates}/${key}/${locale}/preview`,
    vars,
  )
}
