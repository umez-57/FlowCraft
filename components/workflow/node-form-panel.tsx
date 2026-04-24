"use client"

import { useMemo } from "react"
import type { Node } from "reactflow"
import type {
  AnyNodeData,
  ApprovalNodeData,
  AutomatedStepNodeData,
  EndNodeData,
  NodeType,
  NodeVersion,
  StartNodeData,
  TaskNodeData,
} from "@/types/workflow"
import { NODE_REGISTRY } from "@/lib/workflow/node-registry"
import { StartNodeForm } from "./forms/start-node-form"
import { TaskNodeForm } from "./forms/task-node-form"
import { ApprovalNodeForm } from "./forms/approval-node-form"
import { AutomatedStepNodeForm } from "./forms/automated-step-node-form"
import { EndNodeForm } from "./forms/end-node-form"
import { NodeHistory } from "./node-history"
import { Button } from "@/components/ui/button"
import { Trash2, X, Hand } from "lucide-react"
import { cn } from "@/lib/utils"

interface NodeFormPanelProps {
  node: Node<AnyNodeData> | null
  onChange: (id: string, patch: Partial<AnyNodeData>) => void
  onDelete: (id: string) => void
  onClose: () => void
  versions: NodeVersion[]
  onRestoreVersion: (nodeId: string, timestamp: number) => void
  onClearHistory: (nodeId: string) => void
}

export function NodeFormPanel({
  node,
  onChange,
  onDelete,
  onClose,
  versions,
  onRestoreVersion,
  onClearHistory,
}: NodeFormPanelProps) {
  const errors = useMemo<Record<string, string>>(() => {
    if (!node) return {}
    const e: Record<string, string> = {}
    const d = node.data as AnyNodeData
    if (node.type !== "end") {
      const title = (d as { title?: string }).title
      if (!title || title.trim() === "") e.title = "Title is required"
    }
    if (node.type === "automatedStep") {
      const ad = d as AutomatedStepNodeData
      if (!ad.actionId) e.actionId = "Please select an action"
    }
    return e
  }, [node])

  if (!node) {
    return (
      <aside className="flex h-full w-80 shrink-0 flex-col items-center justify-center border-l bg-card p-6 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
          <Hand className="h-5 w-5 text-muted-foreground" />
        </div>
        <p className="mt-3 text-sm font-medium">No node selected</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Click a node on the canvas to configure it, or drag a new node from the
          sidebar.
        </p>
      </aside>
    )
  }

  const nodeType = (node.type ?? "task") as NodeType
  const entry = NODE_REGISTRY[nodeType]
  const Icon = entry.icon

  const handleChange = (patch: Partial<AnyNodeData>) => {
    onChange(node.id, patch)
  }

  return (
    <aside className="flex h-full w-80 shrink-0 flex-col border-l bg-card">
      <div className="flex items-center justify-between gap-2 border-b p-4">
        <div className="flex min-w-0 items-center gap-2.5">
          <div
            className={cn(
              "flex h-8 w-8 shrink-0 items-center justify-center rounded-md",
              entry.accentBg,
            )}
          >
            <Icon className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{entry.label} Node</p>
            <p className="truncate text-[11px] text-muted-foreground">
              {entry.description}
            </p>
          </div>
        </div>
        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={onClose} aria-label="Close panel">
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex-1 space-y-5 overflow-y-auto p-4">
        {nodeType === "start" && (
          <StartNodeForm data={node.data as StartNodeData} onChange={handleChange} />
        )}
        {nodeType === "task" && (
          <TaskNodeForm
            data={node.data as TaskNodeData}
            onChange={handleChange}
            errors={errors}
          />
        )}
        {nodeType === "approval" && (
          <ApprovalNodeForm
            data={node.data as ApprovalNodeData}
            onChange={handleChange}
            errors={errors}
          />
        )}
        {nodeType === "automatedStep" && (
          <AutomatedStepNodeForm
            data={node.data as AutomatedStepNodeData}
            onChange={handleChange}
            errors={errors}
          />
        )}
        {nodeType === "end" && (
          <EndNodeForm data={node.data as EndNodeData} onChange={handleChange} />
        )}

        <NodeHistory
          nodeId={node.id}
          versions={versions}
          currentData={node.data as AnyNodeData}
          onRestore={onRestoreVersion}
          onClear={onClearHistory}
        />
      </div>

      <div className="border-t p-3">
        <Button
          variant="outline"
          className="w-full text-destructive hover:bg-destructive/10 hover:text-destructive"
          onClick={() => onDelete(node.id)}
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Delete Node
        </Button>
        <p className="mt-2 text-center text-[10px] text-muted-foreground">
          Node ID: <code className="font-mono">{node.id}</code>
        </p>
      </div>
    </aside>
  )
}
