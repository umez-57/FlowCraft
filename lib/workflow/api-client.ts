import type { AutomatedAction, SimulationRequest, SimulationResponse } from "@/types/api"

export const workflowApi = {
  async getAutomations(): Promise<AutomatedAction[]> {
    const res = await fetch("/api/automations", { cache: "no-store" })
    if (!res.ok) throw new Error("Failed to fetch automations")
    return res.json()
  },

  async simulate(request: SimulationRequest): Promise<SimulationResponse> {
    const res = await fetch("/api/simulate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request),
    })
    if (!res.ok) throw new Error("Simulation failed")
    return res.json()
  },
}
