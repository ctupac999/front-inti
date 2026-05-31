'use client'

import { useEffect, useState, useCallback } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
  Mail, Save, Trash2, Eye, EyeOff, ChevronLeft,
  Code2, RefreshCw, Loader2,
} from 'lucide-react'
import {
  getAllEmailTemplates,
  upsertEmailTemplate,
  deleteEmailTemplate,
  type EmailTemplate,
} from '@/services/email-templates-service'

// ─── Config ────────────────────────────────────────────────────────────────────

const LOCALES: { code: string; label: string; flag: string }[] = [
  { code: 'es',    label: 'Español',      flag: '🇪🇸' },
  { code: 'es-ar', label: 'Español (AR)', flag: '🇦🇷' },
  { code: 'en',    label: 'English',      flag: '🇺🇸' },
  { code: 'pt',    label: 'Português',    flag: '🇧🇷' },
  { code: 'qu',    label: 'Quechua',      flag: '🌄' },
]

interface TemplateKey {
  key: string
  group: string
  label: string
}

const TEMPLATE_KEYS: TemplateKey[] = [
  { key: 'USER_REGISTRATION', group: 'Autenticación', label: 'Bienvenida / Registro' },
  { key: 'PASSWORD_RESET',    group: 'Autenticación', label: 'Recuperación de contraseña' },
  { key: 'TRADE_ACCEPTED',    group: 'Trueques',      label: 'Trueque aceptado' },
  { key: 'TRADE_REJECTED',    group: 'Trueques',      label: 'Trueque rechazado' },
  { key: 'TRADE_COMPLETED',   group: 'Trueques',      label: 'Trueque completado' },
]

const KEY_PLACEHOLDERS: Record<string, string[]> = {
  USER_REGISTRATION: ['firstName', 'lastName', 'email', 'phone', 'dashboardUrl', 'loginUrl', 'websiteUrl', 'contactUrl', 'registrationDate'],
  PASSWORD_RESET:    ['firstName', 'email', 'resetUrl', 'expiresIn'],
  TRADE_ACCEPTED:    ['firstName', 'tradeId', 'productName', 'counterpartName', 'dashboardUrl'],
  TRADE_REJECTED:    ['firstName', 'tradeId', 'productName', 'dashboardUrl'],
  TRADE_COMPLETED:   ['firstName', 'tradeId', 'productName', 'counterpartName', 'completedDate', 'dashboardUrl'],
}

const SAMPLE_VARS: Record<string, Record<string, string>> = {
  USER_REGISTRATION: {
    firstName: 'María',
    lastName: 'González',
    email: 'maria@ejemplo.com',
    phone: '+54 9 11 1234-5678',
    dashboardUrl: 'http://localhost:3000/dashboard',
    loginUrl: 'http://localhost:3000/auth/login',
    websiteUrl: 'http://localhost:3000',
    contactUrl: 'http://localhost:3000/contact',
    registrationDate: new Date().toLocaleDateString('es-AR', { year: 'numeric', month: 'long', day: 'numeric' }),
  },
  PASSWORD_RESET: {
    firstName: 'María',
    email: 'maria@ejemplo.com',
    resetUrl: 'http://localhost:3000/auth/reset?token=abc123',
    expiresIn: '24 horas',
  },
  TRADE_ACCEPTED: {
    firstName: 'María',
    tradeId: 'TRD-0001',
    productName: 'Tomates cherry',
    counterpartName: 'Carlos López',
    dashboardUrl: 'http://localhost:3000/dashboard',
  },
  TRADE_REJECTED: {
    firstName: 'María',
    tradeId: 'TRD-0001',
    productName: 'Tomates cherry',
    dashboardUrl: 'http://localhost:3000/dashboard',
  },
  TRADE_COMPLETED: {
    firstName: 'María',
    tradeId: 'TRD-0001',
    productName: 'Tomates cherry',
    counterpartName: 'Carlos López',
    completedDate: new Date().toLocaleDateString('es-AR', { year: 'numeric', month: 'long', day: 'numeric' }),
    dashboardUrl: 'http://localhost:3000/dashboard',
  },
}

// ─── Default HTML templates ────────────────────────────────────────────────────

