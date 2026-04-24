import { NextResponse } from "next/server"
import type { ExecutionStep, SimulationRequest, SimulationResponse } from "@/types/api"
import type { WorkflowNode } from "@/types/workflow"
import { topologicalOrder, validateWorkflow } from "@/lib/workflow/validator"
import { MOCK_AUTOMATED_ACTIONS } from "@/lib/workflow/mock-data"

function buildMessage(node: WorkflowNode): string {
  switch (node.type) {
    case "start":
      return `▶ Workflow "${(node.data as { title?: string }).title ?? "Start"}" started`
    case "task": {
      const d = node.data as { title?: string; assignee?: string; dueDate?: string }
      const who = d.assignee ? ` → ${d.assignee}` : ""
      const due = d.dueDate ? ` (due ${d.dueDate})` : ""
      return `📋 Task "${d.title}"${who}${due} awaiting completion`
    }
    case "approval": {
      const d = node.data as { title?: string; approverRole?: string; autoApproveThreshold?: number }
      return `🛡 Approval "${d.title}" routed to ${d.approverRole ?? "Approver"} (auto-approve ≤ ${d.autoApproveThreshold ?? 0})`
    }
    case "automatedStep": {
      const d = node.data as { title?: string; actionId?: string; actionParams?: Record<string, string> }
      const action = MOCK_AUTOMATED_ACTIONS.find((a) => a.id === d.actionId)
      const params = d.actionParams
        ? Object.entries(d.actionParams)
            .filter(([, v]) => v)
            .map(([k, v]) => `${k}=${v}`)
            .join(", ")
        : ""
      return `⚡ Executed "${action?.label ?? d.actionId ?? "unknown action"}"${params ? ` with { ${params} }` : ""}`
    }
    case "end": {
      const d = node.data as { endMessage?: string }
      return `✅ ${d.endMessage ?? "Workflow completed"}`
    }
  }
}

export async function POST(req: Request) {
  const body = (await req.json()) as SimulationRequest
  const validation = validateWorkflow({ nodes: body.nodes, edges: body.edges })

  // Simulate network / processing latency
  await new Promise((r) => setTimeout(r, 400))

  if (!validation.isValid) {
    const resp: SimulationResponse = {
      success: false,
      steps: [],
      errors: validation.errors
        .filter((e) => e.severity === "error")
        .map((e) => e.message),
      durationMs: 0,
    }
    return NextResponse.json(resp, { status: 200 })
  }

  const order = topologicalOrder({ nodes: body.nodes, edges: body.edges })
  const byId = new Map(body.nodes.map((n) => [n.id, n]))
  const started = Date.now()
  const baseTs = Date.now()

  const steps: ExecutionStep[] = order
    .map((id, idx) => {
      const node = byId.get(id)
      if (!node) return null
      return {
        nodeId: node.id,
        nodeType: node.type,
        nodeLabel: (node.data as { title?: string; label?: string }).title ?? node.data.label,
        status: "completed" as const,
        timestamp: new Date(baseTs + idx * 850).toISOString(),
        message: buildMessage(node),
      }
    })
    .filter((s): s is ExecutionStep => s !== null)

  const resp: SimulationResponse = {
    success: true,
    steps,
    errors: [],
    durationMs: Date.now() - started + steps.length * 850,
  }
  return NextResponse.json(resp)
}
