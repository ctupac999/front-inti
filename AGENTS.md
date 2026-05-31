<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# front-inti — Next.js + React 19

## Stack
- **Runtime:** Node.js + TypeScript (strict mode)
- **Framework:** Next.js 16 (App Router)
- **Styling:** Tailwind CSS v4 + tw-animate-css
- **UI:** shadcn/ui components + lucide-react icons
- **Forms:** react-hook-form + zod
- **State:** zustand (site config)
- **HTTP:** fetch wrapper in `utils/api.ts`
- **i18n:** Custom context-based (no next-intl routing) — see `contexts/language-context.tsx`
- **Testing:** vitest + @testing-library/react
- **Lint:** ESLint flat config (eslint-config-next)
- **Package manager:** pnpm

## Project structure
```
app/              # Next.js App Router pages
components/       # shadcn/ui + feature components
  layout/         # Navbar, LanguageSwitcher
  legal/          # CookieConsentBanner, LegalConsentGuard
  products/       # ProductImageUpload
  ui/             # shadcn/ui primitives
config/           # Languages, location catalog
contexts/         # AuthContext, LanguageContext
services/         # API service layer
stores/           # Zustand stores
translations/     # i18n dictionaries (one file per locale)
types/            # TypeScript type definitions
utils/            # HTTP client, route config
```

## i18n conventions
- Use `useLanguage()` hook from `@/contexts/language-context`
- Returns `{ t, language, setLanguage }`
- `t(key, params?)` translates with fallback to `es`
- Translations split by locale in `translations/` — edit the locale file directly
- `es-ar` (Argentine voseo) overrides specific keys from `es`

## Components
- Prefer server components by default; add `'use client'` only when needed
- Use shadcn/ui primitives from `components/ui/`
- Icons: use lucide-react with `aria-hidden="true"` for decorative icons
- Images: use `next/image` (configured for Cloudinary via `remotePatterns`)

## Commands
```bash
pnpm run dev       # development server
pnpm run build     # production build
pnpm run lint      # ESLint
pnpm run typecheck # tsc --noEmit
pnpm test          # vitest run
pnpm test:watch    # vitest (watch mode)
pnpm run check     # lint + typecheck + test
```

## Testing
- Place test files next to the source: `example.test.tsx`
- vitest config in `vitest.config.ts` with jsdom environment
- Translations test in `translations/index.test.ts`
