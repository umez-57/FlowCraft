"use client"

import { useMemo, useState } from "react"
import { History, RotateCcw, Trash2, ChevronDown, ChevronRight, Check } from "lucide-react"
import type { AnyNodeData, NodeVersion } from "@/types/workflow"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface NodeHistoryProps {
  nodeId: string
  versions: NodeVersion[]
  currentData: AnyNodeData
  onRestore: (nodeId: string, timestamp: number) => void
  onClear: (nodeId: string) => void
}

/** Format a timestamp as a short relative-time string. */
function relativeTime(ts: number, now: number): string {
  const diff = Math.max(0, now - ts)
  const s = Math.floor(diff / 1000)
  if (s < 5) return "just now"
  if (s < 60) return `${s}s ago`
  const m = Math.floor(s / 60)
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  const d = Math.floor(h / 24)
  return `${d}d ago`
}

const FIELD_LABELS: Record<string, string> = {
  title: "Title",
  description: "Description",
  assignee: "Assignee",
  dueDate: "Due date",
  customFields: "Custom fields",
  metadata: "Metadata",
  approverRole: "Approver role",
  autoApproveThreshold: "Auto-approve threshold",
  actionId: "Action",
  actionParams: "Action params",
  endMessage: "End message",
  summary: "Summary flag",
  label: "Label",
  __restore__: "Restored from history",
}

function describeChange(fields: string[]): string {
  if (fields.length === 0) return "Updated"
  if (fields[0] === "__restore__") return "Restored from history"
  const nice = fields.map((f) => FIELD_LABELS[f] ?? f)
  if (nice.length === 1) return `Changed ${nice[0].toLowerCase()}`
  if (nice.length === 2) return `Changed ${nice[0].toLowerCase()} and ${nice[1].toLowerCase()}`
  return `Changed ${nice[0].toLowerCase()}, ${nice[1].toLowerCase()} and ${nice.length - 2} more`
}

/** Deep equality via serialization — fine for plain data objects. */
function dataEquals(a: unknown, b: unknown): boolean {
  if (a === b) return true
  try {
    return JSON.stringify(a) === JSON.stringify(b)
  } catch {
    return false
  }
}

export function NodeHistory({
  nodeId,
  versions,
  currentData,
  onRestore,
  onClear,
}: NodeHistoryProps) {
  const [open, setOpen] = useState(false)
  const now = Date.now()

  // Newest first so the most recent change is at the top.
  const sorted = useMemo(
    () => [...versions].sort((a, b) => b.timestamp - a.timestamp),
    [versions],
  )

  if (versions.length === 0) {
    return (
      <section className="rounded-lg border bg-muted/30 p-3">
        <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
          <History className="h-3.5 w-3.5" />
          Version history
        </div>
        <p className="mt-1.5 text-[11px] leading-relaxed text-muted-foreground">
          No previous versions yet. Edits you make to this node will appear here and
          can be restored individually.
        </p>
      </section>
    )
  }

  return (
    <section className="rounded-lg border bg-muted/30">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-xs font-medium hover:bg-muted/50"
        aria-expanded={open}
      >
        <span className="flex items-center gap-2">
          {open ? (
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
          )}
          <History className="h-3.5 w-3.5 text-muted-foreground" />
          Version history
          <span className="rounded bg-background px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground">
            {versions.length}
          </span>
        </span>
      </button>

      {open && (
        <div className="border-t">
          <ul className="max-h-64 divide-y overflow-y-auto">
            {sorted.map((v) => {
              const isRestore = v.changedFields[0] === "__restore__"
              const isCurrent = dataEquals(v.data, currentData)
              return (
                <li
                  key={v.timestamp}
                  className={cn(
                    "flex items-start gap-2 px-3 py-2 text-[11px]",
                    isCurrent && "bg-emerald-50/60 dark:bg-emerald-950/20",
                  )}
                >
                  <span
                    className={cn(
                      "mt-1 h-1.5 w-1.5 shrink-0 rounded-full",
                      isCurrent
                        ? "bg-emerald-500"
                        : isRestore
                        ? "bg-amber-500"
                        : "bg-primary/60",
                    )}
                    aria-hidden
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-foreground">
                      {describeChange(v.changedFields)}
                    </p>
                    <p className="text-muted-foreground">
                      {relativeTime(v.timestamp, now)}
                    </p>
                  </div>
                  {isCurrent ? (
                    <span className="flex h-6 items-center gap-1 rounded-md bg-emerald-100 px-2 text-[10px] font-medium text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400">
                      <Check className="h-3 w-3" />
                      Current
                    </span>
                  ) : (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 gap-1 px-2 text-[11px]"
                      onClick={() => onRestore(nodeId, v.timestamp)}
                      title="Restore this version"
                    >
                      <RotateCcw className="h-3 w-3" />
                      Restore
                    </Button>
                  )}
                </li>
              )
            })}
          </ul>
          <div className="flex items-center justify-between gap-2 border-t px-3 py-2">
            <p className="text-[10px] text-muted-foreground">
              Stored locally, persists across refreshes
            </p>
            <Button
              size="sm"
              variant="ghost"
              className="h-6 gap-1 px-2 text-[11px] text-destructive hover:bg-destructive/10 hover:text-destructive"
              onClick={() => onClear(nodeId)}
            >
              <Trash2 className="h-3 w-3" />
              Clear
            </Button>
          </div>
        </div>
      )}
    </section>
  )
}
