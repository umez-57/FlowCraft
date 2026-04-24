"use client"

import { useMemo } from "react"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import type { Workflow } from "@/types/workflow"
import { useWorkflowSimulation } from "@/hooks/use-workflow-simulation"
import { validateWorkflow } from "@/lib/workflow/validator"
import { NODE_REGISTRY } from "@/lib/workflow/node-registry"
import type { NodeType } from "@/types/workflow"
import {
  AlertTriangle,
  CheckCircle2,
  CircleAlert,
  Loader2,
  Play,
  RotateCcw,
  XCircle,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface WorkflowTestPanelProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  getWorkflow: () => Workflow
}

export function WorkflowTestPanel({
  open,
  onOpenChange,
  getWorkflow,
}: WorkflowTestPanelProps) {
  const { result, isRunning, error, simulate, reset } = useWorkflowSimulation()

  const workflow = useMemo(() => (open ? getWorkflow() : null), [open, getWorkflow])

  const validation = useMemo(
    () => (workflow ? validateWorkflow(workflow) : null),
    [workflow],
  )

  const handleRun = () => {
    const wf = getWorkflow()
    simulate(wf)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex w-full flex-col gap-0 p-0 sm:max-w-lg">
        <SheetHeader className="border-b px-6 py-4">
          <SheetTitle>Sandbox & Simulation</SheetTitle>
          <SheetDescription>
            Validate and simulate your workflow end-to-end.
          </SheetDescription>
        </SheetHeader>

        <div className="flex items-center gap-2 border-b bg-muted/30 px-6 py-3">
          <Button onClick={handleRun} disabled={isRunning} className="gap-2">
            {isRunning ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Play className="h-4 w-4" />
            )}
            {isRunning ? "Running..." : "Run Simulation"}
          </Button>
          <Button variant="outline" onClick={reset} disabled={isRunning} className="gap-2">
            <RotateCcw className="h-4 w-4" />
            Reset
          </Button>
        </div>

        <ScrollArea className="min-h-0 flex-1 [&>[data-radix-scroll-area-viewport]]:h-full">
          <div className="space-y-6 px-6 py-5 pb-10">
            {/* Validation */}
            <section>
              <h3 className="mb-2 text-sm font-semibold">Validation</h3>
              {validation && validation.errors.length === 0 ? (
                <div className="flex items-center gap-2 rounded-md border border-emerald-500/20 bg-emerald-500/5 p-3 text-sm text-emerald-700 dark:text-emerald-400">
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  Workflow structure is valid.
                </div>
              ) : (
                <ul className="space-y-2">
                  {validation?.errors.map((e, idx) => (
                    <li
                      key={idx}
                      className={cn(
                        "flex items-start gap-2 rounded-md border p-3 text-sm",
                        e.severity === "error"
                          ? "border-destructive/30 bg-destructive/5 text-destructive"
                          : "border-amber-500/30 bg-amber-500/5 text-amber-700 dark:text-amber-400",
                      )}
                    >
                      {e.severity === "error" ? (
                        <XCircle className="mt-0.5 h-4 w-4 shrink-0" />
                      ) : (
                        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                      )}
                      <span className="leading-relaxed">{e.message}</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <Separator />

            {/* Execution log */}
            <section>
              <h3 className="mb-2 text-sm font-semibold">Execution Log</h3>
              {error && (
                <div className="mb-3 flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
                  <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {!result && !isRunning && !error && (
                <p className="text-sm text-muted-foreground">
                  Press <span className="font-medium text-foreground">Run Simulation</span> to see a
                  step-by-step trace of the workflow.
                </p>
              )}

              {isRunning && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" /> Simulating workflow...
                </div>
              )}

              {result && !result.success && (
                <div className="mb-3 rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
                  <p className="font-medium">Simulation failed</p>
                  <ul className="mt-1 list-inside list-disc space-y-0.5 text-xs">
                    {result.errors.map((e, i) => (
                      <li key={i}>{e}</li>
                    ))}
                  </ul>
                </div>
              )}

              {result && result.success && (
                <>
                  <div className="mb-3 flex items-center gap-2 rounded-md border border-emerald-500/20 bg-emerald-500/5 p-3 text-sm text-emerald-700 dark:text-emerald-400">
                    <CheckCircle2 className="h-4 w-4 shrink-0" />
                    Completed {result.steps.length} step{result.steps.length === 1 ? "" : "s"} in ~{(result.durationMs / 1000).toFixed(1)}s
                  </div>
                  <ol className="relative space-y-3 border-l border-border pl-5">
                    {result.steps.map((step, idx) => {
                      const entry = NODE_REGISTRY[step.nodeType as NodeType]
                      const Icon = entry.icon
                      return (
                        <li key={`${step.nodeId}-${idx}`} className="relative">
                          <span
                            className={cn(
                              "absolute -left-[30px] flex h-6 w-6 items-center justify-center rounded-full border-2 border-background",
                              entry.accentBg,
                            )}
                          >
                            <Icon className="h-3 w-3" />
                          </span>
                          <div className="rounded-md border bg-card p-3">
                            <div className="flex items-center justify-between gap-2">
                              <p className="truncate text-sm font-medium">
                                {step.nodeLabel}
                              </p>
                              <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                                {entry.label}
                              </span>
                            </div>
                            <p className="mt-1 text-xs text-muted-foreground">
                              {step.message}
                            </p>
                            <p className="mt-1 font-mono text-[10px] text-muted-foreground/70">
                              {new Date(step.timestamp).toLocaleTimeString()}
                            </p>
                          </div>
                        </li>
                      )
                    })}
                  </ol>
                </>
              )}
            </section>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  )
}
