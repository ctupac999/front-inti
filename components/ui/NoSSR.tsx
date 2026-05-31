'use client'

export default function NoSSR({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