const DEFAULT_TEMPLATES: Record<string, Record<string, { subject: string; html: string }>> = {
  USER_REGISTRATION: {
    es: {
      subject: '¡Bienvenido/a a INTI, {{firstName}}!',
      html: `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><title>Bienvenida</title></head>
<body style="font-family:Arial,sans-serif;background:#f4f7f0;margin:0;padding:0">
  <div style="max-width:600px;margin:32px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 2px 12px #0001">
    <div style="background:#2d6a4f;padding:32px 40px;text-align:center">
      <h1 style="color:#fff;margin:0;font-size:28px">🌱 INTI</h1>
      <p style="color:#b7e4c7;margin:8px 0 0;font-size:14px">Trueque del Campo</p>
    </div>
    <div style="padding:40px">
      <h2 style="color:#1b4332;margin:0 0 16px">¡Bienvenido/a, {{firstName}}!</h2>
      <p style="color:#555;line-height:1.7">Tu cuenta en INTI fue creada exitosamente el <strong>{{registrationDate}}</strong>.</p>
      <p style="color:#555;line-height:1.7">Ahora podés publicar tus productos, explorar lo que otros ofrecen y comenzar a intercambiar de manera justa y sustentable.</p>
      <div style="text-align:center;margin:32px 0">
        <a href="{{dashboardUrl}}" style="background:#2d6a4f;color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:16px">Ir a mi panel →</a>
      </div>
      <hr style="border:none;border-top:1px solid #e5e7eb;margin:32px 0">
      <p style="color:#999;font-size:12px;text-align:center">Si tenés dudas escribinos a <a href="{{contactUrl}}" style="color:#2d6a4f">{{contactUrl}}</a></p>
    </div>
    <div style="background:#f0faf5;padding:16px 40px;text-align:center">
      <p style="color:#aaa;font-size:11px;margin:0">© {{registrationDate}} INTI — Trueque del Campo</p>
    </div>
  </div>
</body>
</html>`,
    },
    en: {
      subject: 'Welcome to INTI, {{firstName}}!',
      html: `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><title>Welcome</title></head>
<body style="font-family:Arial,sans-serif;background:#f4f7f0;margin:0;padding:0">
  <div style="max-width:600px;margin:32px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 2px 12px #0001">
    <div style="background:#2d6a4f;padding:32px 40px;text-align:center">
      <h1 style="color:#fff;margin:0;font-size:28px">🌱 INTI</h1>
      <p style="color:#b7e4c7;margin:8px 0 0;font-size:14px">Field Barter</p>
    </div>
    <div style="padding:40px">
      <h2 style="color:#1b4332;margin:0 0 16px">Welcome, {{firstName}}!</h2>
      <p style="color:#555;line-height:1.7">Your INTI account was created on <strong>{{registrationDate}}</strong>.</p>
      <p style="color:#555;line-height:1.7">You can now list your products, explore what others offer and start trading in a fair and sustainable way.</p>
      <div style="text-align:center;margin:32px 0">
        <a href="{{dashboardUrl}}" style="background:#2d6a4f;color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:16px">Go to my dashboard →</a>
      </div>
      <hr style="border:none;border-top:1px solid #e5e7eb;margin:32px 0">
      <p style="color:#999;font-size:12px;text-align:center">Questions? Contact us at <a href="{{contactUrl}}" style="color:#2d6a4f">{{contactUrl}}</a></p>
    </div>
    <div style="background:#f0faf5;padding:16px 40px;text-align:center">
      <p style="color:#aaa;font-size:11px;margin:0">© INTI — Field Barter</p>
    </div>
  </div>
</body>
</html>`,
    },
    pt: {
      subject: 'Bem-vindo(a) ao INTI, {{firstName}}!',
      html: `<!DOCTYPE html>
<html lang="pt">
<head><meta charset="UTF-8"><title>Boas-vindas</title></head>
<body style="font-family:Arial,sans-serif;background:#f4f7f0;margin:0;padding:0">
  <div style="max-width:600px;margin:32px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 2px 12px #0001">
    <div style="background:#2d6a4f;padding:32px 40px;text-align:center">
      <h1 style="color:#fff;margin:0;font-size:28px">🌱 INTI</h1>
      <p style="color:#b7e4c7;margin:8px 0 0;font-size:14px">Troca do Campo</p>
    </div>
    <div style="padding:40px">
      <h2 style="color:#1b4332;margin:0 0 16px">Bem-vindo(a), {{firstName}}!</h2>
      <p style="color:#555;line-height:1.7">Sua conta no INTI foi criada em <strong>{{registrationDate}}</strong>.</p>
      <p style="color:#555;line-height:1.7">Agora você pode publicar seus produtos, explorar o que outros oferecem e começar a trocar de forma justa e sustentável.</p>
      <div style="text-align:center;margin:32px 0">
        <a href="{{dashboardUrl}}" style="background:#2d6a4f;color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:16px">Ir ao painel →</a>
      </div>
      <hr style="border:none;border-top:1px solid #e5e7eb;margin:32px 0">
      <p style="color:#999;font-size:12px;text-align:center">Dúvidas? <a href="{{contactUrl}}" style="color:#2d6a4f">{{contactUrl}}</a></p>
    </div>
  </div>
</body>
</html>`,
    },
    'es-ar': {
      subject: '¡Bienvenido/a a INTI, {{firstName}}!',
      html: `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><title>Bienvenida</title></head>
<body style="font-family:Arial,sans-serif;background:#f4f7f0;margin:0;padding:0">
  <div style="max-width:600px;margin:32px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 2px 12px #0001">
    <div style="background:#2d6a4f;padding:32px 40px;text-align:center">
      <h1 style="color:#fff;margin:0;font-size:28px">🌱 INTI</h1>
      <p style="color:#b7e4c7;margin:8px 0 0;font-size:14px">Trueque del Campo</p>
    </div>
    <div style="padding:40px">
      <h2 style="color:#1b4332;margin:0 0 16px">¡Bienvenido/a, {{firstName}}!</h2>
      <p style="color:#555;line-height:1.7">Tu cuenta en INTI fue creada exitosamente el <strong>{{registrationDate}}</strong>.</p>
      <p style="color:#555;line-height:1.7">Ahora podés publicar tus productos, explorar lo que otros ofrecen y empezar a intercambiar de manera justa y sustentable.</p>
      <div style="text-align:center;margin:32px 0">
        <a href="{{dashboardUrl}}" style="background:#2d6a4f;color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:16px">Ir a mi panel →</a>
      </div>
      <hr style="border:none;border-top:1px solid #e5e7eb;margin:32px 0">
      <p style="color:#999;font-size:12px;text-align:center">Si tenés dudas escribinos a <a href="{{contactUrl}}" style="color:#2d6a4f">{{contactUrl}}</a></p>
    </div>
    <div style="background:#f0faf5;padding:16px 40px;text-align:center">
      <p style="color:#aaa;font-size:11px;margin:0">© {{registrationDate}} INTI — Trueque del Campo</p>
    </div>
  </div>
</body>
</html>`,
    },
    qu: {
      subject: 'INTI-pi Allin Hamuqti, {{firstName}}!',
      html: `<!DOCTYPE html>
<html lang="qu">
<head><meta charset="UTF-8"><title>Allin Hamuqti</title></head>
<body style="font-family:Arial,sans-serif;background:#f4f7f0;margin:0;padding:0">
  <div style="max-width:600px;margin:32px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 2px 12px #0001">
    <div style="background:#2d6a4f;padding:32px 40px;text-align:center">
      <h1 style="color:#fff;margin:0;font-size:28px">🌱 INTI</h1>
      <p style="color:#b7e4c7;margin:8px 0 0;font-size:14px">Chakra Tinkuy</p>
    </div>
    <div style="padding:40px">
      <h2 style="color:#1b4332;margin:0 0 16px">Allin Hamuqti, {{firstName}}!</h2>
      <p style="color:#555;line-height:1.7">Qam INTI-pi cuentayki <strong>{{registrationDate}}</strong>-pi allinmanta rurasqa.</p>
      <p style="color:#555;line-height:1.7">Kunanmi atinki productosniykita riqsichiyta, wakin qunquriqkunata maskayta, allinmanta tinkuyta ima.</p>
      <div style="text-align:center;margin:32px 0">
        <a href="{{dashboardUrl}}" style="background:#2d6a4f;color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:16px">Panelniyman Riy →</a>
      </div>
      <hr style="border:none;border-top:1px solid #e5e7eb;margin:32px 0">
      <p style="color:#999;font-size:12px;text-align:center">Tapukuykikunapaq: <a href="{{contactUrl}}" style="color:#2d6a4f">{{contactUrl}}</a></p>
    </div>
    <div style="background:#f0faf5;padding:16px 40px;text-align:center">
      <p style="color:#aaa;font-size:11px;margin:0">© INTI — Chakra Tinkuy</p>
    </div>
  </div>
</body>
</html>`,
    },
  },
  PASSWORD_RESET: {
    es: {
      subject: 'Recuperá tu contraseña en INTI',
      html: `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><title>Recuperar contraseña</title></head>
<body style="font-family:Arial,sans-serif;background:#f4f7f0;margin:0;padding:0">
  <div style="max-width:600px;margin:32px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 2px 12px #0001">
    <div style="background:#2d6a4f;padding:32px 40px;text-align:center">
      <h1 style="color:#fff;margin:0;font-size:28px">🌱 INTI</h1>
      <p style="color:#b7e4c7;margin:8px 0 0;font-size:14px">Trueque del Campo</p>
    </div>
    <div style="padding:40px">
      <h2 style="color:#1b4332;margin:0 0 16px">Hola, {{firstName}}</h2>
      <p style="color:#555;line-height:1.7">Recibimos una solicitud para restablecer la contraseña de tu cuenta <strong>{{email}}</strong>.</p>
      <p style="color:#555;line-height:1.7">Hacé clic en el botón para crear una nueva contraseña. El enlace expira en <strong>{{expiresIn}}</strong>.</p>
      <div style="text-align:center;margin:32px 0">
        <a href="{{resetUrl}}" style="background:#2d6a4f;color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:16px">Restablecer contraseña →</a>
      </div>
      <hr style="border:none;border-top:1px solid #e5e7eb;margin:32px 0">
      <p style="color:#999;font-size:12px;text-align:center">Si no solicitaste este cambio, ignorá este correo. Tu contraseña no será modificada.</p>
    </div>
    <div style="background:#f0faf5;padding:16px 40px;text-align:center">
      <p style="color:#aaa;font-size:11px;margin:0">© INTI — Trueque del Campo</p>
    </div>
  </div>
</body>
</html>`,
    },
    'es-ar': {
      subject: 'Recuperá tu contraseña en INTI',
      html: `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><title>Recuperar contraseña</title></head>
<body style="font-family:Arial,sans-serif;background:#f4f7f0;margin:0;padding:0">
  <div style="max-width:600px;margin:32px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 2px 12px #0001">
    <div style="background:#2d6a4f;padding:32px 40px;text-align:center">
      <h1 style="color:#fff;margin:0;font-size:28px">🌱 INTI</h1>
      <p style="color:#b7e4c7;margin:8px 0 0;font-size:14px">Trueque del Campo</p>
    </div>
    <div style="padding:40px">
      <h2 style="color:#1b4332;margin:0 0 16px">Hola, {{firstName}}</h2>
      <p style="color:#555;line-height:1.7">Recibimos una solicitud para restablecer la contraseña de tu cuenta <strong>{{email}}</strong>.</p>
      <p style="color:#555;line-height:1.7">Hacé clic en el botón para crear una nueva contraseña. El enlace expira en <strong>{{expiresIn}}</strong>.</p>
      <div style="text-align:center;margin:32px 0">
        <a href="{{resetUrl}}" style="background:#2d6a4f;color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:16px">Restablecer contraseña →</a>
      </div>
      <hr style="border:none;border-top:1px solid #e5e7eb;margin:32px 0">
      <p style="color:#999;font-size:12px;text-align:center">Si no pediste este cambio, ignorá este correo. Tu contraseña no va a ser modificada.</p>
    </div>
    <div style="background:#f0faf5;padding:16px 40px;text-align:center">
      <p style="color:#aaa;font-size:11px;margin:0">© INTI — Trueque del Campo</p>
    </div>
  </div>
</body>
</html>`,
    },
    en: {
      subject: 'Reset your INTI password',
      html: `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><title>Reset password</title></head>
<body style="font-family:Arial,sans-serif;background:#f4f7f0;margin:0;padding:0">
  <div style="max-width:600px;margin:32px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 2px 12px #0001">
    <div style="background:#2d6a4f;padding:32px 40px;text-align:center">
      <h1 style="color:#fff;margin:0;font-size:28px">🌱 INTI</h1>
      <p style="color:#b7e4c7;margin:8px 0 0;font-size:14px">Field Barter</p>
    </div>
    <div style="padding:40px">
      <h2 style="color:#1b4332;margin:0 0 16px">Hi, {{firstName}}</h2>
      <p style="color:#555;line-height:1.7">We received a request to reset the password for your account <strong>{{email}}</strong>.</p>
      <p style="color:#555;line-height:1.7">Click the button below to create a new password. The link expires in <strong>{{expiresIn}}</strong>.</p>
      <div style="text-align:center;margin:32px 0">
        <a href="{{resetUrl}}" style="background:#2d6a4f;color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:16px">Reset my password →</a>
      </div>
      <hr style="border:none;border-top:1px solid #e5e7eb;margin:32px 0">
      <p style="color:#999;font-size:12px;text-align:center">If you didn't request this, you can safely ignore this email. Your password will not be changed.</p>
    </div>
    <div style="background:#f0faf5;padding:16px 40px;text-align:center">
      <p style="color:#aaa;font-size:11px;margin:0">© INTI — Field Barter</p>
    </div>
  </div>
</body>
</html>`,
    },
    pt: {
      subject: 'Redefina sua senha no INTI',
      html: `<!DOCTYPE html>
<html lang="pt">
<head><meta charset="UTF-8"><title>Redefinir senha</title></head>
<body style="font-family:Arial,sans-serif;background:#f4f7f0;margin:0;padding:0">
  <div style="max-width:600px;margin:32px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 2px 12px #0001">
    <div style="background:#2d6a4f;padding:32px 40px;text-align:center">
      <h1 style="color:#fff;margin:0;font-size:28px">🌱 INTI</h1>
      <p style="color:#b7e4c7;margin:8px 0 0;font-size:14px">Troca do Campo</p>
    </div>
    <div style="padding:40px">
      <h2 style="color:#1b4332;margin:0 0 16px">Olá, {{firstName}}</h2>
      <p style="color:#555;line-height:1.7">Recebemos uma solicitação para redefinir a senha da sua conta <strong>{{email}}</strong>.</p>
      <p style="color:#555;line-height:1.7">Clique no botão abaixo para criar uma nova senha. O link expira em <strong>{{expiresIn}}</strong>.</p>
      <div style="text-align:center;margin:32px 0">
        <a href="{{resetUrl}}" style="background:#2d6a4f;color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:16px">Redefinir senha →</a>
      </div>
      <hr style="border:none;border-top:1px solid #e5e7eb;margin:32px 0">
      <p style="color:#999;font-size:12px;text-align:center">Se você não solicitou isso, ignore este e-mail. Sua senha não será alterada.</p>
    </div>
    <div style="background:#f0faf5;padding:16px 40px;text-align:center">
      <p style="color:#aaa;font-size:11px;margin:0">© INTI — Troca do Campo</p>
    </div>
  </div>
</body>
</html>`,
    },
    qu: {
      subject: 'INTI-pi Claveykita Tikray',
      html: `<!DOCTYPE html>
<html lang="qu">
<head><meta charset="UTF-8"><title>Clave Tikray</title></head>
<body style="font-family:Arial,sans-serif;background:#f4f7f0;margin:0;padding:0">
  <div style="max-width:600px;margin:32px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 2px 12px #0001">
    <div style="background:#2d6a4f;padding:32px 40px;text-align:center">
      <h1 style="color:#fff;margin:0;font-size:28px">🌱 INTI</h1>
      <p style="color:#b7e4c7;margin:8px 0 0;font-size:14px">Chakra Tinkuy</p>
    </div>
    <div style="padding:40px">
      <h2 style="color:#1b4332;margin:0 0 16px">Napaykullayki, {{firstName}}</h2>
      <p style="color:#555;line-height:1.7"><strong>{{email}}</strong> cuentaykipa claveykita tikrayta mañarqanki.</p>
      <p style="color:#555;line-height:1.7">Botonta hatariy musuq claveta churanaypaq. Kay enlace <strong>{{expiresIn}}</strong>-kama kallpaniyuq.</p>
      <div style="text-align:center;margin:32px 0">
        <a href="{{resetUrl}}" style="background:#2d6a4f;color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:16px">Claveyta Tikray →</a>
      </div>
      <hr style="border:none;border-top:1px solid #e5e7eb;margin:32px 0">
      <p style="color:#999;font-size:12px;text-align:center">Mana qam mañarqankichu chayqa, kay correoyta saqiy. Claveyki mana tikrasqachu kanqa.</p>
    </div>
    <div style="background:#f0faf5;padding:16px 40px;text-align:center">
      <p style="color:#aaa;font-size:11px;margin:0">© INTI — Chakra Tinkuy</p>
    </div>
  </div>
</body>
</html>`,
    },
  },
  TRADE_ACCEPTED: {
    es: {
      subject: '¡Tu trueque fue aceptado! — {{tradeId}}',
      html: `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><title>Trueque aceptado</title></head>
<body style="font-family:Arial,sans-serif;background:#f4f7f0;margin:0;padding:0">
  <div style="max-width:600px;margin:32px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 2px 12px #0001">
    <div style="background:#2d6a4f;padding:32px 40px;text-align:center">
      <h1 style="color:#fff;margin:0;font-size:28px">🌱 INTI</h1>
      <p style="color:#b7e4c7;margin:8px 0 0;font-size:14px">Trueque del Campo</p>
    </div>
    <div style="padding:40px">
      <div style="text-align:center;margin-bottom:24px">
        <span style="font-size:48px">🤝</span>
      </div>
      <h2 style="color:#1b4332;margin:0 0 16px;text-align:center">¡Tu trueque fue aceptado!</h2>
      <p style="color:#555;line-height:1.7">Hola <strong>{{firstName}}</strong>, buenas noticias: <strong>{{counterpartName}}</strong> aceptó tu propuesta de trueque por <strong>{{productName}}</strong>.</p>
      <p style="color:#555;line-height:1.7">Ahora pueden coordinar los detalles del intercambio directamente desde tu panel.</p>
      <div style="background:#f0faf5;border-radius:12px;padding:16px 24px;margin:24px 0">
        <p style="margin:0;color:#1b4332;font-size:13px"><strong>N° de trueque:</strong> {{tradeId}}</p>
        <p style="margin:8px 0 0;color:#1b4332;font-size:13px"><strong>Producto:</strong> {{productName}}</p>
        <p style="margin:8px 0 0;color:#1b4332;font-size:13px"><strong>Con:</strong> {{counterpartName}}</p>
      </div>
      <div style="text-align:center;margin:32px 0">
        <a href="{{dashboardUrl}}" style="background:#2d6a4f;color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:16px">Ver mi trueque →</a>
      </div>
    </div>
    <div style="background:#f0faf5;padding:16px 40px;text-align:center">
      <p style="color:#aaa;font-size:11px;margin:0">© INTI — Trueque del Campo</p>
    </div>
  </div>
</body>
</html>`,
    },
    'es-ar': {
      subject: '¡Tu trueque fue aceptado! — {{tradeId}}',
      html: `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><title>Trueque aceptado</title></head>
<body style="font-family:Arial,sans-serif;background:#f4f7f0;margin:0;padding:0">
  <div style="max-width:600px;margin:32px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 2px 12px #0001">
    <div style="background:#2d6a4f;padding:32px 40px;text-align:center">
      <h1 style="color:#fff;margin:0;font-size:28px">🌱 INTI</h1>
      <p style="color:#b7e4c7;margin:8px 0 0;font-size:14px">Trueque del Campo</p>
    </div>
    <div style="padding:40px">
      <div style="text-align:center;margin-bottom:24px"><span style="font-size:48px">🤝</span></div>
      <h2 style="color:#1b4332;margin:0 0 16px;text-align:center">¡Tu trueque fue aceptado!</h2>
      <p style="color:#555;line-height:1.7">Hola <strong>{{firstName}}</strong>, buenas noticias: <strong>{{counterpartName}}</strong> aceptó tu propuesta de trueque por <strong>{{productName}}</strong>.</p>
      <p style="color:#555;line-height:1.7">Ahora podés coordinar los detalles del intercambio directo desde tu panel.</p>
      <div style="background:#f0faf5;border-radius:12px;padding:16px 24px;margin:24px 0">
        <p style="margin:0;color:#1b4332;font-size:13px"><strong>N° de trueque:</strong> {{tradeId}}</p>
        <p style="margin:8px 0 0;color:#1b4332;font-size:13px"><strong>Producto:</strong> {{productName}}</p>
        <p style="margin:8px 0 0;color:#1b4332;font-size:13px"><strong>Con:</strong> {{counterpartName}}</p>
      </div>
      <div style="text-align:center;margin:32px 0">
        <a href="{{dashboardUrl}}" style="background:#2d6a4f;color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:16px">Ver mi trueque →</a>
      </div>
    </div>
    <div style="background:#f0faf5;padding:16px 40px;text-align:center">
      <p style="color:#aaa;font-size:11px;margin:0">© INTI — Trueque del Campo</p>
    </div>
  </div>
</body>
</html>`,
    },
    en: {
      subject: 'Your barter was accepted! — {{tradeId}}',
      html: `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><title>Barter accepted</title></head>
<body style="font-family:Arial,sans-serif;background:#f4f7f0;margin:0;padding:0">
  <div style="max-width:600px;margin:32px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 2px 12px #0001">
    <div style="background:#2d6a4f;padding:32px 40px;text-align:center">
      <h1 style="color:#fff;margin:0;font-size:28px">🌱 INTI</h1>
      <p style="color:#b7e4c7;margin:8px 0 0;font-size:14px">Field Barter</p>
    </div>
    <div style="padding:40px">
      <div style="text-align:center;margin-bottom:24px"><span style="font-size:48px">🤝</span></div>
      <h2 style="color:#1b4332;margin:0 0 16px;text-align:center">Your barter was accepted!</h2>
      <p style="color:#555;line-height:1.7">Hi <strong>{{firstName}}</strong>, great news: <strong>{{counterpartName}}</strong> accepted your barter proposal for <strong>{{productName}}</strong>.</p>
      <p style="color:#555;line-height:1.7">You can now coordinate the exchange details directly from your dashboard.</p>
      <div style="background:#f0faf5;border-radius:12px;padding:16px 24px;margin:24px 0">
        <p style="margin:0;color:#1b4332;font-size:13px"><strong>Trade #:</strong> {{tradeId}}</p>
        <p style="margin:8px 0 0;color:#1b4332;font-size:13px"><strong>Product:</strong> {{productName}}</p>
        <p style="margin:8px 0 0;color:#1b4332;font-size:13px"><strong>With:</strong> {{counterpartName}}</p>
      </div>
      <div style="text-align:center;margin:32px 0">
        <a href="{{dashboardUrl}}" style="background:#2d6a4f;color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:16px">View my trade →</a>
      </div>
    </div>
    <div style="background:#f0faf5;padding:16px 40px;text-align:center">
      <p style="color:#aaa;font-size:11px;margin:0">© INTI — Field Barter</p>
    </div>
  </div>
</body>
</html>`,
    },
    pt: {
      subject: 'Sua troca foi aceita! — {{tradeId}}',
      html: `<!DOCTYPE html>
<html lang="pt">
<head><meta charset="UTF-8"><title>Troca aceita</title></head>
<body style="font-family:Arial,sans-serif;background:#f4f7f0;margin:0;padding:0">
  <div style="max-width:600px;margin:32px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 2px 12px #0001">
    <div style="background:#2d6a4f;padding:32px 40px;text-align:center">
      <h1 style="color:#fff;margin:0;font-size:28px">🌱 INTI</h1>
      <p style="color:#b7e4c7;margin:8px 0 0;font-size:14px">Troca do Campo</p>
    </div>
    <div style="padding:40px">
      <div style="text-align:center;margin-bottom:24px"><span style="font-size:48px">🤝</span></div>
      <h2 style="color:#1b4332;margin:0 0 16px;text-align:center">Sua troca foi aceita!</h2>
      <p style="color:#555;line-height:1.7">Olá <strong>{{firstName}}</strong>, ótimas notícias: <strong>{{counterpartName}}</strong> aceitou sua proposta de troca por <strong>{{productName}}</strong>.</p>
      <p style="color:#555;line-height:1.7">Agora você pode combinar os detalhes da troca diretamente pelo painel.</p>
      <div style="background:#f0faf5;border-radius:12px;padding:16px 24px;margin:24px 0">
        <p style="margin:0;color:#1b4332;font-size:13px"><strong>N° da troca:</strong> {{tradeId}}</p>
        <p style="margin:8px 0 0;color:#1b4332;font-size:13px"><strong>Produto:</strong> {{productName}}</p>
        <p style="margin:8px 0 0;color:#1b4332;font-size:13px"><strong>Com:</strong> {{counterpartName}}</p>
      </div>
      <div style="text-align:center;margin:32px 0">
        <a href="{{dashboardUrl}}" style="background:#2d6a4f;color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:16px">Ver minha troca →</a>
      </div>
    </div>
    <div style="background:#f0faf5;padding:16px 40px;text-align:center">
      <p style="color:#aaa;font-size:11px;margin:0">© INTI — Troca do Campo</p>
    </div>
  </div>
</body>
</html>`,
    },
    qu: {
      subject: 'Tinkuykiqa Chaskisqam — {{tradeId}}',
      html: `<!DOCTYPE html>
<html lang="qu">
<head><meta charset="UTF-8"><title>Tinkuy Chaskisqa</title></head>
<body style="font-family:Arial,sans-serif;background:#f4f7f0;margin:0;padding:0">
  <div style="max-width:600px;margin:32px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 2px 12px #0001">
    <div style="background:#2d6a4f;padding:32px 40px;text-align:center">
      <h1 style="color:#fff;margin:0;font-size:28px">🌱 INTI</h1>
      <p style="color:#b7e4c7;margin:8px 0 0;font-size:14px">Chakra Tinkuy</p>
    </div>
    <div style="padding:40px">
      <div style="text-align:center;margin-bottom:24px"><span style="font-size:48px">🤝</span></div>
      <h2 style="color:#1b4332;margin:0 0 16px;text-align:center">Tinkuykiqa Chaskisqam!</h2>
      <p style="color:#555;line-height:1.7">Napaykullayki <strong>{{firstName}}</strong>, allin willaymi: <strong>{{counterpartName}}</strong> tinkuykita <strong>{{productName}}</strong>-manta chaskikurqan.</p>
      <p style="color:#555;line-height:1.7">Kunanmi atinki tinkuy detallesninta panelniykipi rimanakuyta.</p>
      <div style="background:#f0faf5;border-radius:12px;padding:16px 24px;margin:24px 0">
        <p style="margin:0;color:#1b4332;font-size:13px"><strong>Tinkuy N°:</strong> {{tradeId}}</p>
        <p style="margin:8px 0 0;color:#1b4332;font-size:13px"><strong>Producto:</strong> {{productName}}</p>
        <p style="margin:8px 0 0;color:#1b4332;font-size:13px"><strong>Pipim:</strong> {{counterpartName}}</p>
      </div>
      <div style="text-align:center;margin:32px 0">
        <a href="{{dashboardUrl}}" style="background:#2d6a4f;color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:16px">Tinkuyta Rikuy →</a>
      </div>
    </div>
    <div style="background:#f0faf5;padding:16px 40px;text-align:center">
      <p style="color:#aaa;font-size:11px;margin:0">© INTI — Chakra Tinkuy</p>
    </div>
  </div>
</body>
</html>`,
    },
  },
  TRADE_REJECTED: {
    es: {
      subject: 'Tu propuesta de trueque no fue aceptada — {{tradeId}}',
      html: `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><title>Trueque no aceptado</title></head>
<body style="font-family:Arial,sans-serif;background:#f4f7f0;margin:0;padding:0">
  <div style="max-width:600px;margin:32px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 2px 12px #0001">
    <div style="background:#2d6a4f;padding:32px 40px;text-align:center">
      <h1 style="color:#fff;margin:0;font-size:28px">🌱 INTI</h1>
      <p style="color:#b7e4c7;margin:8px 0 0;font-size:14px">Trueque del Campo</p>
    </div>
    <div style="padding:40px">
      <h2 style="color:#1b4332;margin:0 0 16px">Hola, {{firstName}}</h2>
      <p style="color:#555;line-height:1.7">Lamentablemente tu propuesta de trueque por <strong>{{productName}}</strong> (N° {{tradeId}}) no fue aceptada esta vez.</p>
      <p style="color:#555;line-height:1.7">No te desanimes — hay muchos más productores en la plataforma. Explorá nuevas oportunidades desde tu panel.</p>
      <div style="text-align:center;margin:32px 0">
        <a href="{{dashboardUrl}}" style="background:#2d6a4f;color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:16px">Explorar productos →</a>
      </div>
    </div>
    <div style="background:#f0faf5;padding:16px 40px;text-align:center">
      <p style="color:#aaa;font-size:11px;margin:0">© INTI — Trueque del Campo</p>
    </div>
  </div>
</body>
</html>`,
    },
    'es-ar': {
      subject: 'Tu propuesta de trueque no fue aceptada — {{tradeId}}',
      html: `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><title>Trueque no aceptado</title></head>
<body style="font-family:Arial,sans-serif;background:#f4f7f0;margin:0;padding:0">
  <div style="max-width:600px;margin:32px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 2px 12px #0001">
    <div style="background:#2d6a4f;padding:32px 40px;text-align:center">
      <h1 style="color:#fff;margin:0;font-size:28px">🌱 INTI</h1>
      <p style="color:#b7e4c7;margin:8px 0 0;font-size:14px">Trueque del Campo</p>
    </div>
    <div style="padding:40px">
      <h2 style="color:#1b4332;margin:0 0 16px">Hola, {{firstName}}</h2>
      <p style="color:#555;line-height:1.7">Lamentablemente tu propuesta de trueque por <strong>{{productName}}</strong> (N° {{tradeId}}) no fue aceptada esta vez.</p>
      <p style="color:#555;line-height:1.7">No te desanimés — hay muchos más productores en la plataforma. Explorá nuevas oportunidades desde tu panel.</p>
      <div style="text-align:center;margin:32px 0">
        <a href="{{dashboardUrl}}" style="background:#2d6a4f;color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:16px">Explorar productos →</a>
      </div>
    </div>
    <div style="background:#f0faf5;padding:16px 40px;text-align:center">
      <p style="color:#aaa;font-size:11px;margin:0">© INTI — Trueque del Campo</p>
    </div>
  </div>
</body>
</html>`,
    },
    en: {
      subject: 'Your barter proposal was not accepted — {{tradeId}}',
      html: `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><title>Barter not accepted</title></head>
<body style="font-family:Arial,sans-serif;background:#f4f7f0;margin:0;padding:0">
  <div style="max-width:600px;margin:32px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 2px 12px #0001">
    <div style="background:#2d6a4f;padding:32px 40px;text-align:center">
      <h1 style="color:#fff;margin:0;font-size:28px">🌱 INTI</h1>
      <p style="color:#b7e4c7;margin:8px 0 0;font-size:14px">Field Barter</p>
    </div>
    <div style="padding:40px">
      <h2 style="color:#1b4332;margin:0 0 16px">Hi, {{firstName}}</h2>
      <p style="color:#555;line-height:1.7">Unfortunately your barter proposal for <strong>{{productName}}</strong> (Trade #{{tradeId}}) was not accepted this time.</p>
      <p style="color:#555;line-height:1.7">Don't give up — there are many more producers on the platform. Explore new opportunities from your dashboard.</p>
      <div style="text-align:center;margin:32px 0">
        <a href="{{dashboardUrl}}" style="background:#2d6a4f;color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:16px">Explore products →</a>
      </div>
    </div>
    <div style="background:#f0faf5;padding:16px 40px;text-align:center">
      <p style="color:#aaa;font-size:11px;margin:0">© INTI — Field Barter</p>
    </div>
  </div>
</body>
</html>`,
    },
    pt: {
      subject: 'Sua proposta de troca não foi aceita — {{tradeId}}',
      html: `<!DOCTYPE html>
<html lang="pt">
<head><meta charset="UTF-8"><title>Troca não aceita</title></head>
<body style="font-family:Arial,sans-serif;background:#f4f7f0;margin:0;padding:0">
  <div style="max-width:600px;margin:32px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 2px 12px #0001">
    <div style="background:#2d6a4f;padding:32px 40px;text-align:center">
      <h1 style="color:#fff;margin:0;font-size:28px">🌱 INTI</h1>
      <p style="color:#b7e4c7;margin:8px 0 0;font-size:14px">Troca do Campo</p>
    </div>
    <div style="padding:40px">
      <h2 style="color:#1b4332;margin:0 0 16px">Olá, {{firstName}}</h2>
      <p style="color:#555;line-height:1.7">Infelizmente sua proposta de troca por <strong>{{productName}}</strong> (N° {{tradeId}}) não foi aceita desta vez.</p>
      <p style="color:#555;line-height:1.7">Não desanime — há muitos outros produtores na plataforma. Explore novas oportunidades pelo painel.</p>
      <div style="text-align:center;margin:32px 0">
        <a href="{{dashboardUrl}}" style="background:#2d6a4f;color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:16px">Explorar produtos →</a>
      </div>
    </div>
    <div style="background:#f0faf5;padding:16px 40px;text-align:center">
      <p style="color:#aaa;font-size:11px;margin:0">© INTI — Troca do Campo</p>
    </div>
  </div>
</body>
</html>`,
    },
    qu: {
      subject: 'Tinkuy Mañakuyniyki Mana Chaskisqachu — {{tradeId}}',
      html: `<!DOCTYPE html>
<html lang="qu">
<head><meta charset="UTF-8"><title>Tinkuy Mana Chaskisqa</title></head>
<body style="font-family:Arial,sans-serif;background:#f4f7f0;margin:0;padding:0">
  <div style="max-width:600px;margin:32px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 2px 12px #0001">
    <div style="background:#2d6a4f;padding:32px 40px;text-align:center">
      <h1 style="color:#fff;margin:0;font-size:28px">🌱 INTI</h1>
      <p style="color:#b7e4c7;margin:8px 0 0;font-size:14px">Chakra Tinkuy</p>
    </div>
    <div style="padding:40px">
      <h2 style="color:#1b4332;margin:0 0 16px">Napaykullayki, {{firstName}}</h2>
      <p style="color:#555;line-height:1.7"><strong>{{productName}}</strong>-manta tinkuy mañakuyniyki (N° {{tradeId}}) mana chaskisqachu karqan.</p>
      <p style="color:#555;line-height:1.7">Ama llakikuychu — astawanraq productorniyuqkuna plataformallipi tiyan. Musuq oportunidadesta panelniykipi maskay.</p>
      <div style="text-align:center;margin:32px 0">
        <a href="{{dashboardUrl}}" style="background:#2d6a4f;color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:16px">Productosta Maskay →</a>
      </div>
    </div>
    <div style="background:#f0faf5;padding:16px 40px;text-align:center">
      <p style="color:#aaa;font-size:11px;margin:0">© INTI — Chakra Tinkuy</p>
    </div>
  </div>
</body>
</html>`,
    },
  },
  TRADE_COMPLETED: {
    es: {
      subject: '¡Trueque completado con éxito! 🌱 — {{tradeId}}',
      html: `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><title>Trueque completado</title></head>
<body style="font-family:Arial,sans-serif;background:#f4f7f0;margin:0;padding:0">
  <div style="max-width:600px;margin:32px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 2px 12px #0001">
    <div style="background:#2d6a4f;padding:32px 40px;text-align:center">
      <h1 style="color:#fff;margin:0;font-size:28px">🌱 INTI</h1>
      <p style="color:#b7e4c7;margin:8px 0 0;font-size:14px">Trueque del Campo</p>
    </div>
    <div style="padding:40px">
      <div style="text-align:center;margin-bottom:24px"><span style="font-size:48px">🎉</span></div>
      <h2 style="color:#1b4332;margin:0 0 16px;text-align:center">¡Trueque completado!</h2>
      <p style="color:#555;line-height:1.7">Hola <strong>{{firstName}}</strong>, el trueque con <strong>{{counterpartName}}</strong> por <strong>{{productName}}</strong> fue completado el <strong>{{completedDate}}</strong>.</p>
      <p style="color:#555;line-height:1.7">Gracias por ser parte de la comunidad INTI. Cada intercambio hace más fuerte nuestra red de productores.</p>
      <div style="background:#f0faf5;border-radius:12px;padding:16px 24px;margin:24px 0">
        <p style="margin:0;color:#1b4332;font-size:13px"><strong>N° de trueque:</strong> {{tradeId}}</p>
        <p style="margin:8px 0 0;color:#1b4332;font-size:13px"><strong>Producto:</strong> {{productName}}</p>
        <p style="margin:8px 0 0;color:#1b4332;font-size:13px"><strong>Con:</strong> {{counterpartName}}</p>
        <p style="margin:8px 0 0;color:#1b4332;font-size:13px"><strong>Fecha:</strong> {{completedDate}}</p>
      </div>
      <div style="text-align:center;margin:32px 0">
        <a href="{{dashboardUrl}}" style="background:#2d6a4f;color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:16px">Ver mi historial →</a>
      </div>
    </div>
    <div style="background:#f0faf5;padding:16px 40px;text-align:center">
      <p style="color:#aaa;font-size:11px;margin:0">© INTI — Trueque del Campo</p>
    </div>
  </div>
</body>
</html>`,
    },
    'es-ar': {
      subject: '¡Trueque completado con éxito! 🌱 — {{tradeId}}',
      html: `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><title>Trueque completado</title></head>
<body style="font-family:Arial,sans-serif;background:#f4f7f0;margin:0;padding:0">
  <div style="max-width:600px;margin:32px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 2px 12px #0001">
    <div style="background:#2d6a4f;padding:32px 40px;text-align:center">
      <h1 style="color:#fff;margin:0;font-size:28px">🌱 INTI</h1>
      <p style="color:#b7e4c7;margin:8px 0 0;font-size:14px">Trueque del Campo</p>
    </div>
    <div style="padding:40px">
      <div style="text-align:center;margin-bottom:24px"><span style="font-size:48px">🎉</span></div>
      <h2 style="color:#1b4332;margin:0 0 16px;text-align:center">¡Trueque completado!</h2>
      <p style="color:#555;line-height:1.7">Hola <strong>{{firstName}}</strong>, el trueque con <strong>{{counterpartName}}</strong> por <strong>{{productName}}</strong> fue completado el <strong>{{completedDate}}</strong>.</p>
      <p style="color:#555;line-height:1.7">Gracias por ser parte de la comunidad INTI. Cada intercambio hace más fuerte nuestra red de productores.</p>
      <div style="background:#f0faf5;border-radius:12px;padding:16px 24px;margin:24px 0">
        <p style="margin:0;color:#1b4332;font-size:13px"><strong>N° de trueque:</strong> {{tradeId}}</p>
        <p style="margin:8px 0 0;color:#1b4332;font-size:13px"><strong>Producto:</strong> {{productName}}</p>
        <p style="margin:8px 0 0;color:#1b4332;font-size:13px"><strong>Con:</strong> {{counterpartName}}</p>
        <p style="margin:8px 0 0;color:#1b4332;font-size:13px"><strong>Fecha:</strong> {{completedDate}}</p>
      </div>
      <div style="text-align:center;margin:32px 0">
        <a href="{{dashboardUrl}}" style="background:#2d6a4f;color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:16px">Ver mi historial →</a>
      </div>
    </div>
    <div style="background:#f0faf5;padding:16px 40px;text-align:center">
      <p style="color:#aaa;font-size:11px;margin:0">© INTI — Trueque del Campo</p>
    </div>
  </div>
</body>
</html>`,
    },
    en: {
      subject: 'Trade completed successfully! 🌱 — {{tradeId}}',
      html: `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><title>Trade completed</title></head>
<body style="font-family:Arial,sans-serif;background:#f4f7f0;margin:0;padding:0">
  <div style="max-width:600px;margin:32px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 2px 12px #0001">
    <div style="background:#2d6a4f;padding:32px 40px;text-align:center">
      <h1 style="color:#fff;margin:0;font-size:28px">🌱 INTI</h1>
      <p style="color:#b7e4c7;margin:8px 0 0;font-size:14px">Field Barter</p>
    </div>
    <div style="padding:40px">
      <div style="text-align:center;margin-bottom:24px"><span style="font-size:48px">🎉</span></div>
      <h2 style="color:#1b4332;margin:0 0 16px;text-align:center">Trade completed!</h2>
      <p style="color:#555;line-height:1.7">Hi <strong>{{firstName}}</strong>, your trade with <strong>{{counterpartName}}</strong> for <strong>{{productName}}</strong> was completed on <strong>{{completedDate}}</strong>.</p>
      <p style="color:#555;line-height:1.7">Thank you for being part of the INTI community. Every exchange strengthens our network of producers.</p>
      <div style="background:#f0faf5;border-radius:12px;padding:16px 24px;margin:24px 0">
        <p style="margin:0;color:#1b4332;font-size:13px"><strong>Trade #:</strong> {{tradeId}}</p>
        <p style="margin:8px 0 0;color:#1b4332;font-size:13px"><strong>Product:</strong> {{productName}}</p>
        <p style="margin:8px 0 0;color:#1b4332;font-size:13px"><strong>With:</strong> {{counterpartName}}</p>
        <p style="margin:8px 0 0;color:#1b4332;font-size:13px"><strong>Date:</strong> {{completedDate}}</p>
      </div>
      <div style="text-align:center;margin:32px 0">
        <a href="{{dashboardUrl}}" style="background:#2d6a4f;color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:16px">View my history →</a>
      </div>
    </div>
    <div style="background:#f0faf5;padding:16px 40px;text-align:center">
      <p style="color:#aaa;font-size:11px;margin:0">© INTI — Field Barter</p>
    </div>
  </div>
</body>
</html>`,
    },
    pt: {
      subject: 'Troca concluída com sucesso! 🌱 — {{tradeId}}',
      html: `<!DOCTYPE html>
<html lang="pt">
<head><meta charset="UTF-8"><title>Troca concluída</title></head>
<body style="font-family:Arial,sans-serif;background:#f4f7f0;margin:0;padding:0">
  <div style="max-width:600px;margin:32px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 2px 12px #0001">
    <div style="background:#2d6a4f;padding:32px 40px;text-align:center">
      <h1 style="color:#fff;margin:0;font-size:28px">🌱 INTI</h1>
      <p style="color:#b7e4c7;margin:8px 0 0;font-size:14px">Troca do Campo</p>
    </div>
    <div style="padding:40px">
      <div style="text-align:center;margin-bottom:24px"><span style="font-size:48px">🎉</span></div>
      <h2 style="color:#1b4332;margin:0 0 16px;text-align:center">Troca concluída!</h2>
      <p style="color:#555;line-height:1.7">Olá <strong>{{firstName}}</strong>, sua troca com <strong>{{counterpartName}}</strong> por <strong>{{productName}}</strong> foi concluída em <strong>{{completedDate}}</strong>.</p>
      <p style="color:#555;line-height:1.7">Obrigado por fazer parte da comunidade INTI. Cada troca fortalece nossa rede de produtores.</p>
      <div style="background:#f0faf5;border-radius:12px;padding:16px 24px;margin:24px 0">
        <p style="margin:0;color:#1b4332;font-size:13px"><strong>N° da troca:</strong> {{tradeId}}</p>
        <p style="margin:8px 0 0;color:#1b4332;font-size:13px"><strong>Produto:</strong> {{productName}}</p>
        <p style="margin:8px 0 0;color:#1b4332;font-size:13px"><strong>Com:</strong> {{counterpartName}}</p>
        <p style="margin:8px 0 0;color:#1b4332;font-size:13px"><strong>Data:</strong> {{completedDate}}</p>
      </div>
      <div style="text-align:center;margin:32px 0">
        <a href="{{dashboardUrl}}" style="background:#2d6a4f;color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:16px">Ver meu histórico →</a>
      </div>
    </div>
    <div style="background:#f0faf5;padding:16px 40px;text-align:center">
      <p style="color:#aaa;font-size:11px;margin:0">© INTI — Troca do Campo</p>
    </div>
  </div>
</body>
</html>`,
    },
    qu: {
      subject: 'Tinkuy Allinmanta Tukurirqan! 🌱 — {{tradeId}}',
      html: `<!DOCTYPE html>
<html lang="qu">
<head><meta charset="UTF-8"><title>Tinkuy Tukurirqan</title></head>
<body style="font-family:Arial,sans-serif;background:#f4f7f0;margin:0;padding:0">
  <div style="max-width:600px;margin:32px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 2px 12px #0001">
    <div style="background:#2d6a4f;padding:32px 40px;text-align:center">
      <h1 style="color:#fff;margin:0;font-size:28px">🌱 INTI</h1>
      <p style="color:#b7e4c7;margin:8px 0 0;font-size:14px">Chakra Tinkuy</p>
    </div>
    <div style="padding:40px">
      <div style="text-align:center;margin-bottom:24px"><span style="font-size:48px">🎉</span></div>
      <h2 style="color:#1b4332;margin:0 0 16px;text-align:center">Tinkuy Tukurirqan!</h2>
      <p style="color:#555;line-height:1.7">Napaykullayki <strong>{{firstName}}</strong>, <strong>{{counterpartName}}</strong>-wan <strong>{{productName}}</strong>-manta tinkuyniyki <strong>{{completedDate}}</strong>-pi allinmanta tukurirqan.</p>
      <p style="color:#555;line-height:1.7">Yusulpayki INTI llaqtapi kayniykimanta. Sapa tinkuy kallpanchikun productorniyuqkunap redenta.</p>
      <div style="background:#f0faf5;border-radius:12px;padding:16px 24px;margin:24px 0">
        <p style="margin:0;color:#1b4332;font-size:13px"><strong>Tinkuy N°:</strong> {{tradeId}}</p>
        <p style="margin:8px 0 0;color:#1b4332;font-size:13px"><strong>Producto:</strong> {{productName}}</p>
        <p style="margin:8px 0 0;color:#1b4332;font-size:13px"><strong>Pipim:</strong> {{counterpartName}}</p>
        <p style="margin:8px 0 0;color:#1b4332;font-size:13px"><strong>P'unchay:</strong> {{completedDate}}</p>
      </div>
      <div style="text-align:center;margin:32px 0">
        <a href="{{dashboardUrl}}" style="background:#2d6a4f;color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:16px">Kawsayniyta Rikuy →</a>
      </div>
    </div>
    <div style="background:#f0faf5;padding:16px 40px;text-align:center">
      <p style="color:#aaa;font-size:11px;margin:0">© INTI — Chakra Tinkuy</p>
    </div>
  </div>
</body>
</html>`,
    },
  },
}

