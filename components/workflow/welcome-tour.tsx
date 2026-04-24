"use client"

import { useEffect, useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import {
  ArrowRight,
  CheckCircle2,
  FileCode2,
  Keyboard,
  MousePointer2,
  Sparkles,
  Wand2,
} from "lucide-react"
import { NODE_REGISTRY, NODE_TYPE_ORDER } from "@/lib/workflow/node-registry"

const STORAGE_KEY = "flowcraft:welcome-seen"

/**
 * Flowcraft brand mark — replicated locally so the tour can stand on
 * its own without importing from the toolbar.
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

/* ---------- Step content ---------------------------------------------- */

function StepWelcome() {
  return (
    <div className="space-y-5 py-2">
      <div className="flex items-center justify-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-md">
          <FlowcraftMark className="h-9 w-9" />
        </div>
      </div>

      <div className="space-y-1.5 text-center">
        <h3 className="text-xl font-semibold tracking-tight">
          Welcome to Flowcraft
        </h3>
        <p className="text-sm text-muted-foreground">
          A visual workflow designer for HR teams. Draft, validate, and
          simulate processes end-to-end — no code required.
        </p>
      </div>

      <ul className="grid grid-cols-2 gap-2 text-xs">
        <FeatureRow>AI natural-language builder</FeatureRow>
        <FeatureRow>Drag-and-drop canvas</FeatureRow>
        <FeatureRow>Multi-workflow manager</FeatureRow>
        <FeatureRow>Real-time validation</FeatureRow>
        <FeatureRow>One-click simulation</FeatureRow>
        <FeatureRow>Undo, redo & version history</FeatureRow>
      </ul>
    </div>
  )
}

function StepAIAssistant() {
  return (
    <div className="space-y-4 py-2">
      <div className="flex items-center gap-2.5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary/70 text-primary-foreground shadow-sm">
          <Wand2 className="h-4 w-4" />
        </div>
        <div>
          <h3 className="text-base font-semibold leading-tight">
            AI Assistant — describe, don&apos;t draw
          </h3>
          <p className="text-xs text-muted-foreground">
            Our hero feature. Type what you need, get a working flow.
          </p>
        </div>
      </div>

      <div className="rounded-lg border bg-gradient-to-br from-primary/5 to-transparent p-3.5">
        <p className="mb-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
          How it works
        </p>
        <ol className="space-y-2 text-xs">
          <li className="flex gap-2">
            <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-primary/15 text-[10px] font-semibold text-primary">
              1
            </span>
            <span className="text-foreground">
              Click the floating{" "}
              <span className="inline-flex items-center gap-1 rounded border bg-card px-1.5 py-0.5 font-medium">
                <Wand2 className="h-2.5 w-2.5" /> AI Assistant
              </span>{" "}
              button at the bottom right
            </span>
          </li>
          <li className="flex gap-2">
            <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-primary/15 text-[10px] font-semibold text-primary">
              2
            </span>
            <span className="text-foreground">
              Describe the process in plain English — e.g.{" "}
              <em className="text-muted-foreground">
                &quot;Onboarding with document collection, manager
                approval, and welcome email&quot;
              </em>
            </span>
          </li>
          <li className="flex gap-2">
            <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-primary/15 text-[10px] font-semibold text-primary">
              3
            </span>
            <span className="text-foreground">
              GPT-4o-mini generates a valid, fully-configured graph and
              drops it straight onto your canvas
            </span>
          </li>
        </ol>
      </div>

      <div className="rounded-md border bg-amber-50/50 px-3 py-2 text-[11px] text-amber-900 dark:bg-amber-950/30 dark:text-amber-200">
        <span className="font-medium">Setup:</span> requires an{" "}
        <code className="rounded bg-amber-100 px-1 py-0.5 font-mono text-[10px] dark:bg-amber-900/40">
          OPENAI_API_KEY
        </code>{" "}
        environment variable. See the README for one-step instructions.
      </div>
    </div>
  )
}

function FeatureRow({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-1.5 rounded-md border bg-muted/30 px-2.5 py-2">
      <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" />
      <span className="leading-snug text-foreground">{children}</span>
    </li>
  )
}

function StepNodes() {
  return (
    <div className="space-y-4 py-2">
      <div className="flex items-center gap-2.5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted text-foreground">
          <FileCode2 className="h-4 w-4" />
        </div>
        <div>
          <h3 className="text-base font-semibold leading-tight">
            Five building blocks
          </h3>
          <p className="text-xs text-muted-foreground">
            Drag any of these onto the canvas to compose a flow
          </p>
        </div>
      </div>

      <ul className="space-y-2">
        {NODE_TYPE_ORDER.map((type) => {
          const reg = NODE_REGISTRY[type]
          const Icon = reg.icon
          return (
            <li
              key={type}
              className="flex items-center gap-3 rounded-md border bg-card px-3 py-2"
            >
              <span
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-md",
                  reg.color,
                )}
              >
                <Icon className="h-4 w-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium leading-tight">
                  {reg.label}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {reg.description}
                </p>
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

function StepCanvas() {
  const gestures: Array<{ title: string; detail: string }> = [
    {
      title: "Left-drag empty space",
      detail: "Draws a marquee to box-select multiple nodes at once",
    },
    {
      title: "Space + drag, or right-click drag",
      detail: "Pans the canvas — keeps your hand tool within easy reach",
    },
    {
      title: "Scroll wheel",
      detail: "Pans vertically; pinch or Ctrl+scroll to zoom in and out",
    },
    {
      title: "Drag between node handles",
      detail: "Creates an edge — every node exposes four connection points",
    },
    {
      title: "Shift / Ctrl + click",
      detail: "Extends the current selection to include another node",
    },
  ]

  return (
    <div className="space-y-4 py-2">
      <div className="flex items-center gap-2.5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted text-foreground">
          <MousePointer2 className="h-4 w-4" />
        </div>
        <div>
          <h3 className="text-base font-semibold leading-tight">
            Working with the canvas
          </h3>
          <p className="text-xs text-muted-foreground">
            The same gestures you know from Figma, Miro, and n8n
          </p>
        </div>
      </div>

      <ul className="space-y-2">
        {gestures.map((g) => (
          <li
            key={g.title}
            className="rounded-md border bg-muted/30 px-3 py-2"
          >
            <p className="text-sm font-medium">{g.title}</p>
            <p className="text-xs text-muted-foreground">{g.detail}</p>
          </li>
        ))}
      </ul>
    </div>
  )
}

function StepShortcuts() {
  const shortcuts: Array<{ keys: string[]; label: string }> = [
    { keys: ["Ctrl", "Z"], label: "Undo" },
    { keys: ["Ctrl", "Y"], label: "Redo" },
    { keys: ["Ctrl", "Shift", "Z"], label: "Redo (alternate)" },
    { keys: ["Delete"], label: "Remove selected nodes or edges" },
    { keys: ["Space", "+ drag"], label: "Temporarily pan the canvas" },
  ]

  return (
    <div className="space-y-4 py-2">
      <div className="flex items-center gap-2.5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted text-foreground">
          <Keyboard className="h-4 w-4" />
        </div>
        <div>
          <h3 className="text-base font-semibold leading-tight">
            Keyboard shortcuts
          </h3>
          <p className="text-xs text-muted-foreground">
            Move faster once you're familiar with the basics
          </p>
        </div>
      </div>

      <ul className="space-y-1.5">
        {shortcuts.map((s) => (
          <li
            key={s.label}
            className="flex items-center justify-between rounded-md border bg-card px-3 py-2"
          >
            <span className="text-sm">{s.label}</span>
            <span className="flex items-center gap-1">
              {s.keys.map((k) => (
                <kbd
                  key={k}
                  className="inline-flex min-w-[1.75rem] items-center justify-center rounded border bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground"
                >
                  {k}
                </kbd>
              ))}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}

function StepGetStarted() {
  return (
    <div className="space-y-5 py-4 text-center">
      <div className="flex items-center justify-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600">
          <Sparkles className="h-7 w-7" />
        </div>
      </div>

      <div className="space-y-1.5">
        <h3 className="text-xl font-semibold tracking-tight">
          You&apos;re all set
        </h3>
        <p className="text-sm text-muted-foreground">
          Start from a blank canvas, or pick a template from the toolbar
          to see a real HR flow in action.
        </p>
      </div>

      <div className="grid gap-2 rounded-lg border bg-muted/30 p-3 text-left text-xs">
        <p className="font-medium text-foreground">
          Included templates
        </p>
        <p className="text-muted-foreground">
          Employee Onboarding · Leave Approval · Document Verification
        </p>
      </div>

      <p className="text-[11px] text-muted-foreground">
        Tips and shortcuts are always available from the sidebar if you
        need a refresher.
      </p>
    </div>
  )
}

/* ---------- Tour shell ------------------------------------------------ */

const STEPS = [
  { id: "welcome", render: StepWelcome },
  { id: "ai", render: StepAIAssistant },
  { id: "nodes", render: StepNodes },
  { id: "canvas", render: StepCanvas },
  { id: "shortcuts", render: StepShortcuts },
  { id: "ready", render: StepGetStarted },
] as const

type TourOpenSource = "auto" | "manual"

export function WelcomeTour({
  forceOpen,
  onClose,
}: {
  /** Imperatively open the tour (e.g. from a "Show tutorial" menu item). */
  forceOpen?: boolean
  onClose?: () => void
}) {
  const [open, setOpen] = useState(false)
  const [source, setSource] = useState<TourOpenSource>("auto")
  const [step, setStep] = useState(0)

  // Auto-open for first-time visitors only. Deferred to useEffect so it
  // doesn't block initial render and only runs on the client.
  useEffect(() => {
    if (typeof window === "undefined") return
    const seen = localStorage.getItem(STORAGE_KEY)
    if (!seen) {
      setSource("auto")
      setStep(0)
      setOpen(true)
    }
  }, [])

  // React to imperative opens.
  useEffect(() => {
    if (forceOpen) {
      setSource("manual")
      setStep(0)
      setOpen(true)
    }
  }, [forceOpen])

  const markSeen = () => {
    try {
      localStorage.setItem(STORAGE_KEY, "true")
    } catch {
      // Quota / private mode — safe to ignore, worst case the tour
      // shows once more next visit.
    }
  }

  const handleOpenChange = (next: boolean) => {
    setOpen(next)
    if (!next) {
      // Only persist "seen" when the tour auto-opened on first visit.
      // Manually re-opening shouldn't change anything.
      if (source === "auto") markSeen()
      onClose?.()
    }
  }

  const isLast = step === STEPS.length - 1
  const CurrentStep = STEPS[step].render

  const next = () => {
    if (isLast) {
      markSeen()
      setOpen(false)
      onClose?.()
      return
    }
    setStep((s) => Math.min(s + 1, STEPS.length - 1))
  }

  const back = () => setStep((s) => Math.max(s - 1, 0))

  const skip = () => {
    if (source === "auto") markSeen()
    setOpen(false)
    onClose?.()
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[90vh] gap-0 overflow-hidden p-0 sm:max-w-md">
        <div className="max-h-[70vh] overflow-y-auto px-6 pt-6">
          <DialogHeader className="sr-only">
            <DialogTitle>Welcome to Flowcraft</DialogTitle>
            <DialogDescription>
              A quick tour of the workflow designer and its features
            </DialogDescription>
          </DialogHeader>

          <CurrentStep />
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 border-t bg-muted/30 px-6 py-3">
          {/* Step dots */}
          <div
            className="flex items-center gap-1.5"
            role="tablist"
            aria-label="Tour progress"
          >
            {STEPS.map((s, i) => (
              <button
                key={s.id}
                type="button"
                role="tab"
                aria-selected={i === step}
                aria-label={`Go to step ${i + 1}`}
                onClick={() => setStep(i)}
                className={cn(
                  "h-1.5 rounded-full transition-all",
                  i === step
                    ? "w-5 bg-primary"
                    : i < step
                      ? "w-1.5 bg-primary/60"
                      : "w-1.5 bg-border hover:bg-muted-foreground/40",
                )}
              />
            ))}
          </div>

          <div className="flex items-center gap-2">
            {!isLast && (
              <Button
                variant="ghost"
                size="sm"
                onClick={skip}
                className="text-xs"
              >
                Skip tour
              </Button>
            )}
            {step > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={back}
                className="text-xs"
              >
                Back
              </Button>
            )}
            <Button size="sm" onClick={next} className="gap-1.5 text-xs">
              {isLast ? "Get started" : "Next"}
              {!isLast && <ArrowRight className="h-3.5 w-3.5" />}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
