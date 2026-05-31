"use client"

import { useEffect } from "react"

const INTERVAL_MS = 10 * 60 * 1000

export default function BackendPing() {
  useEffect(() => {
    const base = process.env.NEXT_PUBLIC_API_URL
    if (!base) return

    const ping = () => {
      fetch(`${base}/ping`, { method: "GET", cache: "no-store" }).catch(() => {})
    }

    ping()
    const id = setInterval(ping, INTERVAL_MS)
    return () => clearInterval(id)
  }, [])

  return null
}
