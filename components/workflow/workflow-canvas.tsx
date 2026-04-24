"use client"

import { type DragEvent, useCallback, useMemo, useRef } from "react"
import ReactFlow, {
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  SelectionMode,
  type Edge,
  type Node,
  type ReactFlowInstance,
  type OnSelectionChangeParams,
} from "reactflow"
import "reactflow/dist/style.css"
import type { AnyNodeData, NodeType } from "@/types/workflow"
import type { WorkflowState } from "@/hooks/use-workflow-state"
import { CustomNode } from "./nodes/custom-node"
import { NODE_REGISTRY } from "@/lib/workflow/node-registry"

interface WorkflowCanvasProps {
  state: WorkflowState
}

// Declare outside the component so the object identity never changes
// (passing a new nodeTypes object on every render triggers a React Flow warning
// and a re-sync cascade).
const NODE_TYPES = {
  start: CustomNode,
  task: CustomNode,
  approval: CustomNode,
  automatedStep: CustomNode,
  end: CustomNode,
}

const FIT_VIEW_OPTIONS = { padding: 0.3 }
const DELETE_KEYS = ["Backspace", "Delete"]
const PRO_OPTIONS = { hideAttribution: true }
// Interaction model (matches Figma / Miro / n8n, with right-click pan as a forgiving fallback):
//  - Left-click + drag on empty canvas => box selection
//  - Middle-mouse drag                  => pan
//  - Right-click + drag                 => pan (fallback for users who miss the Space shortcut)
//  - Space + drag                       => temporarily pan (handled via panActivationKeyCode)
//  - Scroll wheel                       => pan
//  - Ctrl / Cmd / Shift + click         => add to selection
const PAN_ON_DRAG = [1, 2]
const MULTI_SELECTION_KEYS = ["Meta", "Control", "Shift"]
const PAN_ACTIVATION_KEY = "Space"

const NODE_COLOR: Record<NodeType, string> = {
  start: "#10b981",
  task: "#3b82f6",
  approval: "#f59e0b",
  automatedStep: "#8b5cf6",
  end: "#f43f5e",
}
// Alias kept for minimap (same palette).
const MINIMAP_COLOR = NODE_COLOR

export function WorkflowCanvas({ state }: WorkflowCanvasProps) {
  const wrapper = useRef<HTMLDivElement>(null)
  const instance = useRef<ReactFlowInstance | null>(null)

  const { selectNode, addNode } = state

  const onDragOver = useCallback((event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    event.dataTransfer.dropEffect = "move"
  }, [])

  const onDrop = useCallback(
    (event: DragEvent<HTMLDivElement>) => {
      event.preventDefault()
      const type = event.dataTransfer.getData("application/reactflow") as NodeType
      if (!type || !NODE_REGISTRY[type] || !wrapper.current || !instance.current) return

      const bounds = wrapper.current.getBoundingClientRect()
      const position = instance.current.screenToFlowPosition({
        x: event.clientX - bounds.left,
        y: event.clientY - bounds.top,
      })
      addNode(type, position)
    },
    [addNode],
  )

  // Single source of truth for selection state — React Flow fires this
  // whenever internal selection changes (pane click clears it).
  const onSelectionChange = useCallback(
    (params: OnSelectionChangeParams) => {
      const first = params.nodes[0]
      selectNode(first ? first.id : null)
    },
    [selectNode],
  )

  const onInit = useCallback((i: ReactFlowInstance) => {
    instance.current = i
  }, [])

  const nodeColor = useCallback((n: Node) => {
    const type = (n.type ?? "task") as NodeType
    return MINIMAP_COLOR[type]
  }, [])

  // Memoize casts so React Flow sees stable array identity when nothing changes.
  const rfNodes = useMemo(() => state.nodes as Node[], [state.nodes])

  // Tint each edge with the color of its SOURCE node's type. Keeps the
  // canvas legible at a glance (start-edges green, approval-edges amber,
  // etc.) without forcing the user to configure anything. This is a pure
  // render-time transform — underlying edge state is untouched, so
  // onEdgesChange and other React Flow handlers keep working normally.
  const rfEdges = useMemo<Edge[]>(() => {
    const byId = new Map<string, Node<AnyNodeData>>()
    state.nodes.forEach((n) => byId.set(n.id, n))
    return state.edges.map((e) => {
      const source = byId.get(e.source)
      const type = (source?.type ?? "task") as NodeType
      const color = NODE_COLOR[type]
      return {
        ...e,
        style: {
          ...(e.style ?? {}),
          stroke: color,
          strokeWidth: 2,
        },
      }
    })
  }, [state.edges, state.nodes])

  return (
    <div
      ref={wrapper}
      className="relative h-full w-full"
      onDragOver={onDragOver}
      onDrop={onDrop}
      onContextMenu={(e) => e.preventDefault()}
    >
      <ReactFlow
        nodes={rfNodes}
        edges={rfEdges}
        onNodesChange={state.onNodesChange}
        onEdgesChange={state.onEdgesChange}
        onConnect={state.onConnect}
        onNodeDragStart={state.onNodeDragStart}
        onSelectionChange={onSelectionChange}
        onInit={onInit}
        nodeTypes={NODE_TYPES}
        fitView
        fitViewOptions={FIT_VIEW_OPTIONS}
        deleteKeyCode={DELETE_KEYS}
        proOptions={PRO_OPTIONS}
        selectionOnDrag
        selectionMode={SelectionMode.Partial}
        panOnDrag={PAN_ON_DRAG}
        panOnScroll
        panActivationKeyCode={PAN_ACTIVATION_KEY}
        multiSelectionKeyCode={MULTI_SELECTION_KEYS}
      >
        <Background variant={BackgroundVariant.Dots} gap={20} size={1} />
        <Controls className="!shadow-sm" />
        <MiniMap
          pannable
          zoomable
          className="!rounded-md !border !border-border !bg-card"
          nodeStrokeWidth={2}
          nodeColor={nodeColor}
        />
      </ReactFlow>
    </div>
  )
}
