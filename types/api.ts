import type { NodeType, WorkflowEdge, WorkflowNode } from "./workflow"

export interface AutomatedAction {
  id: string
  label: string
  params: string[]
}

export interface SimulationRequest {
  nodes: WorkflowNode[]
  edges: WorkflowEdge[]
}

export type ExecutionStatus = "pending" | "running" | "completed" | "skipped" | "failed"

export interface ExecutionStep {
  nodeId: string
  nodeType: NodeType
  nodeLabel: string
  status: ExecutionStatus
  timestamp: string
  message: string
  details?: Record<string, unknown>
}

export interface SimulationResponse {
  success: boolean
  steps: ExecutionStep[]
  errors: string[]
  durationMs: number
}

export interface ValidationError {
  nodeId: string | null
  message: string
  severity: "error" | "warning"
}

export interface ValidationResult {
  isValid: boolean
  errors: ValidationError[]
}
