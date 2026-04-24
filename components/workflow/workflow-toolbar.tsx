"use client"

import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  Download,
  LayoutGrid,
  MoreHorizontal,
  Play,
  Redo2,
  Sparkles,
  Trash2,
  Undo2,
  Upload,
} from "lucide-react"

/**
 * Flowcraft brand mark. Two filled nodes connected by an S-curve — a
 * literal rendering of the tool's value prop. Custom SVG (not a lucide
 * icon) so the logo has its own identity and reads cleanly at 16px.
 */
function FlowcraftMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="6" cy="7" r="2.5" fill="currentColor" stroke="none" />
      <circle cx="18" cy="17" r="2.5" fill="currentColor" stroke="none" />
      <path d="M8.25 8.5 C 11 10, 13 14, 15.75 15.5" fill="none" />
    </svg>
  )
}
import type { ChangeEvent, ReactNode } from "react"
import { useRef } from "react"
import { WORKFLOW_TEMPLATES, type WorkflowTemplate } from "@/lib/workflow/templates"
import { WorkflowSwitcher } from "./workflow-switcher"
import type { WorkflowRecord } from "@/lib/workflow/workflow-store"

interface WorkflowToolbarProps {
  // Registry (for the center switcher)
  workflows: WorkflowRecord[]
  activeId: string
  onSelectWorkflow: (id: string) => void
  onCreateWorkflow: () => void
  onRenameWorkflow: (id: string, name: string) => void
  onDuplicateWorkflow: (id: string) => void
  onDeleteWorkflow: (id: string) => void

  // Canvas actions
  onTest: () => void
  onClear: () => void
  onExport: () => void
  onImport: (file: File) => void
  onLoadTemplate: (template: WorkflowTemplate) => void
  onUndo: () => void
  onRedo: () => void
  canUndo: boolean
  canRedo: boolean
  onAutoLayout: () => void
}

function IconButton({
  label,
  shortcut,
  children,
  onClick,
  disabled,
}: {
  label: string
  shortcut?: string
  children: ReactNode
  onClick: () => void
  disabled?: boolean
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClick}
          disabled={disabled}
          aria-label={label}
          className="h-8 w-8"
        >
          {children}
        </Button>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="flex items-center gap-2">
        <span>{label}</span>
        {shortcut && (
          <kbd className="rounded border bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
            {shortcut}
          </kbd>
        )}
      </TooltipContent>
    </Tooltip>
  )
}

export function WorkflowToolbar({
  workflows,
  activeId,
  onSelectWorkflow,
  onCreateWorkflow,
  onRenameWorkflow,
  onDuplicateWorkflow,
  onDeleteWorkflow,
  onTest,
  onClear,
  onExport,
  onImport,
  onLoadTemplate,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  onAutoLayout,
}: WorkflowToolbarProps) {
  const fileRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) onImport(file)
    if (fileRef.current) fileRef.current.value = ""
  }

  const shortcutMod =
    typeof navigator !== "undefined" && /Mac/i.test(navigator.platform)
      ? "⌘"
      : "Ctrl"

  return (
    <TooltipProvider delayDuration={200}>
      <header className="grid h-14 shrink-0 grid-cols-[1fr_auto_1fr] items-center gap-4 border-b bg-card px-4">
        {/* LEFT — brand */}
        <div className="flex items-center gap-2.5 justify-self-start">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground shadow-sm">
            <FlowcraftMark className="h-[18px] w-[18px]" />
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-semibold leading-none tracking-tight">
              Flowcraft
            </p>
            <p className="mt-0.5 text-[10px] uppercase leading-none tracking-wider text-muted-foreground">
              Workflow Designer
            </p>
          </div>
        </div>

        {/* CENTER — workflow switcher */}
        <div className="justify-self-center">
          <WorkflowSwitcher
            workflows={workflows}
            activeId={activeId}
            onSelect={onSelectWorkflow}
            onCreate={onCreateWorkflow}
            onRename={onRenameWorkflow}
            onDuplicate={onDuplicateWorkflow}
            onDelete={onDeleteWorkflow}
          />
        </div>

        {/* RIGHT — action clusters */}
        <div className="flex items-center justify-self-end">
          {/* Cluster 1: History */}
          <div className="flex items-center gap-0.5">
            <IconButton
              label="Undo"
              shortcut={`${shortcutMod}+Z`}
              onClick={onUndo}
              disabled={!canUndo}
            >
              <Undo2 className="h-4 w-4" />
            </IconButton>
            <IconButton
              label="Redo"
              shortcut={`${shortcutMod}+Shift+Z`}
              onClick={onRedo}
              disabled={!canRedo}
            >
              <Redo2 className="h-4 w-4" />
            </IconButton>
          </div>

          <Separator orientation="vertical" className="mx-2 h-6" />

          {/* Cluster 2: Canvas tools */}
          <div className="flex items-center gap-0.5">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 gap-1.5">
                  <Sparkles className="h-3.5 w-3.5" />
                  <span className="hidden md:inline">Templates</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-72">
                <DropdownMenuLabel>Load a template</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {WORKFLOW_TEMPLATES.map((t) => (
                  <DropdownMenuItem
                    key={t.id}
                    onSelect={() => onLoadTemplate(t)}
                    className="flex flex-col items-start gap-0.5 py-2"
                  >
                    <span className="text-sm font-medium">{t.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {t.description}
                    </span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <IconButton label="Auto-layout" onClick={onAutoLayout}>
              <LayoutGrid className="h-4 w-4" />
            </IconButton>

            <input
              ref={fileRef}
              type="file"
              accept="application/json"
              onChange={handleFileChange}
              className="hidden"
              aria-label="Import workflow JSON"
            />
            <IconButton
              label="Import JSON"
              onClick={() => fileRef.current?.click()}
            >
              <Upload className="h-4 w-4" />
            </IconButton>
            <IconButton label="Export JSON" onClick={onExport}>
              <Download className="h-4 w-4" />
            </IconButton>

            {/* Overflow menu — destructive / secondary actions */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  aria-label="More actions"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onSelect={onClear}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="mr-2 h-3.5 w-3.5" />
                  Clear canvas
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <Separator orientation="vertical" className="mx-2 h-6" />

          {/* Cluster 3: Primary CTA */}
          <Button size="sm" onClick={onTest} className="h-8 gap-1.5">
            <Play className="h-3.5 w-3.5" />
            Test Workflow
          </Button>
        </div>
      </header>
    </TooltipProvider>
  )
}
