'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { useLanguage } from '@/contexts/language-context'
import { submitContact } from '@/services/contact-service'
import { Loader2, Check, Sprout, Mail, MessageSquare, User, AtSign } from 'lucide-react'
import { toast } from 'sonner'

export default function ContactPage() {
  const { user, isAuthenticated } = useAuth()
  const { t } = useLanguage()

  const [name, setName] = useState(user?.firstName ?? '')
  const [email, setEmail] = useState(user?.email ?? '')
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!subject.trim() || !message.trim()) return
    setSending(true)
    try {
      await submitContact({
        name: isAuthenticated ? undefined : name,
        email: isAuthenticated ? undefined : email,
        subject: subject.trim(),
        message: message.trim(),
      })
      setSent(true)
      toast.success('Mensaje enviado correctamente')
    } catch {
      toast.error('Error al enviar el mensaje. Intentalo de nuevo.')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="min-h-[calc(100vh-64px)] bg-gradient-to-br from-green-50 via-white to-emerald-50">
      <div className="mx-auto max-w-2xl px-4 py-16">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 shadow-lg shadow-green-200 mb-5">
            <Mail className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{t('common.contact')}</h1>
          <p className="text-gray-500">Tienes una consulta? Completa el formulario y te responderemos a la brevedad.</p>
        </div>

        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
          {sent ? (
            <div className="flex flex-col items-center py-12">
              <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mb-6">
                <Check className="h-10 w-10 text-green-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Mensaje enviado</h2>
              <p className="text-gray-500 text-center max-w-sm">
                Gracias por escribirnos. Revisaremos tu consulta y te responderemos pronto.
              </p>
              <button
                onClick={() => { setSent(false); setSubject(''); setMessage('') }}
                className="mt-6 text-sm text-green-600 hover:text-green-700 font-medium transition-colors"
              >
                Enviar otro mensaje
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {!isAuthenticated && (
                <>
                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1.5">
                      <User className="h-4 w-4 text-gray-400" />
                      Nombre
                    </label>
                    <input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Tu nombre"
                      className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-green-400 focus:ring-2 focus:ring-green-50 transition-all"
                    />
                  </div>
                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1.5">
                      <AtSign className="h-4 w-4 text-gray-400" />
                      Email
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="tu@email.com"
                      className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-green-400 focus:ring-2 focus:ring-green-50 transition-all"
                    />
                  </div>
                </>
              )}

              {isAuthenticated && (
                <div className="rounded-xl bg-green-50 border border-green-100 p-4 text-sm text-green-800">
                  <span className="font-semibold">Conectado como:</span>{' '}
                  {user?.firstName} {user?.lastName} ({user?.email})
                </div>
              )}

              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1.5">
                  <MessageSquare className="h-4 w-4 text-gray-400" />
                  Asunto
                </label>
                <select
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  required
                  className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-green-400 focus:ring-2 focus:ring-green-50 transition-all bg-white"
                >
                  <option value="">Selecciona un motivo</option>
                  <option value="consulta">Consulta general</option>
                  <option value="soporte">Soporte técnico</option>
                  <option value="sugerencia">Sugerencia</option>
                  <option value="reporte">Reportar un problema</option>
                  <option value="otro">Otro</option>
                </select>
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1.5">
                  <MessageSquare className="h-4 w-4 text-gray-400" />
                  Mensaje
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={5}
                  required
                  placeholder="Escribí tu consulta acá..."
                  className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-green-400 focus:ring-2 focus:ring-green-50 transition-all resize-y"
                />
              </div>

              <button
                type="submit"
                disabled={sending || !subject || !message}
                className="w-full rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 py-3 text-sm font-semibold text-white hover:from-green-700 hover:to-emerald-700 disabled:opacity-50 transition-all shadow-sm shadow-green-200"
              >
                {sending ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Enviando...
                  </span>
                ) : (
                  'Enviar mensaje'
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
