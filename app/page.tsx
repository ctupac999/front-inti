'use client'

import Link from 'next/link'
import { Sprout, ArrowRight, Leaf, Handshake, MapPin } from 'lucide-react'
import { useLanguage } from '@/contexts/language-context'

export default function HomePage() {
  const { t } = useLanguage()
  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 py-24 px-4">
        <div className="container mx-auto max-w-4xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-green-100 px-4 py-1.5 text-sm font-medium text-green-700 mb-6">
            <Leaf className="size-4" />
            {t('home.badge')}
          </div>
          <h1 className="text-5xl md:text-6xl font-semibold text-zinc-900 mb-6 leading-tight">
            {t('home.hero.title1')}{' '}
            <span className="text-green-600">{t('home.hero.title2')}</span>
          </h1>
          <p className="text-xl text-zinc-600 max-w-2xl mx-auto mb-10">
            {t('home.hero.subtitle')}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/productos"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-green-600 px-8 py-3.5 text-base font-semibold text-white hover:bg-green-700 transition-colors shadow-lg shadow-green-200"
            >
              {t('home.hero.cta.products')}
              <ArrowRight className="size-5" />
            </Link>
            <Link
              href="/auth/register"
              className="inline-flex items-center justify-center gap-2 rounded-xl border-2 border-green-600 px-8 py-3.5 text-base font-semibold text-green-700 hover:bg-green-50 transition-colors"
            >
              {t('home.hero.cta.register')}
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4 bg-white">
        <div className="container mx-auto max-w-5xl">
          <h2 className="text-3xl font-semibold text-center text-zinc-900 mb-12">
            {t('home.howItWorks.title')}
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="rounded-2xl bg-green-50 p-8 text-center hover:shadow-md transition-shadow">
              <div className="inline-flex items-center justify-center size-16 rounded-full bg-white shadow-sm mb-4">
                <Sprout className="size-8 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-zinc-900 mb-2">{t('home.step1.title')}</h3>
              <p className="text-zinc-600 text-sm">{t('home.step1.desc')}</p>
            </div>
            <div className="rounded-2xl bg-green-50 p-8 text-center hover:shadow-md transition-shadow">
              <div className="inline-flex items-center justify-center size-16 rounded-full bg-white shadow-sm mb-4">
                <MapPin className="size-8 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-zinc-900 mb-2">{t('home.step2.title')}</h3>
              <p className="text-zinc-600 text-sm">{t('home.step2.desc')}</p>
            </div>
            <div className="rounded-2xl bg-green-50 p-8 text-center hover:shadow-md transition-shadow">
              <div className="inline-flex items-center justify-center size-16 rounded-full bg-white shadow-sm mb-4">
                <Handshake className="size-8 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-zinc-900 mb-2">{t('home.step3.title')}</h3>
              <p className="text-zinc-600 text-sm">{t('home.step3.desc')}</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 bg-green-700">
        <div className="container mx-auto max-w-3xl text-center text-white">
          <h2 className="text-3xl font-semibold mb-4">{t('home.cta.title')}</h2>
          <p className="text-green-100 mb-8 text-lg">{t('home.cta.subtitle')}</p>
          <Link
            href="/auth/register"
            className="inline-flex items-center gap-2 rounded-xl bg-white px-8 py-3.5 text-base font-semibold text-green-700 hover:bg-green-50 transition-colors"
          >
            {t('home.cta.button')} <ArrowRight className="size-5" />
          </Link>
        </div>
      </section>
    </div>
  )
}
