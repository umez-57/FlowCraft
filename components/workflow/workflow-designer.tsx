"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { ReactFlowProvider } from "reactflow"
import type { Edge, Node } from "reactflow"
import { useWorkflowState } from "@/hooks/use-workflow-state"
import {
  useWorkflowRegistry,
  type WorkflowRegistry,
} from "@/hooks/use-workflow-registry"
import { NodeSidebar } from "./node-sidebar"
import { WorkflowCanvas } from "./workflow-canvas"
import { NodeFormPanel } from "./node-form-panel"
import { WorkflowTestPanel } from "./workflow-test-panel"
import { WorkflowToolbar } from "./workflow-toolbar"
import {
  WORKFLOW_TEMPLATES,
  type WorkflowTemplate,
} from "@/lib/workflow/templates"
import { validateWorkflow } from "@/lib/workflow/validator"
import type { AnyNodeData, NodeType } from "@/types/workflow"
import {
  ValidationProvider,
  type NodeIssuesMap,
} from "@/lib/workflow/validation-context"
import { toast } from "sonner"
import { Toaster } from "@/components/ui/sonner"
import { WelcomeTour } from "./welcome-tour"
import { AIAssistantPanel } from "./ai-assistant-panel"

/**
 * Outer shell — owns the workflow registry (the list of workflows +
 * which one is active). When the active workflow changes, the keyed
 * <ActiveWorkflow /> child fully remounts with fresh in-memory state.
 */
export function WorkflowDesigner() {
  const registry = useWorkflowRegistry()

  if (!registry.hydrated || !registry.active) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background text-sm text-muted-foreground">
        Loading workspace…
      </div>
    )
  }

  return (
    <ReactFlowProvider>
      <ActiveWorkflow key={registry.activeId} registry={registry} />
      <WelcomeTour />
      <Toaster position="bottom-right" richColors />
    </ReactFlowProvider>
  )
}

/**
 * Serialize the persistable shape of a workflow so we can cheaply detect
 * whether the registry needs to be updated. React Flow attaches width/
 * height/measured fields that shouldn't bump `updatedAt`.
 */
function serializeWorkflow(
  nodes: Node<AnyNodeData>[],
  edges: Edge[],
  nodeHistory: unknown,
) {
  return JSON.stringify({
    nodes: nodes.map((n) => ({
      id: n.id,
      type: n.type,
      position: n.position,
      data: n.data,
    })),
    edges: edges.map((e) => ({
      id: e.id,
      source: e.source,
      target: e.target,
      sourceHandle: e.sourceHandle ?? null,
      targetHandle: e.targetHandle ?? null,
    })),
    nodeHistory,
  })
}

