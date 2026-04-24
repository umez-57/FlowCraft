"use client"

import { memo } from "react"
import { Handle, Position, type NodeProps } from "reactflow"
import { AlertTriangle, XCircle } from "lucide-react"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { NODE_REGISTRY } from "@/lib/workflow/node-registry"
import { useNodeIssues } from "@/lib/workflow/validation-context"
import type {
  AnyNodeData,
  ApprovalNodeData,
  AutomatedStepNodeData,
  EndNodeData,
  NodeType,
  StartNodeData,
  TaskNodeData,
} from "@/types/workflow"
import { cn } from "@/lib/utils"

function Subtitle({ type, data }: { type: NodeType; data: AnyNodeData }) {
  switch (type) {
    case "start": {
      const d = data as StartNodeData
      return <span className="truncate">{d.title || "Untitled start"}</span>
    }
    case "task": {
      const d = data as TaskNodeData
      return (
        <span className="truncate">
          {d.assignee ? `→ ${d.assignee}` : "Unassigned"}
          {d.dueDate ? ` • ${d.dueDate}` : ""}
        </span>
      )
    }
    case "approval": {
      const d = data as ApprovalNodeData
      return <span className="truncate">{d.approverRole || "No role"}</span>
    }
    case "automatedStep": {
      const d = data as AutomatedStepNodeData
      return (
        <span className="truncate">
          {d.actionId ? d.actionId.replace(/_/g, " ") : "No action selected"}
        </span>
      )
    }
    case "end": {
      const d = data as EndNodeData
      return <span className="truncate">{d.endMessage || "Completed"}</span>
    }
  }
}

export const CustomNode = memo(function CustomNode({
  id,
  type,
  data,
  selected,
}: NodeProps<AnyNodeData>) {
  const nodeType = (type ?? "task") as NodeType
  const entry = NODE_REGISTRY[nodeType]
  const Icon = entry.icon
  const title =
    (data as { title?: string }).title ??
    (data as { endMessage?: string }).endMessage ??
    entry.label

  const showTarget = nodeType !== "start"
  const showSource = nodeType !== "end"

  const issues = useNodeIssues(id)
  const hasError = issues.some((i) => i.severity === "error")
  const hasWarning = !hasError && issues.some((i) => i.severity === "warning")

  return (
    <div
      className={cn(
        "group relative w-60 rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-150",
        selected
          ? "border-primary shadow-md ring-2 ring-primary/30"
          : hasError
            ? "border-destructive/70 ring-2 ring-destructive/20 hover:shadow-md"
            : hasWarning
              ? "border-amber-500/70 ring-2 ring-amber-500/20 hover:shadow-md"
              : "border-border hover:border-foreground/30 hover:shadow-md",
      )}
    >
      {showTarget && (
        <Handle
          type="target"
          position={Position.Top}
          className="!h-2.5 !w-2.5 !border-background !bg-foreground/60"
        />
      )}
      <div className={cn("h-1 w-full rounded-t-lg", entry.accent)} />
      <div className="flex items-start gap-3 p-3">
        <div
          className={cn(
            "flex h-9 w-9 shrink-0 items-center justify-center rounded-md",
            entry.accentBg,
          )}
        >
          <Icon className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <p className="truncate text-sm font-semibold">{title}</p>
            <span className="shrink-0 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              {entry.label}
            </span>
          </div>
          <p className="mt-0.5 truncate text-xs text-muted-foreground">
            <Subtitle type={nodeType} data={data} />
          </p>
        </div>
      </div>

      {/* Validation indicator (top-right corner) */}
      {issues.length > 0 && (
        <TooltipProvider delayDuration={150}>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                aria-label={`${issues.length} validation ${issues.length === 1 ? "issue" : "issues"}`}
                className={cn(
                  "absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full border border-background shadow-sm transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1",
                  hasError
                    ? "bg-destructive text-destructive-foreground focus-visible:ring-destructive"
                    : "bg-amber-500 text-white focus-visible:ring-amber-500",
                )}
              >
                {hasError ? (
                  <XCircle className="h-3 w-3" />
                ) : (
                  <AlertTriangle className="h-3 w-3" />
                )}
              </button>
            </TooltipTrigger>
            <TooltipContent side="right" className="max-w-xs">
              <ul className="space-y-1 text-xs">
                {issues.map((issue, i) => (
                  <li key={i}>• {issue.message}</li>
                ))}
              </ul>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}

      {showSource && (
        <Handle
          type="source"
          position={Position.Bottom}
          className="!h-2.5 !w-2.5 !border-background !bg-foreground/60"
        />
      )}
    </div>
  )
})
