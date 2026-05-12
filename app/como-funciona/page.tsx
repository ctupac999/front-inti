'use client'

import { Sprout, MapPin, Handshake, CheckCircle, ArrowRight, Leaf, Camera, MessageCircle } from 'lucide-react'
import Link from 'next/link'
import { useLanguage } from '@/contexts/language-context'

export default function ComoFuncionaPage() {
  const { t } = useLanguage()

  const steps = [
    { icon: <Sprout className="size-8 text-green-600" />, number: t('howItWorks.step1.number'), title: t('howItWorks.step1.title'), description: t('howItWorks.step1.desc') },
    { icon: <Camera className="size-8 text-green-600" />, number: t('howItWorks.step2.number'), title: t('howItWorks.step2.title'), description: t('howItWorks.step2.desc') },
    { icon: <MapPin className="size-8 text-green-600" />, number: t('howItWorks.step3.number'), title: t('howItWorks.step3.title'), description: t('howItWorks.step3.desc') },
    { icon: <MessageCircle className="size-8 text-green-600" />, number: t('howItWorks.step4.number'), title: t('howItWorks.step4.title'), description: t('howItWorks.step4.desc') },
    { icon: <Handshake className="size-8 text-green-600" />, number: t('howItWorks.step5.number'), title: t('howItWorks.step5.title'), description: t('howItWorks.step5.desc') },
    { icon: <CheckCircle className="size-8 text-green-600" />, number: t('howItWorks.step6.number'), title: t('howItWorks.step6.title'), description: t('howItWorks.step6.desc') },
  ]

  const faqs = [
    { q: t('howItWorks.faq.q1'), a: t('howItWorks.faq.a1') },
    { q: t('howItWorks.faq.q2'), a: t('howItWorks.faq.a2') },
    { q: t('howItWorks.faq.q3'), a: t('howItWorks.faq.a3') },
    { q: t('howItWorks.faq.q4'), a: t('howItWorks.faq.a4') },
    { q: t('howItWorks.faq.q5'), a: t('howItWorks.faq.a5') },
  ]

  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 py-20 px-4">
        <div className="container mx-auto max-w-3xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-green-100 px-4 py-1.5 text-sm font-medium text-green-700 mb-6">
            <Leaf className="size-4" />
            {t('howItWorks.badge')}
          </div>
          <h1 className="text-4xl md:text-5xl font-semibold text-zinc-900 mb-5 leading-tight">
            {t('howItWorks.title').replace('INTI', '')} <span className="text-green-600">INTI</span>?
          </h1>
          <p className="text-lg text-zinc-600 max-w-xl mx-auto">
            {t('howItWorks.subtitle')}
          </p>
        </div>
      </section>

      {/* Steps */}
      <section className="py-20 px-4 bg-white">
        <div className="container mx-auto max-w-4xl">
          <div className="grid md:grid-cols-2 gap-8">
            {steps.map((step) => (
              <div
                key={step.number}
                className="flex gap-5 rounded-2xl border border-gray-100 bg-gray-50 p-6 hover:border-green-200 hover:shadow-sm transition-all"
              >
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center size-14 rounded-2xl bg-white shadow-sm">
                    {step.icon}
                  </div>
                </div>
                <div>
                  <span className="text-xs font-bold text-green-500 tracking-widest">{step.number}</span>
                  <h3 className="text-base font-semibold text-zinc-900 mt-0.5 mb-2">{step.title}</h3>
                  <p className="text-sm text-zinc-600 leading-relaxed">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 px-4 bg-gray-50">
        <div className="container mx-auto max-w-3xl">
          <h2 className="text-3xl font-semibold text-center text-zinc-900 mb-12">{t('howItWorks.faq.title')}</h2>
          <div className="space-y-4">
            {faqs.map((faq, i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-100 p-6">
                <h3 className="font-semibold text-zinc-900 mb-2">{faq.q}</h3>
                <p className="text-sm text-zinc-600 leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 bg-green-700">
        <div className="container mx-auto max-w-3xl text-center text-white">
          <h2 className="text-3xl font-semibold mb-4">{t('howItWorks.cta.title')}</h2>
          <p className="text-green-100 mb-8 text-lg">{t('howItWorks.cta.subtitle')}</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/auth/register"
              className="inline-flex items-center gap-2 rounded-xl bg-white px-8 py-3.5 text-base font-semibold text-green-700 hover:bg-green-50 transition-colors"
            >
              {t('howItWorks.cta.register')} <ArrowRight className="size-5" />
            </Link>
            <Link
              href="/productos"
              className="inline-flex items-center gap-2 rounded-xl border-2 border-white px-8 py-3.5 text-base font-semibold text-white hover:bg-green-600 transition-colors"
            >
              {t('howItWorks.cta.products')}
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