function ActiveWorkflow({ registry }: { registry: WorkflowRegistry }) {
  const active = registry.active!
  const state = useWorkflowState({
    initialNodes: active.nodes,
    initialEdges: active.edges,
    initialNodeHistory: active.nodeHistory,
  })
  const [testOpen, setTestOpen] = useState(false)

  // Persist edits back to the registry. We compare a stripped
  // JSON-serialized form so React Flow's dimension/measurement changes
  // don't bump the workflow's updatedAt timestamp.
  const lastPersistedRef = useRef<string>(
    serializeWorkflow(active.nodes, active.edges, active.nodeHistory),
  )
  useEffect(() => {
    const next = serializeWorkflow(
      state.nodes,
      state.edges,
      state.nodeHistory,
    )
    if (next === lastPersistedRef.current) return
    lastPersistedRef.current = next
    registry.updateActive({
      nodes: state.nodes,
      edges: state.edges,
      nodeHistory: state.nodeHistory,
    })
    // registry.updateActive is stable (useCallback); excluding it avoids
    // an update loop when the registry object reference changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.nodes, state.edges, state.nodeHistory])

  // --- Canvas action handlers ------------------------------------------

  const handleClear = useCallback(() => {
    state.clear()
    toast.success("Canvas cleared")
  }, [state])

  const handleLoadTemplate = useCallback(
    (template: WorkflowTemplate) => {
      const { nodes, edges } = template.build()
      // Load the template INTO the current workflow (replacing its
      // contents) rather than spawning a new one. Rationale:
      //   - When a user hits "+ New workflow" and then picks a template
      //     they expect that workflow to become the template, not to end
      //     up with an empty duplicate sitting next to a fresh template.
      //   - loadWorkflow captures the prior state via commitHistory, so
      //     Ctrl+Z cleanly reverts an accidental template load.
      //   - If they want a copy, they can "Duplicate" from the switcher
      //     before loading, which is an explicit, predictable action.
      state.loadWorkflow(nodes, edges)

      // If the current workflow is still on its default name, adopt the
      // template's name. Users who've already renamed their workflow
      // keep their chosen name.
      if (active.name === "Untitled workflow") {
        registry.rename(active.id, template.name)
      }

      toast.success(`Loaded "${template.name}" template`)
    },
    [state, registry, active.id, active.name],
  )

  const handleExport = useCallback(() => {
    const wf = state.getWorkflow()
    const payload = { name: active.name, ...wf }
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `${active.name.replace(/\s+/g, "-").toLowerCase()}.json`
    link.click()
    URL.revokeObjectURL(url)
    toast.success("Workflow exported")
  }, [state, active.name])

  const handleImport = useCallback(
    async (file: File) => {
      try {
        const text = await file.text()
        const parsed = JSON.parse(text)
        if (
          !parsed ||
          !Array.isArray(parsed.nodes) ||
          !Array.isArray(parsed.edges)
        ) {
          throw new Error("Invalid workflow JSON")
        }
        const name: string =
          (typeof parsed.name === "string" && parsed.name.trim()) ||
          file.name.replace(/\.json$/i, "") ||
          "Imported workflow"
        registry.create(name, {
          nodes: parsed.nodes,
          edges: parsed.edges,
          nodeHistory: parsed.nodeHistory ?? {},
        })
        toast.success(`Imported "${name}"`)
      } catch (e) {
        toast.error(
          e instanceof Error ? e.message : "Failed to import workflow",
        )
      }
    },
    [registry],
  )

  const handleAIGenerate = useCallback(
    (wf: { nodes: Node<AnyNodeData>[]; edges: Edge[] }, name: string) => {
      // Load into the CURRENT workflow (same UX contract as templates)
      state.loadWorkflow(wf.nodes, wf.edges)
      // Auto-rename if still on the default name
      if (active.name === "Untitled workflow" && name.trim()) {
        registry.rename(active.id, name.trim())
      }
    },
    [state, registry, active.id, active.name],
  )

  const handleAutoLayout = useCallback(() => {
    if (state.nodes.length === 0) {
      toast.info("Nothing to lay out yet")
      return
    }
    state.autoLayout("TB")
    toast.success("Workflow auto-arranged")
  }, [state])

  // --- Workflow registry handlers (wired to the switcher) --------------

  const handleCreateWorkflow = useCallback(() => {
    registry.create("Untitled workflow")
    toast.success("New workflow created")
  }, [registry])

  const handleDuplicateWorkflow = useCallback(
    (id: string) => {
      registry.duplicate(id)
      toast.success("Workflow duplicated")
    },
    [registry],
  )

  const handleDeleteWorkflow = useCallback(
    (id: string) => {
      registry.remove(id)
      toast.success("Workflow deleted")
    },
    [registry],
  )

  // --- Keyboard shortcuts: Ctrl/Cmd+Z, Ctrl+Y, Ctrl+Shift+Z --------------
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Ignore when the user is typing into an input/textarea/contenteditable
      const target = e.target as HTMLElement | null
      if (target) {
        const tag = target.tagName
        if (
          tag === "INPUT" ||
          tag === "TEXTAREA" ||
          tag === "SELECT" ||
          target.isContentEditable
        ) {
          return
        }
      }

      const mod = e.ctrlKey || e.metaKey
      if (!mod) return

      const key = e.key.toLowerCase()
      if (key === "y" || (key === "z" && e.shiftKey)) {
        e.preventDefault()
        state.redo()
        return
      }
      if (key === "z") {
        e.preventDefault()
        state.undo()
      }
    }

    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [state])

  // --- Per-node validation issues (for visual badges on nodes) ----------
  const nodeIssues: NodeIssuesMap = useMemo(() => {
    const map: NodeIssuesMap = new Map()
    if (state.nodes.length === 0) return map
    const result = validateWorkflow({
      nodes: state.nodes.map((n) => ({
        id: n.id,
        type: n.type as NodeType,
        position: n.position,
        data: n.data,
      })),
      edges: state.edges.map((e) => ({
        id: e.id,
        source: e.source,
        target: e.target,
      })),
    })
    result.errors.forEach((issue) => {
      if (!issue.nodeId) return
      const arr = map.get(issue.nodeId)
      if (arr) arr.push(issue)
      else map.set(issue.nodeId, [issue])
    })
    return map
  }, [state.nodes, state.edges])

  return (
    <ValidationProvider value={nodeIssues}>
      <div className="flex h-screen w-screen flex-col overflow-hidden bg-background">
        <WorkflowToolbar
          workflows={registry.workflows}
          activeId={registry.activeId}
          onSelectWorkflow={registry.setActive}
          onCreateWorkflow={handleCreateWorkflow}
          onRenameWorkflow={registry.rename}
          onDuplicateWorkflow={handleDuplicateWorkflow}
          onDeleteWorkflow={handleDeleteWorkflow}
          onTest={() => setTestOpen(true)}
          onClear={handleClear}
          onExport={handleExport}
          onImport={handleImport}
          onLoadTemplate={handleLoadTemplate}
          onUndo={state.undo}
          onRedo={state.redo}
          canUndo={state.canUndo}
          canRedo={state.canRedo}
          onAutoLayout={handleAutoLayout}
        />
        <div className="flex min-h-0 flex-1">
          <NodeSidebar />
          <main className="relative min-w-0 flex-1">
            <WorkflowCanvas state={state} />
          </main>
          <NodeFormPanel
            node={state.selectedNode}
            onChange={state.updateNodeData}
            onDelete={state.deleteNode}
            onClose={() => state.selectNode(null)}
            versions={
              state.selectedNode
                ? state.nodeHistory[state.selectedNode.id] ?? []
                : []
            }
            onRestoreVersion={state.restoreNodeVersion}
            onClearHistory={state.clearNodeHistory}
          />
        </div>
      </div>
      <WorkflowTestPanel
        open={testOpen}
        onOpenChange={setTestOpen}
        getWorkflow={state.getWorkflow}
      />
      <AIAssistantPanel onWorkflowGenerated={handleAIGenerate} />
    </ValidationProvider>
  )
}

export { WORKFLOW_TEMPLATES }
