"use client"

import { useCallback, useState } from "react"
import type { SimulationResponse } from "@/types/api"
import type { Workflow } from "@/types/workflow"
import { workflowApi } from "@/lib/workflow/api-client"

export function useWorkflowSimulation() {
  const [result, setResult] = useState<SimulationResponse | null>(null)
  const [isRunning, setIsRunning] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const simulate = useCallback(async (workflow: Workflow) => {
    setIsRunning(true)
    setError(null)
    try {
      const res = await workflowApi.simulate(workflow)
      setResult(res)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Simulation failed")
      setResult(null)
    } finally {
      setIsRunning(false)
    }
  }, [])

  const reset = useCallback(() => {
    setResult(null)
    setError(null)
  }, [])

  return { result, isRunning, error, simulate, reset }
}
