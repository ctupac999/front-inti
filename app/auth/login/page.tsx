'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAuth } from '@/contexts/auth-context'
import { useLanguage } from '@/contexts/language-context'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import { Sprout, Eye, EyeOff, Check, Loader2 } from 'lucide-react'
import { forgotPassword } from '@/services/auth-service'

const getErrorMessage = (err: unknown, fallback: string) => {
  if (err instanceof Error && err.message) return err.message
  return fallback
}

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

type FormData = z.infer<typeof schema>

export default function LoginPage() {
  const { login } = useAuth()
  const { t } = useLanguage()
  const router = useRouter()
  const [showPass, setShowPass] = useState(false)
  const [showForgotPassword, setShowForgotPassword] = useState(false)
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('')
  const [forgotPasswordSuccess, setForgotPasswordSuccess] = useState(false)
  const [forgotPasswordLoading, setForgotPasswordLoading] = useState(false)
  const [forgotPasswordError, setForgotPasswordError] = useState<string | null>(null)

  const { register, handleSubmit, getValues, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data: FormData) => {
    try {
      const loggedUser = await login(data.email, data.password)
      toast.success(t('auth.login.welcome'))
      router.push(loggedUser?.role === 'admin' ? '/admin' : '/dashboard')
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, t('auth.login.error')))
    }
  }

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!forgotPasswordEmail) return

    setForgotPasswordLoading(true)
    setForgotPasswordError(null)

    try {
      await forgotPassword(forgotPasswordEmail)
      setForgotPasswordSuccess(true)
    } catch (err: unknown) {
      setForgotPasswordError(err instanceof Error ? err.message : t('auth.forgotPassword.error'))
    } finally {
      setForgotPasswordLoading(false)
    }
  }

  const handleShowForgotPassword = () => {
    setForgotPasswordEmail(getValues('email') || '')
    setShowForgotPassword(true)
  }

  if (showForgotPassword) {
    return (
      <div className="min-h-[calc(100vh-64px)] flex items-center justify-center px-4 py-12 bg-gray-50">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-green-100 mb-4">
              <Sprout className="h-7 w-7 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">{t('auth.forgotPassword.title')}</h1>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border p-8">
            {forgotPasswordError && (
              <div className="mb-4 rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
                {forgotPasswordError}
              </div>
            )}

            {forgotPasswordSuccess ? (
              <div className="flex flex-col items-center justify-center py-6">
                <div className="mb-4 flex items-center justify-center w-16 h-16 rounded-full bg-green-100">
                  <Check className="h-8 w-8 text-green-600" />
                </div>
                <h2 className="mb-2 text-xl font-bold text-gray-900">{t('auth.forgotPassword.successTitle')}</h2>
                <p className="mb-6 text-center text-sm text-gray-500">{t('auth.forgotPassword.successMessage')}</p>
                <button
                  onClick={() => {
                    setShowForgotPassword(false)
                    setForgotPasswordSuccess(false)
                    setForgotPasswordError(null)
                    setForgotPasswordEmail('')
                  }}
                  className="w-full rounded-xl bg-green-600 py-2.5 text-sm font-semibold text-white hover:bg-green-700 transition-colors"
                >
                  {t('auth.forgotPassword.backToLogin')}
                </button>
              </div>
            ) : (
              <form onSubmit={handleForgotPassword} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('auth.forgotPassword.emailLabel')}</label>
                  <input
                    type="email"
                    value={forgotPasswordEmail}
                    onChange={e => setForgotPasswordEmail(e.target.value)}
                    placeholder="tu@email.com"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100 transition-all"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={forgotPasswordLoading}
                  className="w-full rounded-xl bg-green-600 py-2.5 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-60 transition-colors"
                >
                  {forgotPasswordLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      {t('auth.forgotPassword.sending')}
                    </span>
                  ) : (
                    t('auth.forgotPassword.submit')
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setShowForgotPassword(false)
                    setForgotPasswordSuccess(false)
                    setForgotPasswordError(null)
                    setForgotPasswordEmail('')
                  }}
                  className="w-full text-center text-sm text-gray-500 hover:text-gray-700 transition-colors"
                >
                  {t('auth.forgotPassword.backToLogin')}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center px-4 py-12 bg-gray-50">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-green-100 mb-4">
            <Sprout className="h-7 w-7 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">{t('auth.login.subtitle')}</h1>
          <p className="text-gray-500 mt-1 text-sm">{t('auth.login.title')}</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('auth.login.email')}</label>
              <input
                {...register('email')}
                type="email"
                placeholder="tu@email.com"
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100 transition-all"
              />
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('auth.login.password')}</label>
              <div className="relative">
                <input
                  {...register('password')}
                  type={showPass ? 'text' : 'password'}
                  placeholder="••••••••"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100 transition-all pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleShowForgotPassword}
                className="text-sm text-green-600 hover:text-green-700 hover:underline transition-colors"
              >
                {t('auth.login.forgotPassword')}
              </button>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-xl bg-green-600 py-2.5 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-60 transition-colors"
            >
              {isSubmitting ? t('auth.login.loading') : t('auth.login.submit')}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            {t('auth.login.noAccount')}{' '}
            <Link href="/auth/register" className="text-green-600 font-medium hover:underline">
              {t('auth.login.registerLink')}
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
