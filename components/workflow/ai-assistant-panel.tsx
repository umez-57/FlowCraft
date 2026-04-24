"use client"

import { useState } from "react"
import { Sparkles, Loader2, X, Wand2 } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import type { Node, Edge } from "reactflow"
import type { AnyNodeData, NodeType } from "@/types/workflow"
import type { AIWorkflow } from "@/lib/workflow/ai-schema"
import { NODE_REGISTRY } from "@/lib/workflow/node-registry"

interface AIAssistantPanelProps {
  /**
   * Called with the LLM-generated workflow so the parent designer can
   * load it into the active workflow. The parent is responsible for
   * whatever it wants to do with the `name` (e.g. renaming the workflow
   * if it's still untitled).
   */
  onWorkflowGenerated: (
    workflow: { nodes: Node<AnyNodeData>[]; edges: Edge[] },
    name: string,
  ) => void
}

const EXAMPLE_PROMPTS = [
  "Employee onboarding with document collection, IT account provisioning, and manager welcome",
  "Leave request approval with Slack notification",
  "Document verification flow with OCR scanning and HR sign-off",
  "Termination workflow with exit interview, access revocation, and final paperwork",
] as const

/**
 * Convert the AI's schema-shaped output into the shape React Flow
 * expects. The AI schema embeds the discriminant as `data.type` (for
 * Zod's discriminated union) but the Node<> shape uses a top-level
 * `type` — this function lifts it up and strips the duplicate field
 * from `data`.
 */
function aiWorkflowToReactFlow(ai: AIWorkflow): {
  nodes: Node<AnyNodeData>[]
  edges: Edge[]
} {
  const nodes: Node<AnyNodeData>[] = ai.nodes.map((n) => {
    const { type, ...rest } = n.data
    // Fill in any missing defaults from the node registry so the node
    // forms don't see `undefined` fields (e.g. task `customFields`).
    const registryDefaults = NODE_REGISTRY[type as NodeType].defaultData()
    const data = {
      ...registryDefaults,
      ...rest,
      label: registryDefaults.label, // always use registry label
    }
    return {
      id: n.id,
      type,
      position: n.position,
      data: data as AnyNodeData,
    }
  })

  const edges: Edge[] = ai.edges.map((e) => ({
    id: e.id,
    source: e.source,
    target: e.target,
  }))

  return { nodes, edges }
}

export function AIAssistantPanel({
  onWorkflowGenerated,
}: AIAssistantPanelProps) {
  const [open, setOpen] = useState(false)
  const [prompt, setPrompt] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)

  const handleGenerate = async () => {
    const trimmed = prompt.trim()
    if (!trimmed) {
      toast.error("Describe the workflow you want to generate")
      return
    }

    setIsGenerating(true)
    try {
      const res = await fetch("/api/ai/generate-workflow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: trimmed }),
      })

      if (!res.ok) {
        const errPayload = await res.json().catch(() => ({}))
        throw new Error(
          errPayload.error ||
            `Generation failed (${res.status}). Please try again.`,
        )
      }

      const ai = (await res.json()) as AIWorkflow
      const { nodes, edges } = aiWorkflowToReactFlow(ai)

      onWorkflowGenerated({ nodes, edges }, ai.name)
      toast.success(`Generated "${ai.name}"`, {
        description: `${nodes.length} nodes · ${edges.length} connections`,
      })
      setOpen(false)
      setPrompt("")
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to generate workflow",
      )
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <>
      {/* Floating trigger — bottom-right, clear of React Flow controls */}
      <Button
        onClick={() => setOpen(true)}
        size="lg"
        className="fixed bottom-6 right-6 z-40 gap-2 rounded-full shadow-lg hover:shadow-xl transition-shadow"
      >
        <Sparkles className="h-4 w-4" />
        <span className="font-medium">AI Assistant</span>
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              Generate workflow with AI
            </DialogTitle>
            <DialogDescription>
              Describe your workflow in plain English. The AI will build a
              complete graph you can edit afterwards.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div>
              <label
                htmlFor="ai-prompt"
                className="mb-2 block text-sm font-medium"
              >
                What workflow do you need?
              </label>
              <Textarea
                id="ai-prompt"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="e.g. An employee onboarding flow with document collection, manager approval, and automated welcome email…"
                rows={4}
                disabled={isGenerating}
                className="resize-none"
                maxLength={2000}
              />
              <p className="mt-1 text-[11px] text-muted-foreground">
                {prompt.length}/2000 characters
              </p>
            </div>

            <div>
              <p className="mb-2 text-xs font-medium text-muted-foreground">
                Or try an example:
              </p>
              <div className="flex flex-col gap-1.5">
                {EXAMPLE_PROMPTS.map((ex) => (
                  <button
                    key={ex}
                    type="button"
                    onClick={() => setPrompt(ex)}
                    disabled={isGenerating}
                    className="group rounded-md border border-border bg-card px-3 py-2 text-left text-xs text-muted-foreground hover:border-primary/50 hover:bg-muted/50 hover:text-foreground transition-colors disabled:opacity-50"
                  >
                    <span className="line-clamp-2">{ex}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={isGenerating}
              >
                <X className="h-4 w-4" />
                Cancel
              </Button>
              <Button onClick={handleGenerate} disabled={isGenerating}>
                {isGenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Generating…
                  </>
                ) : (
                  <>
                    <Wand2 className="h-4 w-4" />
                    Generate workflow
                  </>
                )}
              </Button>
            </div>

            <p className="text-[11px] leading-relaxed text-muted-foreground">
              Note: this will replace the contents of the current workflow.
              Press <kbd className="rounded bg-muted px-1 font-mono">Ctrl+Z</kbd>{" "}
              to undo if you don&apos;t like the result.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
