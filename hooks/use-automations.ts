"use client"

import { useEffect, useState } from "react"
import type { AutomatedAction } from "@/types/api"
import { workflowApi } from "@/lib/workflow/api-client"

export function useAutomations() {
  const [actions, setActions] = useState<AutomatedAction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    workflowApi
      .getAutomations()
      .then((data) => {
        if (mounted) setActions(data)
      })
      .catch((e: unknown) => {
        if (mounted) setError(e instanceof Error ? e.message : "Unknown error")
      })
      .finally(() => {
        if (mounted) setLoading(false)
      })
    return () => {
      mounted = false
    }
  }, [])

  return { actions, loading, error }
}