// ─── Component ─────────────────────────────────────────────────────────────────

export default function AdminEmailTemplatesPage() {
  const { user, loading, isAdmin } = useAuth()
  const router = useRouter()

  const [templates, setTemplates] = useState<EmailTemplate[]>([])
  const [fetching, setFetching] = useState(true)

  // Editor state
  const [selectedKey, setSelectedKey] = useState<TemplateKey | null>(null)
  const [selectedLocale, setSelectedLocale] = useState('es')
  const [subject, setSubject] = useState('')
  const [html, setHtml] = useState('')
  const [dirty, setDirty] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  // Preview
  const [previewHtml, setPreviewHtml] = useState<string | null>(null)
  const [previewing, setPreviewing] = useState(false)
  const [showPreview, setShowPreview] = useState(false)

  useEffect(() => {
    if (!loading && (!user || !isAdmin)) router.push('/')
  }, [user, loading, isAdmin, router])

  const fetchTemplates = useCallback(async () => {
    setFetching(true)
    try {
      const list = await getAllEmailTemplates()
      setTemplates(list)
    } catch {
      toast.error('Error al cargar templates')
    } finally {
      setFetching(false)
    }
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (isAdmin) fetchTemplates()
  }, [isAdmin, fetchTemplates])

  const hasTemplate = (key: string, locale: string) =>
    templates.some((t) => t.key === key && t.locale === locale)

  const syncEditorContent = (
    key: TemplateKey,
    locale: string,
    sourceTemplates = templates,
  ) => {
    const existing = sourceTemplates.find(
      (t) => t.key === key.key && t.locale === locale,
    )
    if (existing) {
      setSubject(existing.subject)
      setHtml(existing.html)
    } else {
      const def = DEFAULT_TEMPLATES[key.key]?.[locale]
      setSubject(def?.subject ?? '')
      setHtml(def?.html ?? '')
    }
    setDirty(false)
    setPreviewHtml(null)
    setShowPreview(false)
  }

  const handleSave = async () => {
    if (!selectedKey) return
    setSaving(true)
    try {
      const saved = await upsertEmailTemplate(selectedKey.key, selectedLocale, { subject, html })
      setTemplates((prev) => {
        const idx = prev.findIndex((t) => t.key === saved.key && t.locale === saved.locale)
        if (idx >= 0) {
          const next = [...prev]
          next[idx] = saved
          return next
        }
        return [...prev, saved]
      })
      setDirty(false)
      toast.success('Template guardado')
    } catch (e: unknown) {
      toast.error(e instanceof Error && e.message ? e.message : 'Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!selectedKey) return
    if (!confirm(`¿Eliminar template "${selectedKey.key}" / ${selectedLocale}?`)) return
    setDeleting(true)
    try {
      await deleteEmailTemplate(selectedKey.key, selectedLocale)
      setTemplates((prev) =>
        prev.filter((t) => !(t.key === selectedKey.key && t.locale === selectedLocale)),
      )
      setSubject('')
      setHtml('')
      setDirty(false)
      toast.success('Template eliminado')
    } catch (e: unknown) {
      toast.error(e instanceof Error && e.message ? e.message : 'Error al eliminar')
    } finally {
      setDeleting(false)
    }
  }

  const handlePreview = async () => {
    if (!selectedKey) return
    setPreviewing(true)
    try {
      // First save current draft temporarily in memory for preview
      const vars = SAMPLE_VARS[selectedKey.key] ?? {}
      // Render client-side placeholder replacement for instant preview
      let rendered = html
      Object.entries(vars).forEach(([k, v]) => {
        rendered = rendered.replace(new RegExp(`\\{\\{${k}\\}\\}`, 'g'), v)
      })
      setPreviewHtml(rendered)
      setShowPreview(true)
    } finally {
      setPreviewing(false)
    }
  }

  const insertPlaceholder = (field: 'subject' | 'html', placeholder: string) => {
    const tag = `{{${placeholder}}}`
    if (field === 'subject') {
      setSubject((prev) => prev + tag)
      setDirty(true)
    } else {
      setHtml((prev) => prev + tag)
      setDirty(true)
    }
  }

  // ─── Groups ────────────────────────────────────────────────────────────────
  const groups = [...new Set(TEMPLATE_KEYS.map((k) => k.group))]

  if (loading || !user || !isAdmin) return null

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <button
          onClick={() => router.push('/admin')}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-500"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <div className="p-2 bg-green-100 rounded-xl">
          <Mail className="h-6 w-6 text-green-700" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Email Templates</h1>
          <p className="text-gray-500 text-sm">Gestión de plantillas de correo multiidioma</p>
        </div>
        <div className="ml-auto">
          <button
            onClick={fetchTemplates}
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors px-3 py-2 rounded-lg hover:bg-gray-100"
          >
            <RefreshCw className="h-4 w-4" />
            Actualizar
          </button>
        </div>
      </div>

      <div className="flex gap-6">
        {/* ─── Sidebar: template list ───────────────────────────────────────── */}
        <div className="w-64 shrink-0">
          <div className="bg-white rounded-2xl border overflow-hidden">
            {fetching ? (
              <div className="p-6 text-center">
                <Loader2 className="h-5 w-5 animate-spin mx-auto text-gray-400" />
              </div>
            ) : (
              groups.map((group) => (
                <div key={group}>
                  <div className="px-4 py-2 bg-gray-50 border-b">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{group}</p>
                  </div>
                  {TEMPLATE_KEYS.filter((k) => k.group === group).map((tk) => {
                    return (
                      <button
                        key={tk.key}
                        onClick={() => {
                          setSelectedKey(tk)
                          setSelectedLocale('es')
                          syncEditorContent(tk, 'es')
                        }}
                        className={`w-full text-left px-4 py-3 border-b last:border-b-0 transition-colors ${
                          selectedKey?.key === tk.key
                            ? 'bg-green-50 border-l-2 border-l-green-500'
                            : 'hover:bg-gray-50'
                        }`}
                      >
                        <p className="text-sm font-medium text-gray-800">{tk.label}</p>
                        <p className="text-xs text-gray-400 mt-0.5 font-mono">{tk.key}</p>
                        <div className="flex gap-1 mt-1.5">
                          {LOCALES.map((l) => (
                            <span
                              key={l.code}
                              className={`text-xs px-1.5 py-0.5 rounded-full ${
                                hasTemplate(tk.key, l.code)
                                  ? 'bg-green-100 text-green-700'
                                  : 'bg-gray-100 text-gray-400'
                              }`}
                            >
                              {l.flag}
                            </span>
                          ))}
                        </div>
                      </button>
                    )
                  })}
                </div>
              ))
            )}
          </div>
        </div>

        {/* ─── Main editor ─────────────────────────────────────────────────── */}
        <div className="flex-1 min-w-0">
          {!selectedKey ? (
            <div className="bg-white rounded-2xl border p-12 text-center">
              <Mail className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Seleccioná un template de la lista para editarlo</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Key + Locale tabs */}
              <div className="bg-white rounded-2xl border p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h2 className="font-semibold text-gray-900">{selectedKey.label}</h2>
                    <p className="text-xs font-mono text-gray-400">{selectedKey.key}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {hasTemplate(selectedKey.key, selectedLocale) && (
                      <button
                        onClick={handleDelete}
                        disabled={deleting}
                        className="flex items-center gap-1 text-red-500 hover:text-red-700 text-sm px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors"
                      >
                        {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                        Eliminar
                      </button>
                    )}
                    <button
                      onClick={handlePreview}
                      disabled={previewing || !html}
                      className="flex items-center gap-1 text-blue-600 hover:text-blue-800 text-sm px-3 py-1.5 rounded-lg hover:bg-blue-50 transition-colors disabled:opacity-40"
                    >
                      {previewing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Eye className="h-4 w-4" />}
                      Vista previa
                    </button>
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className="flex items-center gap-2 bg-green-600 text-white text-sm px-4 py-1.5 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-60"
                    >
                      {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                      Guardar
                    </button>
                  </div>
                </div>

                {/* Locale tabs */}
                <div className="flex gap-2 flex-wrap">
                  {LOCALES.map((l) => (
                    <button
                      key={l.code}
                      onClick={() => {
                        setSelectedLocale(l.code)
                        if (selectedKey) {
                          syncEditorContent(selectedKey, l.code)
                        }
                      }}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                        selectedLocale === l.code
                          ? 'bg-green-100 text-green-800 ring-1 ring-green-300'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      <span>{l.flag}</span>
                      <span>{l.label}</span>
                      {hasTemplate(selectedKey.key, l.code) && (
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500 ml-1" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Placeholders */}
              <div className="bg-white rounded-2xl border p-4">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                  Placeholders disponibles
                </p>
                <div className="flex flex-wrap gap-2">
                  {(KEY_PLACEHOLDERS[selectedKey.key] ?? []).map((ph) => (
                    <div key={ph} className="flex gap-1">
                      <button
                        onClick={() => insertPlaceholder('subject', ph)}
                        title="Insertar en asunto"
                        className="font-mono text-xs bg-amber-50 text-amber-700 border border-amber-200 px-2 py-1 rounded-l-lg hover:bg-amber-100 transition-colors"
                      >
                        S
                      </button>
                      <button
                        onClick={() => insertPlaceholder('html', ph)}
                        title="Insertar en HTML"
                        className="font-mono text-xs bg-blue-50 text-blue-700 border border-blue-200 px-2 py-1 rounded-r-lg hover:bg-blue-100 transition-colors"
                      >
                        {'{{' + ph + '}}'}
                      </button>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-gray-400 mt-2">
                  <span className="font-mono bg-amber-50 text-amber-700 px-1 rounded">S</span> = insertar en asunto &nbsp;|&nbsp;
                  clic en <span className="font-mono bg-blue-50 text-blue-700 px-1 rounded">{'{{...}}'}</span> = insertar en HTML
                </p>
              </div>

              {/* Subject */}
              <div className="bg-white rounded-2xl border p-4">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Asunto del correo</label>
                <input
                  value={subject}
                  onChange={(e) => { setSubject(e.target.value); setDirty(true) }}
                  placeholder="Ej: ¡Bienvenido/a, {{firstName}}!"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100 font-mono"
                />
              </div>

              {/* HTML Editor */}
              <div className="bg-white rounded-2xl border p-4">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <Code2 className="h-4 w-4" />
                    HTML del correo
                  </label>
                  {dirty && (
                    <span className="text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                      Cambios sin guardar
                    </span>
                  )}
                </div>
                <textarea
                  value={html}
                  onChange={(e) => { setHtml(e.target.value); setDirty(true) }}
                  rows={20}
                  placeholder="<!DOCTYPE html>..."
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-xs outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100 font-mono resize-y leading-relaxed"
                />
              </div>

              {/* Preview panel */}
              {showPreview && previewHtml && (
                <div className="bg-white rounded-2xl border overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-3 border-b bg-gray-50">
                    <div className="flex items-center gap-2">
                      <Eye className="h-4 w-4 text-gray-500" />
                      <span className="text-sm font-semibold text-gray-700">Vista previa (datos de muestra)</span>
                    </div>
                    <button
                      onClick={() => setShowPreview(false)}
                      className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      <EyeOff className="h-4 w-4" />
                    </button>
                  </div>
                  <iframe
                    srcDoc={previewHtml}
                    className="w-full border-0"
                    style={{ height: '600px' }}
                    title="Email preview"
                    sandbox="allow-same-origin"
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
