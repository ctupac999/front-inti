# INTI Frontend — Plataforma de Trueque Agrícola

Frontend web para la plataforma de trueque entre productores rurales. Construido con Next.js 16 + React 19.

## Stack

- **Runtime:** Node.js + TypeScript
- **Framework:** Next.js 16 (App Router)
- **Estilos:** Tailwind CSS v4 + tw-animate-css
- **UI:** shadcn/ui + lucide-react
- **Formularios:** react-hook-form + zod
- **Estado:** Zustand (config del sitio)
- **HTTP:** fetch wrapper propio (`utils/api.ts`)
- **i18n:** Contexto propio (sin next-intl routing)
- **Testing:** vitest + @testing-library/react + vitest-axe
- **Lint:** ESLint flat config (eslint-config-next)
- **Package manager:** pnpm

## Prerrequisitos

- Node.js >= 18
- pnpm
- Backend INTI corriendo (ver `back-inti/`)

## Configuración

Crear `.env` (ver `.env.example`):

| Variable | Descripción | Default |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | URL del backend | `http://localhost:3001/api` |
| `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name | — |

```bash
pnpm install
pnpm run dev
```

## Estructura

```
app/              # Páginas (App Router)
├── admin/        # Panel de administración
├── auth/         # Login, registro
├── dashboard/    # Panel de usuario
├── legal/        # Términos, privacidad, cookies
└── productos/    # Marketplace público

components/
├── layout/       # Navbar, LanguageSwitcher
├── legal/        # CookieConsentBanner, LegalConsentGuard
├── products/     # ProductImageUpload
└── ui/           # shadcn/ui primitives

config/           # Idiomas, catálogo de ubicaciones
contexts/         # AuthContext, LanguageContext
services/         # Capa de API (auth, users, products, trades...)
stores/           # Zustand (site-config)
translations/     # 5 idiomas (es, es-ar, en, pt, qu)
types/            # TypeScript definitions
utils/            # Cliente HTTP, configuración de rutas
```

## Comandos

```bash
pnpm run dev       # Servidor de desarrollo
pnpm run build     # Build de producción
pnpm run lint      # ESLint
pnpm run typecheck # tsc --noEmit
pnpm test          # vitest run
pnpm run check     # lint + typecheck + test
```

## i18n

- Usar `useLanguage()` desde `@/contexts/language-context`
- Retorna `{ t, language, setLanguage }`
- `t(key, params?)` traduce con fallback a español
- `es-ar` (argentino voseo) sobrescribe claves específicas de `es`
- Nuevas traducciones: editar el archivo del locale en `translations/`

## Testing

- Tests junto al código fuente: `*.test.ts` / `*.test.tsx`
- 93 tests · 16 suites
- Incluye tests de accesibilidad con `vitest-axe`

```bash
pnpm test          # Todos los tests
pnpm test:watch    # Modo watch
```

## Despliegue

Build estándar de Next.js:

```bash
pnpm run build
pnpm run start     # Servidor Node (producción)
```

También compatible con Vercel y otros hosts de Node.js.

## Licencia

UNLICENSED — uso interno del proyecto INTI.
