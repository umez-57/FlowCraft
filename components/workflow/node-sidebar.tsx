"use client"

import type { DragEvent } from "react"
import { useState, useEffect } from "react"
import { NODE_REGISTRY, NODE_TYPE_ORDER } from "@/lib/workflow/node-registry"
import type { NodeType } from "@/types/workflow"
import { cn } from "@/lib/utils"
import { GripVertical, ChevronDown, ChevronUp, Lightbulb } from "lucide-react"
import { Button } from "@/components/ui/button"

const TIPS_COLLAPSED_KEY = "flowcraft:tips-collapsed"

interface NodeSidebarProps {
  className?: string
}

export function NodeSidebar({ className }: NodeSidebarProps) {
  // Persist collapsed state in localStorage so returning users don't see tips
  const [tipsCollapsed, setTipsCollapsed] = useState(true) // default collapsed, will check localStorage
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const stored = localStorage.getItem(TIPS_COLLAPSED_KEY)
    // Default to expanded for first-time users (no stored value)
    setTipsCollapsed(stored === "true")
  }, [])

  const toggleTips = () => {
    const next = !tipsCollapsed
    setTipsCollapsed(next)
    localStorage.setItem(TIPS_COLLAPSED_KEY, String(next))
  }

  const onDragStart = (event: DragEvent<HTMLDivElement>, type: NodeType) => {
    event.dataTransfer.setData("application/reactflow", type)
    event.dataTransfer.effectAllowed = "move"
  }

  return (
    <aside
      className={cn(
        "flex h-full w-64 shrink-0 flex-col border-r bg-sidebar text-sidebar-foreground",
        className,
      )}
    >
      <div className="border-b p-4">
        <p className="text-sm font-semibold">Node Library</p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Drag any node onto the canvas
        </p>
      </div>
      <div className="flex-1 space-y-2 overflow-y-auto p-3">
        {NODE_TYPE_ORDER.map((type) => {
          const entry = NODE_REGISTRY[type]
          const Icon = entry.icon
          return (
            <div
              key={type}
              draggable
              onDragStart={(e) => onDragStart(e, type)}
              className="group flex cursor-grab items-start gap-3 rounded-md border bg-card p-3 shadow-sm transition-all hover:border-foreground/30 hover:shadow-md active:cursor-grabbing"
              role="button"
              tabIndex={0}
              aria-label={`Drag ${entry.label} node to canvas`}
            >
              <div
                className={cn(
                  "flex h-9 w-9 shrink-0 items-center justify-center rounded-md",
                  entry.accentBg,
                )}
              >
                <Icon className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{entry.label}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {entry.description}
                </p>
              </div>
              <GripVertical className="h-4 w-4 shrink-0 text-muted-foreground/60 opacity-0 transition-opacity group-hover:opacity-100" />
            </div>
          )
        })}
      </div>
      {/* Collapsible Tips Section */}
      <div className="border-t text-[11px] leading-relaxed text-muted-foreground">
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleTips}
          className="flex h-auto w-full items-center justify-between rounded-none px-3 py-2.5 text-left hover:bg-muted/50"
        >
          <span className="flex items-center gap-1.5">
            <Lightbulb className="h-3.5 w-3.5 text-amber-500" />
            <span className="font-medium text-foreground">Tips</span>
          </span>
          {mounted && (tipsCollapsed ? (
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
          ) : (
            <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" />
          ))}
        </Button>
        {mounted && !tipsCollapsed && (
          <ul className="list-inside list-disc space-y-0.5 px-3 pb-3">
            <li>Drag between handles to connect</li>
            <li>Click a node to edit its properties</li>
            <li>
              <span className="font-medium text-foreground">Left-drag</span> on empty canvas to
              box-select
            </li>
            <li>
              Hold <span className="font-medium text-foreground">Space</span> and drag, or{" "}
              <span className="font-medium text-foreground">right-click drag</span>, to pan
            </li>
            <li>
              <span className="font-medium text-foreground">Shift</span> / <span className="font-medium text-foreground">Ctrl</span>+click to add to selection
            </li>
            <li>Scroll wheel pans, pinch or ctrl+scroll zooms</li>
            <li>
              Press <span className="font-medium text-foreground">Delete</span> to remove selected
            </li>
          </ul>
        )}
      </div>
    </aside>
  )
}
