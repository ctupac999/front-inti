'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { useLanguage } from '@/contexts/language-context'
import { updateProfile, uploadAvatar } from '@/services/user-service'
import { toast } from 'sonner'
import { ArrowLeft, Camera } from 'lucide-react'
import Link from 'next/link'

export default function ProfilePage() {
  const { user, loading, refreshUser } = useAuth()
  const { t } = useLanguage()
  const router = useRouter()
  const [form, setForm] = useState({ firstName: '', lastName: '', phone: '', bio: '' })
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    if (!loading && !user) router.push('/auth/login')
    if (user) {
      setForm({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        phone: user.phone || '',
        bio: user.bio || '',
      })
    }
  }, [user, loading, router])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      await updateProfile(form)
      await refreshUser()
      toast.success(t('profile.saved'))
    } catch (err: any) {
      toast.error(err.message || 'Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  const handleAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      await uploadAvatar(file)
      await refreshUser()
      toast.success(t('profile.avatarUpdated'))
    } catch (err: any) {
      toast.error(err.message || 'Error al subir imagen')
    } finally {
      setUploading(false)
    }
  }

  if (loading || !user) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600" />
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-xl mx-auto px-4">
        <Link href="/dashboard" className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-6">
          <ArrowLeft className="h-4 w-4" /> {t('common.backToPanel')}
        </Link>

        <h1 className="text-2xl font-bold text-gray-900 mb-6">{t('profile.title')}</h1>

        {/* Avatar */}
        <div className="bg-white rounded-2xl p-6 shadow-sm mb-6 flex items-center gap-5">
          <div className="relative">
            <div className="h-20 w-20 rounded-full bg-green-100 flex items-center justify-center text-green-700 text-2xl font-bold overflow-hidden">
              {user.avatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={user.avatar} alt="avatar" className="h-full w-full object-cover" />
              ) : (
                user.firstName?.[0]?.toUpperCase()
              )}
            </div>
            <label className="absolute -bottom-1 -right-1 bg-white border border-gray-200 rounded-full p-1 cursor-pointer hover:bg-gray-50 transition-colors shadow-sm">
              <Camera className="h-3.5 w-3.5 text-gray-500" />
              <input type="file" accept="image/*" className="hidden" onChange={handleAvatar} disabled={uploading} />
            </label>
          </div>
          <div>
            <p className="font-semibold text-gray-900">{user.firstName} {user.lastName}</p>
            <p className="text-sm text-gray-500">{user.email}</p>
            {uploading && <p className="text-xs text-green-600 mt-1">{t('profile.uploading')}</p>}
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSave} className="bg-white rounded-2xl p-6 shadow-sm space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('auth.register.firstName')}</label>
              <input
                value={form.firstName}
                onChange={e => setForm(f => ({ ...f, firstName: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-green-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('auth.register.lastName')}</label>
              <input
                value={form.lastName}
                onChange={e => setForm(f => ({ ...f, lastName: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-green-500"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('auth.register.phone')}</label>
            <input
              value={form.phone}
              onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-green-500"
              placeholder="Opcional"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('profile.bio')}</label>
            <textarea
              value={form.bio}
              onChange={e => setForm(f => ({ ...f, bio: e.target.value }))}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-green-500 resize-none h-24"
              placeholder="Cuéntanos sobre ti y tu finca..."
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2.5 rounded-xl transition-colors disabled:opacity-50"
          >
            {saving ? t('common.saving') : t('profile.saveChanges')}
          </button>
        </form>
      </div>
    </div>
  )
}
