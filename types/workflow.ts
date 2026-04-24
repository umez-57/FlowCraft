export type NodeType = "start" | "task" | "approval" | "automatedStep" | "end"

export interface BaseNodeData {
  label: string
  [key: string]: unknown
}

export interface StartNodeData extends BaseNodeData {
  title: string
  metadata?: Record<string, string>
}

export interface TaskNodeData extends BaseNodeData {
  title: string
  description?: string
  assignee?: string
  dueDate?: string
  customFields?: Record<string, string>
}

export interface ApprovalNodeData extends BaseNodeData {
  title: string
  approverRole: string
  autoApproveThreshold?: number
}

export interface AutomatedStepNodeData extends BaseNodeData {
  title: string
  actionId: string
  actionParams?: Record<string, string>
}

export interface EndNodeData extends BaseNodeData {
  endMessage: string
  summary?: boolean
}

export type AnyNodeData =
  | StartNodeData
  | TaskNodeData
  | ApprovalNodeData
  | AutomatedStepNodeData
  | EndNodeData

export interface WorkflowNode {
  id: string
  type: NodeType
  position: { x: number; y: number }
  data: AnyNodeData
}

export interface WorkflowEdge {
  id: string
  source: string
  target: string
}

export interface Workflow {
  nodes: WorkflowNode[]
  edges: WorkflowEdge[]
}

/**
 * A snapshot of a node's data at a point in time. Used for the per-node
 * version history feature. The `data` field stores what the node looked
 * like BEFORE the change so restoring reverts to that state.
 */
export interface NodeVersion {
  timestamp: number
  data: AnyNodeData
  changedFields: string[]
}

export type NodeHistoryMap = Record<string, NodeVersion[]>
