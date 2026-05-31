'use client'

import { useEffect, useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAuth } from '@/contexts/auth-context'
import { useLanguage } from '@/contexts/language-context'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import { Sprout, Eye, EyeOff } from 'lucide-react'
import PhoneInput from '@/components/ui/PhoneInput'
import { getLegalVersion } from '@/services/legal-service'

const getErrorMessage = (err: unknown, fallback: string) => {
  if (err instanceof Error && err.message) return err.message
  return fallback
}

const schema = z.object({
  firstName: z.string().min(2),
  lastName: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  phone: z.string().optional(),
  acceptedTerms: z.boolean().refine((v) => v, {
    message: 'auth.register.terms.required',
  }),
  acceptedPrivacy: z.boolean().refine((v) => v, {
    message: 'auth.register.privacy.required',
  }),
  marketingConsent: z.boolean().optional(),
})

type FormData = z.infer<typeof schema>

export default function RegisterPage() {
  const { register: registerUser } = useAuth()
  const { t } = useLanguage()
  const router = useRouter()
  const [showPass, setShowPass] = useState(false)
  const [legalVersion, setLegalVersion] = useState(process.env.NEXT_PUBLIC_LEGAL_VERSION ?? 'v1.0')

  useEffect(() => {
    getLegalVersion()
      .then((res) => setLegalVersion(res.legalVersion || 'v1.0'))
      .catch(() => null)
  }, [])

  const { register, handleSubmit, control, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      acceptedTerms: false,
      acceptedPrivacy: false,
      marketingConsent: false,
    },
  })

  const onSubmit = async (data: FormData) => {
    try {
      await registerUser({
        ...data,
        legalVersion,
      })
      toast.success(t('auth.register.success'))
      router.push('/dashboard')
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, t('auth.register.error')))
    }
  }

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center px-4 py-12 bg-gray-50">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-green-100 mb-4">
            <Sprout className="h-7 w-7 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">{t('auth.register.title')}</h1>
          <p className="text-gray-500 mt-1 text-sm">{t('auth.register.subtitle')}</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('auth.register.firstName')}</label>
                <input
                  {...register('firstName')}
                  placeholder="Juan"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100 transition-all"
                />
                {errors.firstName && <p className="text-red-500 text-xs mt-1">{errors.firstName.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('auth.register.lastName')}</label>
                <input
                  {...register('lastName')}
                  placeholder="García"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100 transition-all"
                />
                {errors.lastName && <p className="text-red-500 text-xs mt-1">{errors.lastName.message}</p>}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('auth.register.email')}</label>
              <input
                {...register('email')}
                type="email"
                placeholder="tu@email.com"
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100 transition-all"
              />
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
            </div>

            <Controller
              control={control}
              name="phone"
              render={({ field }) => (
                <PhoneInput
                  label={t('auth.register.phone')}
                  value={field.value ?? ''}
                  onChange={field.onChange}
                />
              )}
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('auth.register.password')}</label>
              <div className="relative">
                <input
                  {...register('password')}
                  type={showPass ? 'text' : 'password'}
                  placeholder={t('auth.register.passwordPlaceholder')}
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

            <div className="space-y-3 rounded-xl border border-gray-200 bg-gray-50 p-4">
              <label className="flex items-start gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  {...register('acceptedTerms')}
                  className="mt-1 h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
                />
                <span>
                  {t('auth.register.terms.accept')}{' '}
                  <Link href="/legal/terms" target="_blank" className="font-medium text-green-700 hover:underline">
                    {t('auth.register.terms.link')}
                  </Link>
                  .
                </span>
              </label>
              {errors.acceptedTerms && (
                <p className="text-red-500 text-xs -mt-1">{t('auth.register.terms.required')}</p>
              )}

              <label className="flex items-start gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  {...register('acceptedPrivacy')}
                  className="mt-1 h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
                />
                <span>
                  {t('auth.register.privacy.accept')}{' '}
                  <Link href="/legal/privacy" target="_blank" className="font-medium text-green-700 hover:underline">
                    {t('auth.register.privacy.link')}
                  </Link>
                  .
                </span>
              </label>
              {errors.acceptedPrivacy && (
                <p className="text-red-500 text-xs -mt-1">{t('auth.register.privacy.required')}</p>
              )}

              <label className="flex items-start gap-2 text-sm text-gray-600">
                <input
                  type="checkbox"
                  {...register('marketingConsent')}
                  className="mt-1 h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
                />
                <span>{t('auth.register.marketing.label')}</span>
              </label>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-xl bg-green-600 py-2.5 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-60 transition-colors mt-2"
            >
              {isSubmitting ? t('auth.register.loading') : t('auth.register.submit')}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            {t('auth.register.hasAccount')}{' '}
            <Link href="/auth/login" className="text-green-600 font-medium hover:underline">
              {t('auth.register.loginLink')}
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
