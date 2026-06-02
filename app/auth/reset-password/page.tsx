'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useRouter, useSearchParams } from 'next/navigation'
import { resetPassword } from '@/services/auth-service'
import { useLanguage } from '@/contexts/language-context'
import { ArrowLeft, Check, Loader2, Sprout } from 'lucide-react'

export default function ResetPasswordPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')
  const { t } = useLanguage()

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(
    !token ? t('auth.resetPassword.tokenNotFound') : null,
  )
  const [success, setSuccess] = useState(false)
  const [countdown, setCountdown] = useState(5)

  const schema = z
    .object({
      newPassword: z.string().min(8, 'Mínimo 8 caracteres'),
      confirmPassword: z.string(),
    })
    .refine((data) => data.newPassword === data.confirmPassword, {
      message: 'Las contraseñas no coinciden',
      path: ['confirmPassword'],
    })

  type FormData = z.infer<typeof schema>

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  useEffect(() => {
    if (!success) return
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(timer)
    }
    router.push('/auth/login')
  }, [success, countdown, router])

  const onSubmit = async (data: FormData) => {
    if (!token) {
      setError(t('auth.resetPassword.tokenNotFound'))
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      await resetPassword(token, data.newPassword)
      setSuccess(true)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t('auth.resetPassword.error'))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center px-4 py-12 bg-gray-50">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-green-100 mb-4">
            <Sprout className="h-7 w-7 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">{t('auth.resetPassword.title')}</h1>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border p-8">
          {error && (
            <div className="mb-4 rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {success ? (
            <div className="flex flex-col items-center justify-center py-6">
              <div className="mb-4 flex items-center justify-center w-16 h-16 rounded-full bg-green-100">
                <Check className="h-8 w-8 text-green-600" />
              </div>
              <h2 className="mb-2 text-xl font-bold text-gray-900">{t('auth.resetPassword.successTitle')}</h2>
              <p className="mb-2 text-center text-sm text-gray-500">{t('auth.resetPassword.successMessage')}</p>
              <p className="text-center text-sm text-gray-400">
                {t('auth.resetPassword.redirectMessage')} <span className="font-semibold text-gray-600">{countdown}</span> {t('auth.resetPassword.seconds')}
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('auth.resetPassword.newPasswordLabel')}</label>
                <input
                  id="newPassword"
                  type="password"
                  {...register('newPassword')}
                  placeholder="••••••••"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100 transition-all"
                />
                {errors.newPassword && <p className="text-red-500 text-xs mt-1">{errors.newPassword.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('auth.resetPassword.confirmPasswordLabel')}</label>
                <input
                  id="confirmPassword"
                  type="password"
                  {...register('confirmPassword')}
                  placeholder="••••••••"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100 transition-all"
                />
                {errors.confirmPassword && <p className="text-red-500 text-xs mt-1">{errors.confirmPassword.message}</p>}
              </div>

              <button
                type="submit"
                disabled={isLoading || !token}
                className="w-full rounded-xl bg-green-600 py-2.5 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-60 transition-colors"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {t('auth.resetPassword.processing')}
                  </span>
                ) : (
                  t('auth.resetPassword.submit')
                )}
              </button>
            </form>
          )}
        </div>

        <div className="text-center mt-6">
          <button
            onClick={() => router.push('/')}
            className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            {t('auth.resetPassword.backToHome')}
          </button>
        </div>
      </div>
    </div>
  )
}
