"use client"

import { useState } from "react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import {
  Check,
  ChevronDown,
  Copy,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react"
import type { WorkflowRecord } from "@/lib/workflow/workflow-store"
import { cn } from "@/lib/utils"

interface WorkflowSwitcherProps {
  workflows: WorkflowRecord[]
  activeId: string
  onSelect: (id: string) => void
  onCreate: () => void
  onRename: (id: string, name: string) => void
  onDuplicate: (id: string) => void
  onDelete: (id: string) => void
}

/** Tiny, locale-free relative time. "just now / 12s / 4m / 2h / 3d". */
function relativeTime(ts: number): string {
  const diff = Math.max(0, Date.now() - ts)
  const s = Math.floor(diff / 1000)
  if (s < 10) return "just now"
  if (s < 60) return `${s}s ago`
  const m = Math.floor(s / 60)
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  const d = Math.floor(h / 24)
  return `${d}d ago`
}

export function WorkflowSwitcher({
  workflows,
  activeId,
  onSelect,
  onCreate,
  onRename,
  onDuplicate,
  onDelete,
}: WorkflowSwitcherProps) {
  const active = workflows.find((w) => w.id === activeId)
  const [open, setOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [draft, setDraft] = useState("")

  if (!active) return null

  const startRename = (id: string, current: string) => {
    setEditingId(id)
    setDraft(current)
  }
  const commitRename = () => {
    if (editingId && draft.trim()) onRename(editingId, draft)
    setEditingId(null)
  }

  const handleSelect = (id: string) => {
    onSelect(id)
    setOpen(false)
  }

  const handleDelete = (wf: WorkflowRecord) => {
    if (
      typeof window !== "undefined" &&
      window.confirm(`Delete workflow "${wf.name}"? This cannot be undone.`)
    ) {
      onDelete(wf.id)
    }
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="group h-auto max-w-[320px] flex-col items-center gap-0 px-3 py-1 hover:bg-muted"
        >
          <div className="flex max-w-full items-center gap-1.5">
            <span className="truncate text-sm font-semibold">
              {active.name}
            </span>
            <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform group-data-[state=open]:rotate-180" />
          </div>
          <span className="text-[11px] font-normal text-muted-foreground">
            {active.nodes.length} node
            {active.nodes.length === 1 ? "" : "s"} · edited{" "}
            {relativeTime(active.updatedAt)}
          </span>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="center" className="w-80 p-1">
        <DropdownMenuLabel className="px-2 py-1.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
          Your workflows
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        <div className="max-h-[50vh] overflow-y-auto">
          {workflows.map((wf) => {
            const isActive = wf.id === activeId
            const isEditing = editingId === wf.id
            return (
              <div
                key={wf.id}
                role="button"
                tabIndex={0}
                onClick={() => !isEditing && handleSelect(wf.id)}
                onKeyDown={(e) => {
                  if (isEditing) return
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault()
                    handleSelect(wf.id)
                  }
                }}
                className={cn(
                  "group/row flex cursor-pointer items-center gap-1.5 rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-muted focus:bg-muted",
                  isActive && "bg-muted/70",
                )}
              >
                <Check
                  className={cn(
                    "h-4 w-4 shrink-0 text-primary",
                    isActive ? "opacity-100" : "opacity-0",
                  )}
                />

                <div className="flex min-w-0 flex-1 flex-col">
                  {isEditing ? (
                    <input
                      autoFocus
                      value={draft}
                      onChange={(e) => setDraft(e.target.value)}
                      onBlur={commitRename}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault()
                          commitRename()
                        } else if (e.key === "Escape") {
                          e.preventDefault()
                          setEditingId(null)
                        }
                      }}
                      onClick={(e) => e.stopPropagation()}
                      className="w-full truncate rounded-sm border border-border bg-background px-1.5 py-0.5 text-sm outline-none focus:border-primary"
                    />
                  ) : (
                    <span className="truncate font-medium">{wf.name}</span>
                  )}
                  <span className="truncate text-[11px] text-muted-foreground">
                    {wf.nodes.length} node
                    {wf.nodes.length === 1 ? "" : "s"} ·{" "}
                    {relativeTime(wf.updatedAt)}
                  </span>
                </div>

                <div className="ml-1 flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover/row:opacity-100 focus-within:opacity-100">
                  <RowAction
                    label="Rename"
                    onClick={(e) => {
                      e.stopPropagation()
                      startRename(wf.id, wf.name)
                    }}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </RowAction>
                  <RowAction
                    label="Duplicate"
                    onClick={(e) => {
                      e.stopPropagation()
                      onDuplicate(wf.id)
                    }}
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </RowAction>
                  <RowAction
                    label="Delete"
                    destructive
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDelete(wf)
                    }}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </RowAction>
                </div>
              </div>
            )
          })}
        </div>

        <DropdownMenuSeparator />
        <button
          type="button"
          onClick={() => {
            onCreate()
            setOpen(false)
          }}
          className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm font-medium text-foreground hover:bg-muted"
        >
          <Plus className="h-3.5 w-3.5" />
          New workflow
        </button>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function RowAction({
  label,
  children,
  onClick,
  destructive = false,
}: {
  label: string
  children: React.ReactNode
  onClick: (e: React.MouseEvent) => void
  destructive?: boolean
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      aria-label={label}
      onClick={onClick}
      className={cn(
        "h-6 w-6",
        destructive &&
          "text-muted-foreground hover:bg-destructive/10 hover:text-destructive",
      )}
    >
      {children}
    </Button>
  )
}
