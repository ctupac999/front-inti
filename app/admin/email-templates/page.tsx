'use client'

import { useEffect, useState, useCallback } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
  Mail, Save, Trash2, Eye, EyeOff, ChevronLeft,
  Code2, RefreshCw, Loader2, Check, X, Settings2,
} from 'lucide-react'
import {
  getAllEmailTemplates,
  upsertEmailTemplate,
  deleteEmailTemplate,
  getBccStatus,
  setBccConfig,
  deleteBccConfig,
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
  { key: 'TRADE_PROPOSED',    group: 'Trueques',      label: 'Propuesta de trueque' },
  { key: 'TRADE_ACCEPTED',    group: 'Trueques',      label: 'Trueque aceptado' },
  { key: 'TRADE_REJECTED',    group: 'Trueques',      label: 'Trueque rechazado' },
  { key: 'TRADE_CANCELLED',   group: 'Trueques',      label: 'Trueque cancelado' },
]

const KEY_PLACEHOLDERS: Record<string, string[]> = {
  USER_REGISTRATION: ['firstName', 'lastName', 'email', 'phone', 'dashboardUrl', 'loginUrl', 'websiteUrl', 'contactUrl', 'registrationDate'],
  PASSWORD_RESET:    ['firstName', 'email', 'resetUrl', 'expiresIn'],
  TRADE_PROPOSED:    ['firstName', 'proposerName', 'tradeId', 'productName', 'dashboardUrl'],
  TRADE_ACCEPTED:    ['firstName', 'counterpartName', 'tradeId', 'productName', 'dashboardUrl'],
  TRADE_REJECTED:    ['firstName', 'counterpartName', 'tradeId', 'productName', 'dashboardUrl'],
  TRADE_CANCELLED:   ['firstName', 'proposerName', 'tradeId', 'productName', 'dashboardUrl'],
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
  TRADE_PROPOSED: {
    firstName: 'Carlos',
    proposerName: 'María González',
    tradeId: 'TRD-0001',
    productName: 'Tomates cherry',
    dashboardUrl: 'http://localhost:3000/dashboard',
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
    counterpartName: 'Carlos López',
    dashboardUrl: 'http://localhost:3000/dashboard',
  },
  TRADE_CANCELLED: {
    firstName: 'Carlos',
    proposerName: 'María González',
    tradeId: 'TRD-0001',
    productName: 'Tomates cherry',
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
<body style="font-family:'Segoe UI',system-ui,-apple-system,BlinkMacSystemFont,Arial,sans-serif;background:#f0f5ee;margin:0;padding:0">
  <div style="max-width:600px;margin:32px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 2px 12px #0001">
    <div style="background:linear-gradient(135deg,#1b6a4f,#2d8a5f);padding:40px 40px 36px;text-align:center">
      <div style="font-size:48px;line-height:1;margin-bottom:12px">🌱</div>
      <h1 style="color:#fff;margin:0;font-size:32px;font-weight:800;letter-spacing:-0.5px;text-shadow:0 1px 3px #00000030">INTI</h1>
      <p style="color:#b7e4c7;margin:10px 0 0;font-size:15px;font-weight:500;letter-spacing:0.3px">Trueque del Campo</p>
    </div>
    <div style="padding:48px">
      <h2 style="color:#1b4332;margin:0 0 16px;font-size:22px;font-weight:700">¡Bienvenido/a, {{firstName}}!</h2>
      <p style="color:#475467;line-height:1.8">Tu cuenta en INTI fue creada exitosamente el <strong>{{registrationDate}}</strong>.</p>
      <p style="color:#475467;line-height:1.8">Ahora podés publicar tus productos, explorar lo que otros ofrecen y comenzar a intercambiar de manera justa y sustentable.</p>
      <div style="text-align:center;margin:32px 0">
        <a href="{{dashboardUrl}}" style="background:linear-gradient(135deg,#1b6a4f,#2d8a5f);color:#fff;padding:14px 36px;border-radius:12px;text-decoration:none;font-weight:700;font-size:16px;display:inline-block;box-shadow:0 2px 8px #1b6a4f40">Ir a mi panel →</a>
      </div>
      <hr style="border:none;height:1px;background:linear-gradient(to right,transparent,#d0d5dd,transparent);margin:32px 0">
      <p style="color:#999;font-size:12px;text-align:center">Si tenés dudas escribinos a <a href="{{contactUrl}}" style="color:#2d6a4f">{{contactUrl}}</a></p>
    </div>
    <div style="background:#f0faf5;padding:20px 40px;text-align:center;border-top:1px solid #e0f0e5">
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
<body style="font-family:'Segoe UI',system-ui,-apple-system,BlinkMacSystemFont,Arial,sans-serif;background:#f0f5ee;margin:0;padding:0">
  <div style="max-width:600px;margin:32px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 2px 12px #0001">
    <div style="background:linear-gradient(135deg,#1b6a4f,#2d8a5f);padding:40px 40px 36px;text-align:center">
      <div style="font-size:48px;line-height:1;margin-bottom:12px">🌱</div>
      <h1 style="color:#fff;margin:0;font-size:32px;font-weight:800;letter-spacing:-0.5px;text-shadow:0 1px 3px #00000030">INTI</h1>
      <p style="color:#b7e4c7;margin:10px 0 0;font-size:15px;font-weight:500;letter-spacing:0.3px">Field Barter</p>
    </div>
    <div style="padding:48px">
      <h2 style="color:#1b4332;margin:0 0 16px;font-size:22px;font-weight:700">Welcome, {{firstName}}!</h2>
      <p style="color:#475467;line-height:1.8">Your INTI account was created on <strong>{{registrationDate}}</strong>.</p>
      <p style="color:#475467;line-height:1.8">You can now list your products, explore what others offer and start trading in a fair and sustainable way.</p>
      <div style="text-align:center;margin:32px 0">
        <a href="{{dashboardUrl}}" style="background:linear-gradient(135deg,#1b6a4f,#2d8a5f);color:#fff;padding:14px 36px;border-radius:12px;text-decoration:none;font-weight:700;font-size:16px;display:inline-block;box-shadow:0 2px 8px #1b6a4f40">Go to my dashboard →</a>
      </div>
      <hr style="border:none;height:1px;background:linear-gradient(to right,transparent,#d0d5dd,transparent);margin:32px 0">
      <p style="color:#999;font-size:12px;text-align:center">Questions? Contact us at <a href="{{contactUrl}}" style="color:#2d6a4f">{{contactUrl}}</a></p>
    </div>
    <div style="background:#f0faf5;padding:20px 40px;text-align:center;border-top:1px solid #e0f0e5">
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
<body style="font-family:'Segoe UI',system-ui,-apple-system,BlinkMacSystemFont,Arial,sans-serif;background:#f0f5ee;margin:0;padding:0">
  <div style="max-width:600px;margin:32px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 2px 12px #0001">
    <div style="background:linear-gradient(135deg,#1b6a4f,#2d8a5f);padding:40px 40px 36px;text-align:center">
      <div style="font-size:48px;line-height:1;margin-bottom:12px">🌱</div>
      <h1 style="color:#fff;margin:0;font-size:32px;font-weight:800;letter-spacing:-0.5px;text-shadow:0 1px 3px #00000030">INTI</h1>
      <p style="color:#b7e4c7;margin:10px 0 0;font-size:15px;font-weight:500;letter-spacing:0.3px">Troca do Campo</p>
    </div>
    <div style="padding:48px">
      <h2 style="color:#1b4332;margin:0 0 16px;font-size:22px;font-weight:700">Bem-vindo(a), {{firstName}}!</h2>
      <p style="color:#475467;line-height:1.8">Sua conta no INTI foi criada em <strong>{{registrationDate}}</strong>.</p>
      <p style="color:#475467;line-height:1.8">Agora você pode publicar seus produtos, explorar o que outros oferecem e começar a trocar de forma justa e sustentável.</p>
      <div style="text-align:center;margin:32px 0">
        <a href="{{dashboardUrl}}" style="background:linear-gradient(135deg,#1b6a4f,#2d8a5f);color:#fff;padding:14px 36px;border-radius:12px;text-decoration:none;font-weight:700;font-size:16px;display:inline-block;box-shadow:0 2px 8px #1b6a4f40">Ir ao painel →</a>
      </div>
      <hr style="border:none;height:1px;background:linear-gradient(to right,transparent,#d0d5dd,transparent);margin:32px 0">
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
<body style="font-family:'Segoe UI',system-ui,-apple-system,BlinkMacSystemFont,Arial,sans-serif;background:#f0f5ee;margin:0;padding:0">
  <div style="max-width:600px;margin:32px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 2px 12px #0001">
    <div style="background:linear-gradient(135deg,#1b6a4f,#2d8a5f);padding:40px 40px 36px;text-align:center">
      <div style="font-size:48px;line-height:1;margin-bottom:12px">🌱</div>
      <h1 style="color:#fff;margin:0;font-size:32px;font-weight:800;letter-spacing:-0.5px;text-shadow:0 1px 3px #00000030">INTI</h1>
      <p style="color:#b7e4c7;margin:10px 0 0;font-size:15px;font-weight:500;letter-spacing:0.3px">Trueque del Campo</p>
    </div>
    <div style="padding:48px">
      <h2 style="color:#1b4332;margin:0 0 16px;font-size:22px;font-weight:700">¡Bienvenido/a, {{firstName}}!</h2>
      <p style="color:#475467;line-height:1.8">Tu cuenta en INTI fue creada exitosamente el <strong>{{registrationDate}}</strong>.</p>
      <p style="color:#475467;line-height:1.8">Ahora podés publicar tus productos, explorar lo que otros ofrecen y empezar a intercambiar de manera justa y sustentable.</p>
      <div style="text-align:center;margin:32px 0">
        <a href="{{dashboardUrl}}" style="background:linear-gradient(135deg,#1b6a4f,#2d8a5f);color:#fff;padding:14px 36px;border-radius:12px;text-decoration:none;font-weight:700;font-size:16px;display:inline-block;box-shadow:0 2px 8px #1b6a4f40">Ir a mi panel →</a>
      </div>
      <hr style="border:none;height:1px;background:linear-gradient(to right,transparent,#d0d5dd,transparent);margin:32px 0">
      <p style="color:#999;font-size:12px;text-align:center">Si tenés dudas escribinos a <a href="{{contactUrl}}" style="color:#2d6a4f">{{contactUrl}}</a></p>
    </div>
    <div style="background:#f0faf5;padding:20px 40px;text-align:center;border-top:1px solid #e0f0e5">
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
<body style="font-family:'Segoe UI',system-ui,-apple-system,BlinkMacSystemFont,Arial,sans-serif;background:#f0f5ee;margin:0;padding:0">
  <div style="max-width:600px;margin:32px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 2px 12px #0001">
    <div style="background:linear-gradient(135deg,#1b6a4f,#2d8a5f);padding:40px 40px 36px;text-align:center">
      <div style="font-size:48px;line-height:1;margin-bottom:12px">🌱</div>
      <h1 style="color:#fff;margin:0;font-size:32px;font-weight:800;letter-spacing:-0.5px;text-shadow:0 1px 3px #00000030">INTI</h1>
      <p style="color:#b7e4c7;margin:10px 0 0;font-size:15px;font-weight:500;letter-spacing:0.3px">Chakra Tinkuy</p>
    </div>
    <div style="padding:48px">
      <h2 style="color:#1b4332;margin:0 0 16px;font-size:22px;font-weight:700">Allin Hamuqti, {{firstName}}!</h2>
      <p style="color:#475467;line-height:1.8">Qam INTI-pi cuentayki <strong>{{registrationDate}}</strong>-pi allinmanta rurasqa.</p>
      <p style="color:#475467;line-height:1.8">Kunanmi atinki productosniykita riqsichiyta, wakin qunquriqkunata maskayta, allinmanta tinkuyta ima.</p>
      <div style="text-align:center;margin:32px 0">
        <a href="{{dashboardUrl}}" style="background:linear-gradient(135deg,#1b6a4f,#2d8a5f);color:#fff;padding:14px 36px;border-radius:12px;text-decoration:none;font-weight:700;font-size:16px;display:inline-block;box-shadow:0 2px 8px #1b6a4f40">Panelniyman Riy →</a>
      </div>
      <hr style="border:none;height:1px;background:linear-gradient(to right,transparent,#d0d5dd,transparent);margin:32px 0">
      <p style="color:#999;font-size:12px;text-align:center">Tapukuykikunapaq: <a href="{{contactUrl}}" style="color:#2d6a4f">{{contactUrl}}</a></p>
    </div>
    <div style="background:#f0faf5;padding:20px 40px;text-align:center;border-top:1px solid #e0f0e5">
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
<body style="font-family:'Segoe UI',system-ui,-apple-system,BlinkMacSystemFont,Arial,sans-serif;background:#f0f5ee;margin:0;padding:0">
  <div style="max-width:600px;margin:32px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 2px 12px #0001">
    <div style="background:linear-gradient(135deg,#1b6a4f,#2d8a5f);padding:40px 40px 36px;text-align:center">
      <div style="font-size:48px;line-height:1;margin-bottom:12px">🌱</div>
      <h1 style="color:#fff;margin:0;font-size:32px;font-weight:800;letter-spacing:-0.5px;text-shadow:0 1px 3px #00000030">INTI</h1>
      <p style="color:#b7e4c7;margin:10px 0 0;font-size:15px;font-weight:500;letter-spacing:0.3px">Trueque del Campo</p>
    </div>
    <div style="padding:48px">
      <h2 style="color:#1b4332;margin:0 0 16px;font-size:22px;font-weight:700">Hola, {{firstName}}</h2>
      <p style="color:#475467;line-height:1.8">Recibimos una solicitud para restablecer la contraseña de tu cuenta <strong>{{email}}</strong>.</p>
      <p style="color:#475467;line-height:1.8">Hacé clic en el botón para crear una nueva contraseña. El enlace expira en <strong>{{expiresIn}}</strong>.</p>
      <div style="text-align:center;margin:32px 0">
        <a href="{{resetUrl}}" style="background:linear-gradient(135deg,#1b6a4f,#2d8a5f);color:#fff;padding:14px 36px;border-radius:12px;text-decoration:none;font-weight:700;font-size:16px;display:inline-block;box-shadow:0 2px 8px #1b6a4f40">Restablecer contraseña →</a>
      </div>
      <hr style="border:none;height:1px;background:linear-gradient(to right,transparent,#d0d5dd,transparent);margin:32px 0">
      <p style="color:#999;font-size:12px;text-align:center">Si no solicitaste este cambio, ignorá este correo. Tu contraseña no será modificada.</p>
      <p style="color:#999;font-size:12px;text-align:center">Si tenés dudas, escribinos a <a href="{{contactUrl}}" style="color:#2d6a4f">{{contactUrl}}</a></p>
    </div>
    <div style="background:#f0faf5;padding:20px 40px;text-align:center;border-top:1px solid #e0f0e5">
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
<body style="font-family:'Segoe UI',system-ui,-apple-system,BlinkMacSystemFont,Arial,sans-serif;background:#f0f5ee;margin:0;padding:0">
  <div style="max-width:600px;margin:32px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 2px 12px #0001">
    <div style="background:linear-gradient(135deg,#1b6a4f,#2d8a5f);padding:40px 40px 36px;text-align:center">
      <div style="font-size:48px;line-height:1;margin-bottom:12px">🌱</div>
      <h1 style="color:#fff;margin:0;font-size:32px;font-weight:800;letter-spacing:-0.5px;text-shadow:0 1px 3px #00000030">INTI</h1>
      <p style="color:#b7e4c7;margin:10px 0 0;font-size:15px;font-weight:500;letter-spacing:0.3px">Trueque del Campo</p>
    </div>
    <div style="padding:48px">
      <h2 style="color:#1b4332;margin:0 0 16px;font-size:22px;font-weight:700">Hola, {{firstName}}</h2>
      <p style="color:#475467;line-height:1.8">Recibimos una solicitud para restablecer la contraseña de tu cuenta <strong>{{email}}</strong>.</p>
      <p style="color:#475467;line-height:1.8">Hacé clic en el botón para crear una nueva contraseña. El enlace expira en <strong>{{expiresIn}}</strong>.</p>
      <div style="text-align:center;margin:32px 0">
        <a href="{{resetUrl}}" style="background:linear-gradient(135deg,#1b6a4f,#2d8a5f);color:#fff;padding:14px 36px;border-radius:12px;text-decoration:none;font-weight:700;font-size:16px;display:inline-block;box-shadow:0 2px 8px #1b6a4f40">Restablecer contraseña →</a>
      </div>
      <hr style="border:none;height:1px;background:linear-gradient(to right,transparent,#d0d5dd,transparent);margin:32px 0">
      <p style="color:#999;font-size:12px;text-align:center">Si no pediste este cambio, ignorá este correo. Tu contraseña no va a ser modificada.</p>
      <p style="color:#999;font-size:12px;text-align:center">Si tenés dudas, escribinos a <a href="{{contactUrl}}" style="color:#2d6a4f">{{contactUrl}}</a></p>
    </div>
    <div style="background:#f0faf5;padding:20px 40px;text-align:center;border-top:1px solid #e0f0e5">
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
<body style="font-family:'Segoe UI',system-ui,-apple-system,BlinkMacSystemFont,Arial,sans-serif;background:#f0f5ee;margin:0;padding:0">
  <div style="max-width:600px;margin:32px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 2px 12px #0001">
    <div style="background:linear-gradient(135deg,#1b6a4f,#2d8a5f);padding:40px 40px 36px;text-align:center">
      <div style="font-size:48px;line-height:1;margin-bottom:12px">🌱</div>
      <h1 style="color:#fff;margin:0;font-size:32px;font-weight:800;letter-spacing:-0.5px;text-shadow:0 1px 3px #00000030">INTI</h1>
      <p style="color:#b7e4c7;margin:10px 0 0;font-size:15px;font-weight:500;letter-spacing:0.3px">Field Barter</p>
    </div>
    <div style="padding:48px">
      <h2 style="color:#1b4332;margin:0 0 16px;font-size:22px;font-weight:700">Hi, {{firstName}}</h2>
      <p style="color:#475467;line-height:1.8">We received a request to reset the password for your account <strong>{{email}}</strong>.</p>
      <p style="color:#475467;line-height:1.8">Click the button below to create a new password. The link expires in <strong>{{expiresIn}}</strong>.</p>
      <div style="text-align:center;margin:32px 0">
        <a href="{{resetUrl}}" style="background:linear-gradient(135deg,#1b6a4f,#2d8a5f);color:#fff;padding:14px 36px;border-radius:12px;text-decoration:none;font-weight:700;font-size:16px;display:inline-block;box-shadow:0 2px 8px #1b6a4f40">Reset my password →</a>
      </div>
      <hr style="border:none;height:1px;background:linear-gradient(to right,transparent,#d0d5dd,transparent);margin:32px 0">
      <p style="color:#999;font-size:12px;text-align:center">If you didn't request this, you can safely ignore this email. Your password will not be changed.</p>
      <p style="color:#999;font-size:12px;text-align:center">Questions? Contact us at <a href="{{contactUrl}}" style="color:#2d6a4f">{{contactUrl}}</a></p>
    </div>
    <div style="background:#f0faf5;padding:20px 40px;text-align:center;border-top:1px solid #e0f0e5">
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
<body style="font-family:'Segoe UI',system-ui,-apple-system,BlinkMacSystemFont,Arial,sans-serif;background:#f0f5ee;margin:0;padding:0">
  <div style="max-width:600px;margin:32px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 2px 12px #0001">
    <div style="background:linear-gradient(135deg,#1b6a4f,#2d8a5f);padding:40px 40px 36px;text-align:center">
      <div style="font-size:48px;line-height:1;margin-bottom:12px">🌱</div>
      <h1 style="color:#fff;margin:0;font-size:32px;font-weight:800;letter-spacing:-0.5px;text-shadow:0 1px 3px #00000030">INTI</h1>
      <p style="color:#b7e4c7;margin:10px 0 0;font-size:15px;font-weight:500;letter-spacing:0.3px">Troca do Campo</p>
    </div>
    <div style="padding:48px">
      <h2 style="color:#1b4332;margin:0 0 16px;font-size:22px;font-weight:700">Olá, {{firstName}}</h2>
      <p style="color:#475467;line-height:1.8">Recebemos uma solicitação para redefinir a senha da sua conta <strong>{{email}}</strong>.</p>
      <p style="color:#475467;line-height:1.8">Clique no botão abaixo para criar uma nova senha. O link expira em <strong>{{expiresIn}}</strong>.</p>
      <div style="text-align:center;margin:32px 0">
        <a href="{{resetUrl}}" style="background:linear-gradient(135deg,#1b6a4f,#2d8a5f);color:#fff;padding:14px 36px;border-radius:12px;text-decoration:none;font-weight:700;font-size:16px;display:inline-block;box-shadow:0 2px 8px #1b6a4f40">Redefinir senha →</a>
      </div>
      <hr style="border:none;height:1px;background:linear-gradient(to right,transparent,#d0d5dd,transparent);margin:32px 0">
      <p style="color:#999;font-size:12px;text-align:center">Se você não solicitou isso, ignore este e-mail. Sua senha não será alterada.</p>
      <p style="color:#999;font-size:12px;text-align:center">Dúvidas? <a href="{{contactUrl}}" style="color:#2d6a4f">{{contactUrl}}</a></p>
    </div>
    <div style="background:#f0faf5;padding:20px 40px;text-align:center;border-top:1px solid #e0f0e5">
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
<body style="font-family:'Segoe UI',system-ui,-apple-system,BlinkMacSystemFont,Arial,sans-serif;background:#f0f5ee;margin:0;padding:0">
  <div style="max-width:600px;margin:32px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 2px 12px #0001">
    <div style="background:linear-gradient(135deg,#1b6a4f,#2d8a5f);padding:40px 40px 36px;text-align:center">
      <div style="font-size:48px;line-height:1;margin-bottom:12px">🌱</div>
      <h1 style="color:#fff;margin:0;font-size:32px;font-weight:800;letter-spacing:-0.5px;text-shadow:0 1px 3px #00000030">INTI</h1>
      <p style="color:#b7e4c7;margin:10px 0 0;font-size:15px;font-weight:500;letter-spacing:0.3px">Chakra Tinkuy</p>
    </div>
    <div style="padding:48px">
      <h2 style="color:#1b4332;margin:0 0 16px;font-size:22px;font-weight:700">Napaykullayki, {{firstName}}</h2>
      <p style="color:#475467;line-height:1.8"><strong>{{email}}</strong> cuentaykipa claveykita tikrayta mañarqanki.</p>
      <p style="color:#475467;line-height:1.8">Botonta hatariy musuq claveta churanaypaq. Kay enlace <strong>{{expiresIn}}</strong>-kama kallpaniyuq.</p>
      <div style="text-align:center;margin:32px 0">
        <a href="{{resetUrl}}" style="background:linear-gradient(135deg,#1b6a4f,#2d8a5f);color:#fff;padding:14px 36px;border-radius:12px;text-decoration:none;font-weight:700;font-size:16px;display:inline-block;box-shadow:0 2px 8px #1b6a4f40">Claveyta Tikray →</a>
      </div>
      <hr style="border:none;height:1px;background:linear-gradient(to right,transparent,#d0d5dd,transparent);margin:32px 0">
      <p style="color:#999;font-size:12px;text-align:center">Mana qam mañarqankichu chayqa, kay correoyta saqiy. Claveyki mana tikrasqachu kanqa.</p>
      <p style="color:#999;font-size:12px;text-align:center">Tapukuykikunapaq: <a href="{{contactUrl}}" style="color:#2d6a4f">{{contactUrl}}</a></p>
    </div>
    <div style="background:#f0faf5;padding:20px 40px;text-align:center;border-top:1px solid #e0f0e5">
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
<body style="font-family:'Segoe UI',system-ui,-apple-system,BlinkMacSystemFont,Arial,sans-serif;background:#f0f5ee;margin:0;padding:0">
  <div style="max-width:600px;margin:32px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 2px 12px #0001">
    <div style="background:linear-gradient(135deg,#1b6a4f,#2d8a5f);padding:40px 40px 36px;text-align:center">
      <div style="font-size:48px;line-height:1;margin-bottom:12px">🌱</div>
      <h1 style="color:#fff;margin:0;font-size:32px;font-weight:800;letter-spacing:-0.5px;text-shadow:0 1px 3px #00000030">INTI</h1>
      <p style="color:#b7e4c7;margin:10px 0 0;font-size:15px;font-weight:500;letter-spacing:0.3px">Trueque del Campo</p>
    </div>
    <div style="padding:40px">
      <div style="text-align:center;margin-bottom:24px">
        <span style="font-size:48px">🤝</span>
      </div>
      <h2 style="color:#1b4332;margin:0 0 16px;font-size:22px;font-weight:700;text-align:center">¡Tu trueque fue aceptado!</h2>
      <p style="color:#475467;line-height:1.8">Hola <strong>{{firstName}}</strong>, buenas noticias: <strong>{{counterpartName}}</strong> aceptó tu propuesta de trueque por <strong>{{productName}}</strong>.</p>
      <p style="color:#475467;line-height:1.8">Ahora pueden coordinar los detalles del intercambio directamente desde tu panel.</p>
      <div style="background:#f0faf5;border:1px solid #d5e8dd;border-radius:14px;padding:18px 24px;margin:24px 0">
        <p style="margin:0;color:#1b4332;font-size:13px"><strong>N° de trueque:</strong> {{tradeId}}</p>
        <p style="margin:8px 0 0;color:#1b4332;font-size:13px"><strong>Producto:</strong> {{productName}}</p>
        <p style="margin:8px 0 0;color:#1b4332;font-size:13px"><strong>Con:</strong> {{counterpartName}}</p>
      </div>
      <div style="text-align:center;margin:32px 0">
        <a href="{{dashboardUrl}}" style="background:linear-gradient(135deg,#1b6a4f,#2d8a5f);color:#fff;padding:14px 36px;border-radius:12px;text-decoration:none;font-weight:700;font-size:16px;display:inline-block;box-shadow:0 2px 8px #1b6a4f40">Ver mi trueque →</a>
      </div>
      <hr style="border:none;height:1px;background:linear-gradient(to right,transparent,#d0d5dd,transparent);margin:32px 0">
      <p style="color:#999;font-size:12px;text-align:center">Si tenés dudas, escribinos a <a href="{{contactUrl}}" style="color:#2d6a4f">{{contactUrl}}</a></p>
    </div>
    <div style="background:#f0faf5;padding:20px 40px;text-align:center;border-top:1px solid #e0f0e5">
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
<body style="font-family:'Segoe UI',system-ui,-apple-system,BlinkMacSystemFont,Arial,sans-serif;background:#f0f5ee;margin:0;padding:0">
  <div style="max-width:600px;margin:32px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 2px 12px #0001">
    <div style="background:linear-gradient(135deg,#1b6a4f,#2d8a5f);padding:40px 40px 36px;text-align:center">
      <div style="font-size:48px;line-height:1;margin-bottom:12px">🌱</div>
      <h1 style="color:#fff;margin:0;font-size:32px;font-weight:800;letter-spacing:-0.5px;text-shadow:0 1px 3px #00000030">INTI</h1>
      <p style="color:#b7e4c7;margin:10px 0 0;font-size:15px;font-weight:500;letter-spacing:0.3px">Trueque del Campo</p>
    </div>
    <div style="padding:40px">
      <div style="text-align:center;margin-bottom:24px"><span style="font-size:48px">🤝</span></div>
      <h2 style="color:#1b4332;margin:0 0 16px;font-size:22px;font-weight:700;text-align:center">¡Tu trueque fue aceptado!</h2>
      <p style="color:#475467;line-height:1.8">Hola <strong>{{firstName}}</strong>, buenas noticias: <strong>{{counterpartName}}</strong> aceptó tu propuesta de trueque por <strong>{{productName}}</strong>.</p>
      <p style="color:#475467;line-height:1.8">Ahora podés coordinar los detalles del intercambio directo desde tu panel.</p>
      <div style="background:#f0faf5;border:1px solid #d5e8dd;border-radius:14px;padding:18px 24px;margin:24px 0">
        <p style="margin:0;color:#1b4332;font-size:13px"><strong>N° de trueque:</strong> {{tradeId}}</p>
        <p style="margin:8px 0 0;color:#1b4332;font-size:13px"><strong>Producto:</strong> {{productName}}</p>
        <p style="margin:8px 0 0;color:#1b4332;font-size:13px"><strong>Con:</strong> {{counterpartName}}</p>
      </div>
      <div style="text-align:center;margin:32px 0">
        <a href="{{dashboardUrl}}" style="background:linear-gradient(135deg,#1b6a4f,#2d8a5f);color:#fff;padding:14px 36px;border-radius:12px;text-decoration:none;font-weight:700;font-size:16px;display:inline-block;box-shadow:0 2px 8px #1b6a4f40">Ver mi trueque →</a>
      </div>
      <hr style="border:none;height:1px;background:linear-gradient(to right,transparent,#d0d5dd,transparent);margin:32px 0">
      <p style="color:#999;font-size:12px;text-align:center">Si tenés dudas, escribinos a <a href="{{contactUrl}}" style="color:#2d6a4f">{{contactUrl}}</a></p>
    </div>
    <div style="background:#f0faf5;padding:20px 40px;text-align:center;border-top:1px solid #e0f0e5">
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
<body style="font-family:'Segoe UI',system-ui,-apple-system,BlinkMacSystemFont,Arial,sans-serif;background:#f0f5ee;margin:0;padding:0">
  <div style="max-width:600px;margin:32px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 2px 12px #0001">
    <div style="background:linear-gradient(135deg,#1b6a4f,#2d8a5f);padding:40px 40px 36px;text-align:center">
      <div style="font-size:48px;line-height:1;margin-bottom:12px">🌱</div>
      <h1 style="color:#fff;margin:0;font-size:32px;font-weight:800;letter-spacing:-0.5px;text-shadow:0 1px 3px #00000030">INTI</h1>
      <p style="color:#b7e4c7;margin:10px 0 0;font-size:15px;font-weight:500;letter-spacing:0.3px">Field Barter</p>
    </div>
    <div style="padding:40px">
      <div style="text-align:center;margin-bottom:24px"><span style="font-size:48px">🤝</span></div>
      <h2 style="color:#1b4332;margin:0 0 16px;font-size:22px;font-weight:700;text-align:center">Your barter was accepted!</h2>
      <p style="color:#475467;line-height:1.8">Hi <strong>{{firstName}}</strong>, great news: <strong>{{counterpartName}}</strong> accepted your barter proposal for <strong>{{productName}}</strong>.</p>
      <p style="color:#475467;line-height:1.8">You can now coordinate the exchange details directly from your dashboard.</p>
      <div style="background:#f0faf5;border:1px solid #d5e8dd;border-radius:14px;padding:18px 24px;margin:24px 0">
        <p style="margin:0;color:#1b4332;font-size:13px"><strong>Trade #:</strong> {{tradeId}}</p>
        <p style="margin:8px 0 0;color:#1b4332;font-size:13px"><strong>Product:</strong> {{productName}}</p>
        <p style="margin:8px 0 0;color:#1b4332;font-size:13px"><strong>With:</strong> {{counterpartName}}</p>
      </div>
      <div style="text-align:center;margin:32px 0">
        <a href="{{dashboardUrl}}" style="background:linear-gradient(135deg,#1b6a4f,#2d8a5f);color:#fff;padding:14px 36px;border-radius:12px;text-decoration:none;font-weight:700;font-size:16px;display:inline-block;box-shadow:0 2px 8px #1b6a4f40">View my trade →</a>
      </div>
      <hr style="border:none;height:1px;background:linear-gradient(to right,transparent,#d0d5dd,transparent);margin:32px 0">
      <p style="color:#999;font-size:12px;text-align:center">Questions? Contact us at <a href="{{contactUrl}}" style="color:#2d6a4f">{{contactUrl}}</a></p>
    </div>
    <div style="background:#f0faf5;padding:20px 40px;text-align:center;border-top:1px solid #e0f0e5">
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
<body style="font-family:'Segoe UI',system-ui,-apple-system,BlinkMacSystemFont,Arial,sans-serif;background:#f0f5ee;margin:0;padding:0">
  <div style="max-width:600px;margin:32px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 2px 12px #0001">
    <div style="background:linear-gradient(135deg,#1b6a4f,#2d8a5f);padding:40px 40px 36px;text-align:center">
      <div style="font-size:48px;line-height:1;margin-bottom:12px">🌱</div>
      <h1 style="color:#fff;margin:0;font-size:32px;font-weight:800;letter-spacing:-0.5px;text-shadow:0 1px 3px #00000030">INTI</h1>
      <p style="color:#b7e4c7;margin:10px 0 0;font-size:15px;font-weight:500;letter-spacing:0.3px">Troca do Campo</p>
    </div>
    <div style="padding:40px">
      <div style="text-align:center;margin-bottom:24px"><span style="font-size:48px">🤝</span></div>
      <h2 style="color:#1b4332;margin:0 0 16px;font-size:22px;font-weight:700;text-align:center">Sua troca foi aceita!</h2>
      <p style="color:#475467;line-height:1.8">Olá <strong>{{firstName}}</strong>, ótimas notícias: <strong>{{counterpartName}}</strong> aceitou sua proposta de troca por <strong>{{productName}}</strong>.</p>
      <p style="color:#475467;line-height:1.8">Agora você pode combinar os detalhes da troca diretamente pelo painel.</p>
      <div style="background:#f0faf5;border:1px solid #d5e8dd;border-radius:14px;padding:18px 24px;margin:24px 0">
        <p style="margin:0;color:#1b4332;font-size:13px"><strong>N° da troca:</strong> {{tradeId}}</p>
        <p style="margin:8px 0 0;color:#1b4332;font-size:13px"><strong>Produto:</strong> {{productName}}</p>
        <p style="margin:8px 0 0;color:#1b4332;font-size:13px"><strong>Com:</strong> {{counterpartName}}</p>
      </div>
      <div style="text-align:center;margin:32px 0">
        <a href="{{dashboardUrl}}" style="background:linear-gradient(135deg,#1b6a4f,#2d8a5f);color:#fff;padding:14px 36px;border-radius:12px;text-decoration:none;font-weight:700;font-size:16px;display:inline-block;box-shadow:0 2px 8px #1b6a4f40">Ver minha troca →</a>
      </div>
      <hr style="border:none;height:1px;background:linear-gradient(to right,transparent,#d0d5dd,transparent);margin:32px 0">
      <p style="color:#999;font-size:12px;text-align:center">Dúvidas? <a href="{{contactUrl}}" style="color:#2d6a4f">{{contactUrl}}</a></p>
    </div>
    <div style="background:#f0faf5;padding:20px 40px;text-align:center;border-top:1px solid #e0f0e5">
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
<body style="font-family:'Segoe UI',system-ui,-apple-system,BlinkMacSystemFont,Arial,sans-serif;background:#f0f5ee;margin:0;padding:0">
  <div style="max-width:600px;margin:32px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 2px 12px #0001">
    <div style="background:linear-gradient(135deg,#1b6a4f,#2d8a5f);padding:40px 40px 36px;text-align:center">
      <div style="font-size:48px;line-height:1;margin-bottom:12px">🌱</div>
      <h1 style="color:#fff;margin:0;font-size:32px;font-weight:800;letter-spacing:-0.5px;text-shadow:0 1px 3px #00000030">INTI</h1>
      <p style="color:#b7e4c7;margin:10px 0 0;font-size:15px;font-weight:500;letter-spacing:0.3px">Chakra Tinkuy</p>
    </div>
    <div style="padding:40px">
      <div style="text-align:center;margin-bottom:24px"><span style="font-size:48px">🤝</span></div>
      <h2 style="color:#1b4332;margin:0 0 16px;font-size:22px;font-weight:700;text-align:center">Tinkuykiqa Chaskisqam!</h2>
      <p style="color:#475467;line-height:1.8">Napaykullayki <strong>{{firstName}}</strong>, allin willaymi: <strong>{{counterpartName}}</strong> tinkuykita <strong>{{productName}}</strong>-manta chaskikurqan.</p>
      <p style="color:#475467;line-height:1.8">Kunanmi atinki tinkuy detallesninta panelniykipi rimanakuyta.</p>
      <div style="background:#f0faf5;border:1px solid #d5e8dd;border-radius:14px;padding:18px 24px;margin:24px 0">
        <p style="margin:0;color:#1b4332;font-size:13px"><strong>Tinkuy N°:</strong> {{tradeId}}</p>
        <p style="margin:8px 0 0;color:#1b4332;font-size:13px"><strong>Producto:</strong> {{productName}}</p>
        <p style="margin:8px 0 0;color:#1b4332;font-size:13px"><strong>Pipim:</strong> {{counterpartName}}</p>
      </div>
      <div style="text-align:center;margin:32px 0">
        <a href="{{dashboardUrl}}" style="background:linear-gradient(135deg,#1b6a4f,#2d8a5f);color:#fff;padding:14px 36px;border-radius:12px;text-decoration:none;font-weight:700;font-size:16px;display:inline-block;box-shadow:0 2px 8px #1b6a4f40">Tinkuyta Rikuy →</a>
      </div>
      <hr style="border:none;height:1px;background:linear-gradient(to right,transparent,#d0d5dd,transparent);margin:32px 0">
      <p style="color:#999;font-size:12px;text-align:center">Tapukuykikunapaq: <a href="{{contactUrl}}" style="color:#2d6a4f">{{contactUrl}}</a></p>
    </div>
    <div style="background:#f0faf5;padding:20px 40px;text-align:center;border-top:1px solid #e0f0e5">
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
<body style="font-family:'Segoe UI',system-ui,-apple-system,BlinkMacSystemFont,Arial,sans-serif;background:#f0f5ee;margin:0;padding:0">
  <div style="max-width:600px;margin:32px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 2px 12px #0001">
    <div style="background:linear-gradient(135deg,#1b6a4f,#2d8a5f);padding:40px 40px 36px;text-align:center">
      <div style="font-size:48px;line-height:1;margin-bottom:12px">🌱</div>
      <h1 style="color:#fff;margin:0;font-size:32px;font-weight:800;letter-spacing:-0.5px;text-shadow:0 1px 3px #00000030">INTI</h1>
      <p style="color:#b7e4c7;margin:10px 0 0;font-size:15px;font-weight:500;letter-spacing:0.3px">Trueque del Campo</p>
    </div>
    <div style="padding:48px">
      <h2 style="color:#1b4332;margin:0 0 16px;font-size:22px;font-weight:700">Hola, {{firstName}}</h2>
      <p style="color:#475467;line-height:1.8">Lamentablemente tu propuesta de trueque por <strong>{{productName}}</strong> (N° {{tradeId}}) no fue aceptada esta vez.</p>
      <p style="color:#475467;line-height:1.8">No te desanimes — hay muchos más productores en la plataforma. Explorá nuevas oportunidades desde tu panel.</p>
      <div style="text-align:center;margin:32px 0">
        <a href="{{dashboardUrl}}" style="background:linear-gradient(135deg,#1b6a4f,#2d8a5f);color:#fff;padding:14px 36px;border-radius:12px;text-decoration:none;font-weight:700;font-size:16px;display:inline-block;box-shadow:0 2px 8px #1b6a4f40">Explorar productos →</a>
      </div>
      <hr style="border:none;height:1px;background:linear-gradient(to right,transparent,#d0d5dd,transparent);margin:32px 0">
      <p style="color:#999;font-size:12px;text-align:center">Si tenés dudas, escribinos a <a href="{{contactUrl}}" style="color:#2d6a4f">{{contactUrl}}</a></p>
    </div>
    <div style="background:#f0faf5;padding:20px 40px;text-align:center;border-top:1px solid #e0f0e5">
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
<body style="font-family:'Segoe UI',system-ui,-apple-system,BlinkMacSystemFont,Arial,sans-serif;background:#f0f5ee;margin:0;padding:0">
  <div style="max-width:600px;margin:32px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 2px 12px #0001">
    <div style="background:linear-gradient(135deg,#1b6a4f,#2d8a5f);padding:40px 40px 36px;text-align:center">
      <div style="font-size:48px;line-height:1;margin-bottom:12px">🌱</div>
      <h1 style="color:#fff;margin:0;font-size:32px;font-weight:800;letter-spacing:-0.5px;text-shadow:0 1px 3px #00000030">INTI</h1>
      <p style="color:#b7e4c7;margin:10px 0 0;font-size:15px;font-weight:500;letter-spacing:0.3px">Trueque del Campo</p>
    </div>
    <div style="padding:48px">
      <h2 style="color:#1b4332;margin:0 0 16px;font-size:22px;font-weight:700">Hola, {{firstName}}</h2>
      <p style="color:#475467;line-height:1.8">Lamentablemente tu propuesta de trueque por <strong>{{productName}}</strong> (N° {{tradeId}}) no fue aceptada esta vez.</p>
      <p style="color:#475467;line-height:1.8">No te desanimés — hay muchos más productores en la plataforma. Explorá nuevas oportunidades desde tu panel.</p>
      <div style="text-align:center;margin:32px 0">
        <a href="{{dashboardUrl}}" style="background:linear-gradient(135deg,#1b6a4f,#2d8a5f);color:#fff;padding:14px 36px;border-radius:12px;text-decoration:none;font-weight:700;font-size:16px;display:inline-block;box-shadow:0 2px 8px #1b6a4f40">Explorar productos →</a>
      </div>
      <hr style="border:none;height:1px;background:linear-gradient(to right,transparent,#d0d5dd,transparent);margin:32px 0">
      <p style="color:#999;font-size:12px;text-align:center">Si tenés dudas, escribinos a <a href="{{contactUrl}}" style="color:#2d6a4f">{{contactUrl}}</a></p>
    </div>
    <div style="background:#f0faf5;padding:20px 40px;text-align:center;border-top:1px solid #e0f0e5">
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
<body style="font-family:'Segoe UI',system-ui,-apple-system,BlinkMacSystemFont,Arial,sans-serif;background:#f0f5ee;margin:0;padding:0">
  <div style="max-width:600px;margin:32px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 2px 12px #0001">
    <div style="background:linear-gradient(135deg,#1b6a4f,#2d8a5f);padding:40px 40px 36px;text-align:center">
      <div style="font-size:48px;line-height:1;margin-bottom:12px">🌱</div>
      <h1 style="color:#fff;margin:0;font-size:32px;font-weight:800;letter-spacing:-0.5px;text-shadow:0 1px 3px #00000030">INTI</h1>
      <p style="color:#b7e4c7;margin:10px 0 0;font-size:15px;font-weight:500;letter-spacing:0.3px">Field Barter</p>
    </div>
    <div style="padding:48px">
      <h2 style="color:#1b4332;margin:0 0 16px;font-size:22px;font-weight:700">Hi, {{firstName}}</h2>
      <p style="color:#475467;line-height:1.8">Unfortunately your barter proposal for <strong>{{productName}}</strong> (Trade #{{tradeId}}) was not accepted this time.</p>
      <p style="color:#475467;line-height:1.8">Don't give up — there are many more producers on the platform. Explore new opportunities from your dashboard.</p>
      <div style="text-align:center;margin:32px 0">
        <a href="{{dashboardUrl}}" style="background:linear-gradient(135deg,#1b6a4f,#2d8a5f);color:#fff;padding:14px 36px;border-radius:12px;text-decoration:none;font-weight:700;font-size:16px;display:inline-block;box-shadow:0 2px 8px #1b6a4f40">Explore products →</a>
      </div>
      <hr style="border:none;height:1px;background:linear-gradient(to right,transparent,#d0d5dd,transparent);margin:32px 0">
      <p style="color:#999;font-size:12px;text-align:center">Questions? Contact us at <a href="{{contactUrl}}" style="color:#2d6a4f">{{contactUrl}}</a></p>
    </div>
    <div style="background:#f0faf5;padding:20px 40px;text-align:center;border-top:1px solid #e0f0e5">
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
<body style="font-family:'Segoe UI',system-ui,-apple-system,BlinkMacSystemFont,Arial,sans-serif;background:#f0f5ee;margin:0;padding:0">
  <div style="max-width:600px;margin:32px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 2px 12px #0001">
    <div style="background:linear-gradient(135deg,#1b6a4f,#2d8a5f);padding:40px 40px 36px;text-align:center">
      <div style="font-size:48px;line-height:1;margin-bottom:12px">🌱</div>
      <h1 style="color:#fff;margin:0;font-size:32px;font-weight:800;letter-spacing:-0.5px;text-shadow:0 1px 3px #00000030">INTI</h1>
      <p style="color:#b7e4c7;margin:10px 0 0;font-size:15px;font-weight:500;letter-spacing:0.3px">Troca do Campo</p>
    </div>
    <div style="padding:48px">
      <h2 style="color:#1b4332;margin:0 0 16px;font-size:22px;font-weight:700">Olá, {{firstName}}</h2>
      <p style="color:#475467;line-height:1.8">Infelizmente sua proposta de troca por <strong>{{productName}}</strong> (N° {{tradeId}}) não foi aceita desta vez.</p>
      <p style="color:#475467;line-height:1.8">Não desanime — há muitos outros produtores na plataforma. Explore novas oportunidades pelo painel.</p>
      <div style="text-align:center;margin:32px 0">
        <a href="{{dashboardUrl}}" style="background:linear-gradient(135deg,#1b6a4f,#2d8a5f);color:#fff;padding:14px 36px;border-radius:12px;text-decoration:none;font-weight:700;font-size:16px;display:inline-block;box-shadow:0 2px 8px #1b6a4f40">Explorar produtos →</a>
      </div>
      <hr style="border:none;height:1px;background:linear-gradient(to right,transparent,#d0d5dd,transparent);margin:32px 0">
      <p style="color:#999;font-size:12px;text-align:center">Dúvidas? <a href="{{contactUrl}}" style="color:#2d6a4f">{{contactUrl}}</a></p>
    </div>
    <div style="background:#f0faf5;padding:20px 40px;text-align:center;border-top:1px solid #e0f0e5">
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
<body style="font-family:'Segoe UI',system-ui,-apple-system,BlinkMacSystemFont,Arial,sans-serif;background:#f0f5ee;margin:0;padding:0">
  <div style="max-width:600px;margin:32px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 2px 12px #0001">
    <div style="background:linear-gradient(135deg,#1b6a4f,#2d8a5f);padding:40px 40px 36px;text-align:center">
      <div style="font-size:48px;line-height:1;margin-bottom:12px">🌱</div>
      <h1 style="color:#fff;margin:0;font-size:32px;font-weight:800;letter-spacing:-0.5px;text-shadow:0 1px 3px #00000030">INTI</h1>
      <p style="color:#b7e4c7;margin:10px 0 0;font-size:15px;font-weight:500;letter-spacing:0.3px">Chakra Tinkuy</p>
    </div>
    <div style="padding:48px">
      <h2 style="color:#1b4332;margin:0 0 16px;font-size:22px;font-weight:700">Napaykullayki, {{firstName}}</h2>
      <p style="color:#475467;line-height:1.8"><strong>{{productName}}</strong>-manta tinkuy mañakuyniyki (N° {{tradeId}}) mana chaskisqachu karqan.</p>
      <p style="color:#475467;line-height:1.8">Ama llakikuychu — astawanraq productorniyuqkuna plataformallipi tiyan. Musuq oportunidadesta panelniykipi maskay.</p>
      <div style="text-align:center;margin:32px 0">
        <a href="{{dashboardUrl}}" style="background:linear-gradient(135deg,#1b6a4f,#2d8a5f);color:#fff;padding:14px 36px;border-radius:12px;text-decoration:none;font-weight:700;font-size:16px;display:inline-block;box-shadow:0 2px 8px #1b6a4f40">Productosta Maskay →</a>
      </div>
      <hr style="border:none;height:1px;background:linear-gradient(to right,transparent,#d0d5dd,transparent);margin:32px 0">
      <p style="color:#999;font-size:12px;text-align:center">Tapukuykikunapaq: <a href="{{contactUrl}}" style="color:#2d6a4f">{{contactUrl}}</a></p>
    </div>
    <div style="background:#f0faf5;padding:20px 40px;text-align:center;border-top:1px solid #e0f0e5">
      <p style="color:#aaa;font-size:11px;margin:0">© INTI — Chakra Tinkuy</p>
    </div>
  </div>
</body>
</html>`,
    },
  },
  TRADE_PROPOSED: {
    es: {
      subject: '¡Te enviaron una propuesta de trueque! — {{tradeId}}',
      html: `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><title>Propuesta de trueque</title></head>
<body style="font-family:'Segoe UI',system-ui,-apple-system,BlinkMacSystemFont,Arial,sans-serif;background:#f0f5ee;margin:0;padding:0">
  <div style="max-width:600px;margin:32px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 2px 12px #0001">
    <div style="background:linear-gradient(135deg,#1b6a4f,#2d8a5f);padding:40px 40px 36px;text-align:center">
      <div style="font-size:48px;line-height:1;margin-bottom:12px">🌱</div>
      <h1 style="color:#fff;margin:0;font-size:32px;font-weight:800;letter-spacing:-0.5px;text-shadow:0 1px 3px #00000030">INTI</h1>
      <p style="color:#b7e4c7;margin:10px 0 0;font-size:15px;font-weight:500;letter-spacing:0.3px">Trueque del Campo</p>
    </div>
    <div style="padding:40px">
      <div style="text-align:center;margin-bottom:24px"><span style="font-size:48px">📩</span></div>
      <h2 style="color:#1b4332;margin:0 0 16px;font-size:22px;font-weight:700;text-align:center">Nueva propuesta de trueque</h2>
      <p style="color:#475467;line-height:1.8">Hola <strong>{{firstName}}</strong>, <strong>{{proposerName}}</strong> te envió una propuesta de trueque por <strong>{{productName}}</strong>.</p>
      <p style="color:#475467;line-height:1.8">Ingresá a tu panel para ver los detalles y responder.</p>
      <div style="background:#f0faf5;border:1px solid #d5e8dd;border-radius:14px;padding:18px 24px;margin:24px 0">
        <p style="margin:0;color:#1b4332;font-size:13px"><strong>De:</strong> {{proposerName}}</p>
        <p style="margin:8px 0 0;color:#1b4332;font-size:13px"><strong>Producto solicitado:</strong> {{productName}}</p>
      </div>
      <div style="text-align:center;margin:32px 0">
        <a href="{{dashboardUrl}}" style="background:linear-gradient(135deg,#1b6a4f,#2d8a5f);color:#fff;padding:14px 36px;border-radius:12px;text-decoration:none;font-weight:700;font-size:16px;display:inline-block;box-shadow:0 2px 8px #1b6a4f40">Ver propuesta →</a>
      </div>
      <hr style="border:none;height:1px;background:linear-gradient(to right,transparent,#d0d5dd,transparent);margin:32px 0">
      <p style="color:#999;font-size:12px;text-align:center">Si tenés dudas, escribinos a <a href="{{contactUrl}}" style="color:#2d6a4f">{{contactUrl}}</a></p>
    </div>
    <div style="background:#f0faf5;padding:20px 40px;text-align:center;border-top:1px solid #e0f0e5">
      <p style="color:#aaa;font-size:11px;margin:0">© INTI — Trueque del Campo</p>
    </div>
  </div>
</body>
</html>`,
    },
    'es-ar': {
      subject: '¡Te mandaron una propuesta de trueque! — {{tradeId}}',
      html: `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><title>Propuesta de trueque</title></head>
<body style="font-family:'Segoe UI',system-ui,-apple-system,BlinkMacSystemFont,Arial,sans-serif;background:#f0f5ee;margin:0;padding:0">
  <div style="max-width:600px;margin:32px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 2px 12px #0001">
    <div style="background:linear-gradient(135deg,#1b6a4f,#2d8a5f);padding:40px 40px 36px;text-align:center">
      <div style="font-size:48px;line-height:1;margin-bottom:12px">🌱</div>
      <h1 style="color:#fff;margin:0;font-size:32px;font-weight:800;letter-spacing:-0.5px;text-shadow:0 1px 3px #00000030">INTI</h1>
      <p style="color:#b7e4c7;margin:10px 0 0;font-size:15px;font-weight:500;letter-spacing:0.3px">Trueque del Campo</p>
    </div>
    <div style="padding:40px">
      <div style="text-align:center;margin-bottom:24px"><span style="font-size:48px">📩</span></div>
      <h2 style="color:#1b4332;margin:0 0 16px;font-size:22px;font-weight:700;text-align:center">Nueva propuesta de trueque</h2>
      <p style="color:#475467;line-height:1.8">Hola <strong>{{firstName}}</strong>, <strong>{{proposerName}}</strong> te mandó una propuesta de trueque por <strong>{{productName}}</strong>.</p>
      <p style="color:#475467;line-height:1.8">Entrá a tu panel para ver los detalles y responder.</p>
      <div style="background:#f0faf5;border:1px solid #d5e8dd;border-radius:14px;padding:18px 24px;margin:24px 0">
        <p style="margin:0;color:#1b4332;font-size:13px"><strong>De:</strong> {{proposerName}}</p>
        <p style="margin:8px 0 0;color:#1b4332;font-size:13px"><strong>Producto solicitado:</strong> {{productName}}</p>
      </div>
      <div style="text-align:center;margin:32px 0">
        <a href="{{dashboardUrl}}" style="background:linear-gradient(135deg,#1b6a4f,#2d8a5f);color:#fff;padding:14px 36px;border-radius:12px;text-decoration:none;font-weight:700;font-size:16px;display:inline-block;box-shadow:0 2px 8px #1b6a4f40">Ver propuesta →</a>
      </div>
      <hr style="border:none;height:1px;background:linear-gradient(to right,transparent,#d0d5dd,transparent);margin:32px 0">
      <p style="color:#999;font-size:12px;text-align:center">Si tenés dudas, escribinos a <a href="{{contactUrl}}" style="color:#2d6a4f">{{contactUrl}}</a></p>
    </div>
    <div style="background:#f0faf5;padding:20px 40px;text-align:center;border-top:1px solid #e0f0e5">
      <p style="color:#aaa;font-size:11px;margin:0">© INTI — Trueque del Campo</p>
    </div>
  </div>
</body>
</html>`,
    },
    en: {
      subject: 'You received a trade proposal! — {{tradeId}}',
      html: `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><title>Trade proposal</title></head>
<body style="font-family:'Segoe UI',system-ui,-apple-system,BlinkMacSystemFont,Arial,sans-serif;background:#f0f5ee;margin:0;padding:0">
  <div style="max-width:600px;margin:32px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 2px 12px #0001">
    <div style="background:linear-gradient(135deg,#1b6a4f,#2d8a5f);padding:40px 40px 36px;text-align:center">
      <div style="font-size:48px;line-height:1;margin-bottom:12px">🌱</div>
      <h1 style="color:#fff;margin:0;font-size:32px;font-weight:800;letter-spacing:-0.5px;text-shadow:0 1px 3px #00000030">INTI</h1>
      <p style="color:#b7e4c7;margin:10px 0 0;font-size:15px;font-weight:500;letter-spacing:0.3px">Field Barter</p>
    </div>
    <div style="padding:40px">
      <div style="text-align:center;margin-bottom:24px"><span style="font-size:48px">📩</span></div>
      <h2 style="color:#1b4332;margin:0 0 16px;font-size:22px;font-weight:700;text-align:center">New trade proposal</h2>
      <p style="color:#475467;line-height:1.8">Hi <strong>{{firstName}}</strong>, <strong>{{proposerName}}</strong> sent you a trade proposal for <strong>{{productName}}</strong>.</p>
      <p style="color:#475467;line-height:1.8">Go to your dashboard to see the details and reply.</p>
      <div style="background:#f0faf5;border:1px solid #d5e8dd;border-radius:14px;padding:18px 24px;margin:24px 0">
        <p style="margin:0;color:#1b4332;font-size:13px"><strong>From:</strong> {{proposerName}}</p>
        <p style="margin:8px 0 0;color:#1b4332;font-size:13px"><strong>Product requested:</strong> {{productName}}</p>
      </div>
      <div style="text-align:center;margin:32px 0">
        <a href="{{dashboardUrl}}" style="background:linear-gradient(135deg,#1b6a4f,#2d8a5f);color:#fff;padding:14px 36px;border-radius:12px;text-decoration:none;font-weight:700;font-size:16px;display:inline-block;box-shadow:0 2px 8px #1b6a4f40">View proposal →</a>
      </div>
      <hr style="border:none;height:1px;background:linear-gradient(to right,transparent,#d0d5dd,transparent);margin:32px 0">
      <p style="color:#999;font-size:12px;text-align:center">Questions? Contact us at <a href="{{contactUrl}}" style="color:#2d6a4f">{{contactUrl}}</a></p>
    </div>
    <div style="background:#f0faf5;padding:20px 40px;text-align:center;border-top:1px solid #e0f0e5">
      <p style="color:#aaa;font-size:11px;margin:0">© INTI — Field Barter</p>
    </div>
  </div>
</body>
</html>`,
    },
    pt: {
      subject: 'Você recebeu uma proposta de troca! — {{tradeId}}',
      html: `<!DOCTYPE html>
<html lang="pt">
<head><meta charset="UTF-8"><title>Proposta de troca</title></head>
<body style="font-family:'Segoe UI',system-ui,-apple-system,BlinkMacSystemFont,Arial,sans-serif;background:#f0f5ee;margin:0;padding:0">
  <div style="max-width:600px;margin:32px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 2px 12px #0001">
    <div style="background:linear-gradient(135deg,#1b6a4f,#2d8a5f);padding:40px 40px 36px;text-align:center">
      <div style="font-size:48px;line-height:1;margin-bottom:12px">🌱</div>
      <h1 style="color:#fff;margin:0;font-size:32px;font-weight:800;letter-spacing:-0.5px;text-shadow:0 1px 3px #00000030">INTI</h1>
      <p style="color:#b7e4c7;margin:10px 0 0;font-size:15px;font-weight:500;letter-spacing:0.3px">Troca do Campo</p>
    </div>
    <div style="padding:40px">
      <div style="text-align:center;margin-bottom:24px"><span style="font-size:48px">📩</span></div>
      <h2 style="color:#1b4332;margin:0 0 16px;font-size:22px;font-weight:700;text-align:center">Nova proposta de troca</h2>
      <p style="color:#475467;line-height:1.8">Olá <strong>{{firstName}}</strong>, <strong>{{proposerName}}</strong> enviou uma proposta de troca por <strong>{{productName}}</strong>.</p>
      <p style="color:#475467;line-height:1.8">Vá ao seu painel para ver os detalhes e responder.</p>
      <div style="background:#f0faf5;border:1px solid #d5e8dd;border-radius:14px;padding:18px 24px;margin:24px 0">
        <p style="margin:0;color:#1b4332;font-size:13px"><strong>De:</strong> {{proposerName}}</p>
        <p style="margin:8px 0 0;color:#1b4332;font-size:13px"><strong>Produto solicitado:</strong> {{productName}}</p>
      </div>
      <div style="text-align:center;margin:32px 0">
        <a href="{{dashboardUrl}}" style="background:linear-gradient(135deg,#1b6a4f,#2d8a5f);color:#fff;padding:14px 36px;border-radius:12px;text-decoration:none;font-weight:700;font-size:16px;display:inline-block;box-shadow:0 2px 8px #1b6a4f40">Ver proposta →</a>
      </div>
      <hr style="border:none;height:1px;background:linear-gradient(to right,transparent,#d0d5dd,transparent);margin:32px 0">
      <p style="color:#999;font-size:12px;text-align:center">Dúvidas? <a href="{{contactUrl}}" style="color:#2d6a4f">{{contactUrl}}</a></p>
    </div>
    <div style="background:#f0faf5;padding:20px 40px;text-align:center;border-top:1px solid #e0f0e5">
      <p style="color:#aaa;font-size:11px;margin:0">© INTI — Troca do Campo</p>
    </div>
  </div>
</body>
</html>`,
    },
    qu: {
      subject: 'Trueque mañakusqanki chayamu! — {{tradeId}}',
      html: `<!DOCTYPE html>
<html lang="qu">
<head><meta charset="UTF-8"><title>Trueque mañakuy</title></head>
<body style="font-family:'Segoe UI',system-ui,-apple-system,BlinkMacSystemFont,Arial,sans-serif;background:#f0f5ee;margin:0;padding:0">
  <div style="max-width:600px;margin:32px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 2px 12px #0001">
    <div style="background:linear-gradient(135deg,#1b6a4f,#2d8a5f);padding:40px 40px 36px;text-align:center">
      <div style="font-size:48px;line-height:1;margin-bottom:12px">🌱</div>
      <h1 style="color:#fff;margin:0;font-size:32px;font-weight:800;letter-spacing:-0.5px;text-shadow:0 1px 3px #00000030">INTI</h1>
      <p style="color:#b7e4c7;margin:10px 0 0;font-size:15px;font-weight:500;letter-spacing:0.3px">Chakra Tinkuy</p>
    </div>
    <div style="padding:40px">
      <div style="text-align:center;margin-bottom:24px"><span style="font-size:48px">📩</span></div>
      <h2 style="color:#1b4332;margin:0 0 16px;font-size:22px;font-weight:700;text-align:center">Musuq trueque mañakuy</h2>
      <p style="color:#475467;line-height:1.8">Napaykullayki <strong>{{firstName}}</strong>, <strong>{{proposerName}}</strong> <strong>{{productName}}</strong>-manta trueque mañakullasunki.</p>
      <p style="color:#475467;line-height:1.8">Panelniykiman riy qawaykipaq kutichinaykipaq.</p>
      <div style="background:#f0faf5;border:1px solid #d5e8dd;border-radius:14px;padding:18px 24px;margin:24px 0">
        <p style="margin:0;color:#1b4332;font-size:13px"><strong>Manta:</strong> {{proposerName}}</p>
        <p style="margin:8px 0 0;color:#1b4332;font-size:13px"><strong>Mañakusqa producto:</strong> {{productName}}</p>
      </div>
      <div style="text-align:center;margin:32px 0">
        <a href="{{dashboardUrl}}" style="background:linear-gradient(135deg,#1b6a4f,#2d8a5f);color:#fff;padding:14px 36px;border-radius:12px;text-decoration:none;font-weight:700;font-size:16px;display:inline-block;box-shadow:0 2px 8px #1b6a4f40">Mañakuyta qaway →</a>
      </div>
      <hr style="border:none;height:1px;background:linear-gradient(to right,transparent,#d0d5dd,transparent);margin:32px 0">
      <p style="color:#999;font-size:12px;text-align:center">Tapukuykikunapaq: <a href="{{contactUrl}}" style="color:#2d6a4f">{{contactUrl}}</a></p>
    </div>
    <div style="background:#f0faf5;padding:20px 40px;text-align:center;border-top:1px solid #e0f0e5">
      <p style="color:#aaa;font-size:11px;margin:0">© INTI — Chakra Tinkuy</p>
    </div>
  </div>
</body>
</html>`,
    },
  },
  TRADE_CANCELLED: {
    es: {
      subject: 'Propuesta de trueque cancelada — {{tradeId}}',
      html: `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><title>Trueque cancelado</title></head>
<body style="font-family:'Segoe UI',system-ui,-apple-system,BlinkMacSystemFont,Arial,sans-serif;background:#f0f5ee;margin:0;padding:0">
  <div style="max-width:600px;margin:32px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 2px 12px #0001">
    <div style="background:linear-gradient(135deg,#1b6a4f,#2d8a5f);padding:40px 40px 36px;text-align:center">
      <div style="font-size:48px;line-height:1;margin-bottom:12px">🌱</div>
      <h1 style="color:#fff;margin:0;font-size:32px;font-weight:800;letter-spacing:-0.5px;text-shadow:0 1px 3px #00000030">INTI</h1>
      <p style="color:#b7e4c7;margin:10px 0 0;font-size:15px;font-weight:500;letter-spacing:0.3px">Trueque del Campo</p>
    </div>
    <div style="padding:48px">
      <h2 style="color:#1b4332;margin:0 0 16px;font-size:22px;font-weight:700">Hola, {{firstName}}</h2>
      <p style="color:#475467;line-height:1.8"><strong>{{proposerName}}</strong> canceló la propuesta de trueque por <strong>{{productName}}</strong> (N° {{tradeId}}).</p>
      <p style="color:#475467;line-height:1.8">No te preocupes, seguí explorando otros productos disponibles en la plataforma.</p>
      <div style="text-align:center;margin:32px 0">
        <a href="{{dashboardUrl}}" style="background:linear-gradient(135deg,#1b6a4f,#2d8a5f);color:#fff;padding:14px 36px;border-radius:12px;text-decoration:none;font-weight:700;font-size:16px;display:inline-block;box-shadow:0 2px 8px #1b6a4f40">Seguir explorando →</a>
      </div>
      <hr style="border:none;height:1px;background:linear-gradient(to right,transparent,#d0d5dd,transparent);margin:32px 0">
      <p style="color:#999;font-size:12px;text-align:center">Si tenés dudas, escribinos a <a href="{{contactUrl}}" style="color:#2d6a4f">{{contactUrl}}</a></p>
    </div>
    <div style="background:#f0faf5;padding:20px 40px;text-align:center;border-top:1px solid #e0f0e5">
      <p style="color:#aaa;font-size:11px;margin:0">© INTI — Trueque del Campo</p>
    </div>
  </div>
</body>
</html>`,
    },
    'es-ar': {
      subject: 'Propuesta de trueque cancelada — {{tradeId}}',
      html: `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><title>Trueque cancelado</title></head>
<body style="font-family:'Segoe UI',system-ui,-apple-system,BlinkMacSystemFont,Arial,sans-serif;background:#f0f5ee;margin:0;padding:0">
  <div style="max-width:600px;margin:32px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 2px 12px #0001">
    <div style="background:linear-gradient(135deg,#1b6a4f,#2d8a5f);padding:40px 40px 36px;text-align:center">
      <div style="font-size:48px;line-height:1;margin-bottom:12px">🌱</div>
      <h1 style="color:#fff;margin:0;font-size:32px;font-weight:800;letter-spacing:-0.5px;text-shadow:0 1px 3px #00000030">INTI</h1>
      <p style="color:#b7e4c7;margin:10px 0 0;font-size:15px;font-weight:500;letter-spacing:0.3px">Trueque del Campo</p>
    </div>
    <div style="padding:48px">
      <h2 style="color:#1b4332;margin:0 0 16px;font-size:22px;font-weight:700">Hola, {{firstName}}</h2>
      <p style="color:#475467;line-height:1.8"><strong>{{proposerName}}</strong> canceló la propuesta de trueque por <strong>{{productName}}</strong> (N° {{tradeId}}).</p>
      <p style="color:#475467;line-height:1.8">No te preocupes, seguí explorando otros productos disponibles en la plataforma.</p>
      <div style="text-align:center;margin:32px 0">
        <a href="{{dashboardUrl}}" style="background:linear-gradient(135deg,#1b6a4f,#2d8a5f);color:#fff;padding:14px 36px;border-radius:12px;text-decoration:none;font-weight:700;font-size:16px;display:inline-block;box-shadow:0 2px 8px #1b6a4f40">Seguir explorando →</a>
      </div>
      <hr style="border:none;height:1px;background:linear-gradient(to right,transparent,#d0d5dd,transparent);margin:32px 0">
      <p style="color:#999;font-size:12px;text-align:center">Si tenés dudas, escribinos a <a href="{{contactUrl}}" style="color:#2d6a4f">{{contactUrl}}</a></p>
    </div>
    <div style="background:#f0faf5;padding:20px 40px;text-align:center;border-top:1px solid #e0f0e5">
      <p style="color:#aaa;font-size:11px;margin:0">© INTI — Trueque del Campo</p>
    </div>
  </div>
</body>
</html>`,
    },
    en: {
      subject: 'Trade proposal cancelled — {{tradeId}}',
      html: `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><title>Trade cancelled</title></head>
<body style="font-family:'Segoe UI',system-ui,-apple-system,BlinkMacSystemFont,Arial,sans-serif;background:#f0f5ee;margin:0;padding:0">
  <div style="max-width:600px;margin:32px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 2px 12px #0001">
    <div style="background:linear-gradient(135deg,#1b6a4f,#2d8a5f);padding:40px 40px 36px;text-align:center">
      <div style="font-size:48px;line-height:1;margin-bottom:12px">🌱</div>
      <h1 style="color:#fff;margin:0;font-size:32px;font-weight:800;letter-spacing:-0.5px;text-shadow:0 1px 3px #00000030">INTI</h1>
      <p style="color:#b7e4c7;margin:10px 0 0;font-size:15px;font-weight:500;letter-spacing:0.3px">Field Barter</p>
    </div>
    <div style="padding:48px">
      <h2 style="color:#1b4332;margin:0 0 16px;font-size:22px;font-weight:700">Hi, {{firstName}}</h2>
      <p style="color:#475467;line-height:1.8"><strong>{{proposerName}}</strong> cancelled the trade proposal for <strong>{{productName}}</strong> (Trade #{{tradeId}}).</p>
      <p style="color:#475467;line-height:1.8">Don't worry, keep exploring other products available on the platform.</p>
      <div style="text-align:center;margin:32px 0">
        <a href="{{dashboardUrl}}" style="background:linear-gradient(135deg,#1b6a4f,#2d8a5f);color:#fff;padding:14px 36px;border-radius:12px;text-decoration:none;font-weight:700;font-size:16px;display:inline-block;box-shadow:0 2px 8px #1b6a4f40">Keep exploring →</a>
      </div>
      <hr style="border:none;height:1px;background:linear-gradient(to right,transparent,#d0d5dd,transparent);margin:32px 0">
      <p style="color:#999;font-size:12px;text-align:center">Questions? Contact us at <a href="{{contactUrl}}" style="color:#2d6a4f">{{contactUrl}}</a></p>
    </div>
    <div style="background:#f0faf5;padding:20px 40px;text-align:center;border-top:1px solid #e0f0e5">
      <p style="color:#aaa;font-size:11px;margin:0">© INTI — Field Barter</p>
    </div>
  </div>
</body>
</html>`,
    },
    pt: {
      subject: 'Proposta de troca cancelada — {{tradeId}}',
      html: `<!DOCTYPE html>
<html lang="pt">
<head><meta charset="UTF-8"><title>Troca cancelada</title></head>
<body style="font-family:'Segoe UI',system-ui,-apple-system,BlinkMacSystemFont,Arial,sans-serif;background:#f0f5ee;margin:0;padding:0">
  <div style="max-width:600px;margin:32px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 2px 12px #0001">
    <div style="background:linear-gradient(135deg,#1b6a4f,#2d8a5f);padding:40px 40px 36px;text-align:center">
      <div style="font-size:48px;line-height:1;margin-bottom:12px">🌱</div>
      <h1 style="color:#fff;margin:0;font-size:32px;font-weight:800;letter-spacing:-0.5px;text-shadow:0 1px 3px #00000030">INTI</h1>
      <p style="color:#b7e4c7;margin:10px 0 0;font-size:15px;font-weight:500;letter-spacing:0.3px">Troca do Campo</p>
    </div>
    <div style="padding:48px">
      <h2 style="color:#1b4332;margin:0 0 16px;font-size:22px;font-weight:700">Olá, {{firstName}}</h2>
      <p style="color:#475467;line-height:1.8"><strong>{{proposerName}}</strong> cancelou a proposta de troca por <strong>{{productName}}</strong> (N° {{tradeId}}).</p>
      <p style="color:#475467;line-height:1.8">Não se preocupe, continue explorando outros produtos disponíveis na plataforma.</p>
      <div style="text-align:center;margin:32px 0">
        <a href="{{dashboardUrl}}" style="background:linear-gradient(135deg,#1b6a4f,#2d8a5f);color:#fff;padding:14px 36px;border-radius:12px;text-decoration:none;font-weight:700;font-size:16px;display:inline-block;box-shadow:0 2px 8px #1b6a4f40">Continuar explorando →</a>
      </div>
      <hr style="border:none;height:1px;background:linear-gradient(to right,transparent,#d0d5dd,transparent);margin:32px 0">
      <p style="color:#999;font-size:12px;text-align:center">Dúvidas? <a href="{{contactUrl}}" style="color:#2d6a4f">{{contactUrl}}</a></p>
    </div>
    <div style="background:#f0faf5;padding:20px 40px;text-align:center;border-top:1px solid #e0f0e5">
      <p style="color:#aaa;font-size:11px;margin:0">© INTI — Troca do Campo</p>
    </div>
  </div>
</body>
</html>`,
    },
    qu: {
      subject: 'Trueque mañakuy kutichisqa — {{tradeId}}',
      html: `<!DOCTYPE html>
<html lang="qu">
<head><meta charset="UTF-8"><title>Trueque Kutichisqa</title></head>
<body style="font-family:'Segoe UI',system-ui,-apple-system,BlinkMacSystemFont,Arial,sans-serif;background:#f0f5ee;margin:0;padding:0">
  <div style="max-width:600px;margin:32px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 2px 12px #0001">
    <div style="background:linear-gradient(135deg,#1b6a4f,#2d8a5f);padding:40px 40px 36px;text-align:center">
      <div style="font-size:48px;line-height:1;margin-bottom:12px">🌱</div>
      <h1 style="color:#fff;margin:0;font-size:32px;font-weight:800;letter-spacing:-0.5px;text-shadow:0 1px 3px #00000030">INTI</h1>
      <p style="color:#b7e4c7;margin:10px 0 0;font-size:15px;font-weight:500;letter-spacing:0.3px">Chakra Tinkuy</p>
    </div>
    <div style="padding:48px">
      <h2 style="color:#1b4332;margin:0 0 16px;font-size:22px;font-weight:700">Napaykullayki, {{firstName}}</h2>
      <p style="color:#475467;line-height:1.8"><strong>{{proposerName}}</strong> <strong>{{productName}}</strong>-manta tinkuy mañakuyta (N° {{tradeId}}) kutichirqan.</p>
      <p style="color:#475467;line-height:1.8">Ama llakikuychu, hukkunata qawayta atillankipaq.</p>
      <div style="text-align:center;margin:32px 0">
        <a href="{{dashboardUrl}}" style="background:linear-gradient(135deg,#1b6a4f,#2d8a5f);color:#fff;padding:14px 36px;border-radius:12px;text-decoration:none;font-weight:700;font-size:16px;display:inline-block;box-shadow:0 2px 8px #1b6a4f40">Qawayta qallariy →</a>
      </div>
      <hr style="border:none;height:1px;background:linear-gradient(to right,transparent,#d0d5dd,transparent);margin:32px 0">
      <p style="color:#999;font-size:12px;text-align:center">Tapukuykikunapaq: <a href="{{contactUrl}}" style="color:#2d6a4f">{{contactUrl}}</a></p>
    </div>
    <div style="background:#f0faf5;padding:20px 40px;text-align:center;border-top:1px solid #e0f0e5">
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

  // BCC
  const [bccStatus, setBccStatus] = useState<{ value: string; enabled: boolean } | null>(null)
  const [bccLoading, setBccLoading] = useState(true)
  const [bccEditing, setBccEditing] = useState(false)
  const [bccEmail, setBccEmail] = useState('')
  const [bccSaving, setBccSaving] = useState(false)

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

  const fetchBcc = useCallback(async () => {
    try {
      const status = await getBccStatus()
      setBccStatus(status)
      setBccEmail(status?.value ?? '')
    } catch {
      setBccStatus(null)
    } finally {
      setBccLoading(false)
    }
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (isAdmin) fetchBcc()
  }, [isAdmin, fetchBcc])

  const handleBccSave = async () => {
    setBccSaving(true)
    try {
      const updated = await setBccConfig(bccEmail, true)
      setBccStatus(updated)
      setBccEditing(false)
      toast.success('Configuración BCC guardada')
    } catch {
      toast.error('Error al guardar configuración BCC')
    } finally {
      setBccSaving(false)
    }
  }

  const handleBccToggle = async () => {
    if (!bccStatus) return
    const nextEnabled = !bccStatus.enabled
    try {
      const updated = await setBccConfig(bccStatus.value, nextEnabled)
      setBccStatus(updated)
      toast.success(nextEnabled ? 'BCC activado' : 'BCC desactivado')
    } catch {
      toast.error('Error al cambiar estado BCC')
    }
  }

  const handleBccDelete = async () => {
    if (!confirm('¿Eliminar configuración BCC?')) return
    try {
      await deleteBccConfig()
      setBccStatus(null)
      setBccEmail('')
      setBccEditing(false)
      toast.success('Configuración BCC eliminada')
    } catch {
      toast.error('Error al eliminar configuración BCC')
    }
  }

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

      {/* ─── BCC Admin Banner ──────────────────────────────────────────────── */}
      {bccLoading ? (
        <div className="mb-6 rounded-2xl border bg-gray-50 p-4 flex items-center gap-3">
          <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
          <span className="text-sm text-gray-500">Cargando configuración BCC...</span>
        </div>
      ) : (
        <div className={`mb-6 rounded-2xl border p-4 ${
          !bccStatus?.value
            ? 'bg-gray-50 border-gray-200'
            : bccStatus.enabled
              ? 'bg-green-50 border-green-200'
              : 'bg-amber-50 border-amber-200'
        }`}>
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className={`p-1.5 rounded-lg ${
                !bccStatus?.value
                  ? 'bg-gray-200 text-gray-600'
                  : bccStatus.enabled
                    ? 'bg-green-200 text-green-700'
                    : 'bg-amber-200 text-amber-700'
              }`}>
                <Settings2 className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">Copia Oculta (BCC)</p>
                <p className="text-xs text-gray-500">
                  {!bccStatus?.value
                    ? 'No configurado'
                    : bccStatus.enabled
                      ? `Enviando copia a: ${bccStatus.value}`
                      : `${bccStatus.value} (desactivado)`}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {bccEditing ? (
                <>
                  <input
                    type="email"
                    value={bccEmail}
                    onChange={(e) => setBccEmail(e.target.value)}
                    placeholder="admin@ejemplo.com"
                    className="w-56 rounded-lg border border-gray-300 px-3 py-1.5 text-sm outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100"
                  />
                  <button
                    onClick={handleBccSave}
                    disabled={bccSaving || !bccEmail.trim()}
                    className="flex items-center gap-1 bg-green-600 text-white text-xs px-3 py-1.5 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-60"
                  >
                    {bccSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                    Guardar
                  </button>
                  <button
                    onClick={() => { setBccEditing(false); setBccEmail(bccStatus?.value ?? '') }}
                    className="flex items-center gap-1 text-gray-500 text-xs px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <X className="h-3.5 w-3.5" />
                    Cancelar
                  </button>
                </>
              ) : (
                <>
                  {bccStatus?.value && (
                    <button
                      onClick={handleBccToggle}
                      className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${
                        bccStatus.enabled
                          ? 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                          : 'bg-green-100 text-green-700 hover:bg-green-200'
                      }`}
                    >
                      {bccStatus.enabled ? 'Desactivar' : 'Activar'}
                    </button>
                  )}
                  <button
                    onClick={() => setBccEditing(true)}
                    className="text-xs px-3 py-1.5 rounded-lg bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
                  >
                    {bccStatus?.value ? 'Cambiar' : 'Configurar'}
                  </button>
                  {bccStatus?.value && (
                    <button
                      onClick={handleBccDelete}
                      className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ─── Missing templates alert ──────────────────────────────────────── */}
      {(() => {
        const missing = groups.flatMap((group) =>
          TEMPLATE_KEYS.filter((tk) => tk.group === group).flatMap((tk) => {
            const missingLocales = LOCALES.filter((l) => !hasTemplate(tk.key, l.code))
            return missingLocales.length > 0
              ? [`${tk.label} (${missingLocales.map((l) => l.code).join(', ')})`]
              : []
          }),
        )
        if (missing.length === 0) return null
        return (
          <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 p-4">
            <div className="flex items-start gap-3">
              <div className="p-1 rounded-lg bg-amber-200 text-amber-700 shrink-0 mt-0.5">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-semibold text-amber-800">Faltan traducciones para algunos templates</p>
                <ul className="mt-1 text-sm text-amber-700 list-disc list-inside">
                  {missing.map((m) => <li key={m}>{m}</li>)}
                </ul>
              </div>
            </div>
          </div>
        )
      })()}

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
