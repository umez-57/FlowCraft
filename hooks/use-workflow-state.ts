"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import {
  addEdge as rfAddEdge,
  applyEdgeChanges,
  applyNodeChanges,
  type Connection,
  type Edge,
  type EdgeChange,
  type Node,
  type NodeChange,
} from "reactflow"
import type {
  AnyNodeData,
  NodeHistoryMap,
  NodeType,
  NodeVersion,
  Workflow,
} from "@/types/workflow"
import { NODE_REGISTRY } from "@/lib/workflow/node-registry"
import { autoLayoutGraph, type LayoutDirection } from "@/lib/workflow/auto-layout"

export interface WorkflowState {
  nodes: Node<AnyNodeData>[]
  edges: Edge[]
  selectedNodeId: string | null
  onNodesChange: (changes: NodeChange[]) => void
  onEdgesChange: (changes: EdgeChange[]) => void
  onConnect: (connection: Connection) => void
  onNodeDragStart: () => void
  selectNode: (id: string | null) => void
  addNode: (type: NodeType, position: { x: number; y: number }) => void
  updateNodeData: (id: string, data: Partial<AnyNodeData>) => void
  deleteNode: (id: string) => void
  clear: () => void
  loadWorkflow: (nodes: Node<AnyNodeData>[], edges: Edge[]) => void
  getWorkflow: () => Workflow
  selectedNode: Node<AnyNodeData> | null
  undo: () => void
  redo: () => void
  canUndo: boolean
  canRedo: boolean
  autoLayout: (direction?: LayoutDirection) => void
  // --- Per-node version history ---
  nodeHistory: NodeHistoryMap
  restoreNodeVersion: (nodeId: string, timestamp: number) => void
  clearNodeHistory: (nodeId: string) => void
}

interface Snapshot {
  nodes: Node<AnyNodeData>[]
  edges: Edge[]
}

const MAX_HISTORY = 50
const MAX_VERSIONS_PER_NODE = 25
// If two consecutive edits to the same set of fields happen within this
// window, merge them into a single version entry. Prevents one-version-
// per-keystroke spam while keeping semantic edits distinct.
const HISTORY_DEBOUNCE_MS = 1500

export interface UseWorkflowStateOptions {
  /**
   * Seed nodes/edges/nodeHistory when the hook mounts. Used by the
   * multi-workflow registry to swap state when the user switches
   * workflows (combined with a `key` prop on the owning component to
   * force a full remount, so we only read initial values once).
   */
  initialNodes?: Node<AnyNodeData>[]
  initialEdges?: Edge[]
  initialNodeHistory?: NodeHistoryMap
}

const nextId = (type: NodeType, counter: number) => `${type}-${Date.now()}-${counter}`

/** Shallow-compare two values; arrays/objects compared via JSON. */
const valuesEqual = (a: unknown, b: unknown) => {
  if (a === b) return true
  if (typeof a !== typeof b) return false
  if (typeof a === "object") return JSON.stringify(a) === JSON.stringify(b)
  return false
}

const diffChangedFields = (
  oldData: AnyNodeData,
  patch: Partial<AnyNodeData>,
): string[] => {
  const keys = Object.keys(patch)
  return keys.filter((k) => !valuesEqual((oldData as Record<string, unknown>)[k], (patch as Record<string, unknown>)[k]))
}

const sameFieldSet = (a: string[], b: string[]) => {
  if (a.length !== b.length) return false
  const set = new Set(a)
  return b.every((f) => set.has(f))
}

export function useWorkflowState(
  options: UseWorkflowStateOptions = {},
): WorkflowState {
  // Lazy initializers — these run exactly once on mount. To reload with
  // different seed values, remount this hook (via a `key` prop on the
  // parent component).
  const [nodes, setNodes] = useState<Node<AnyNodeData>[]>(
    () => options.initialNodes ?? [],
  )
  const [edges, setEdges] = useState<Edge[]>(() => options.initialEdges ?? [])
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)
  const [past, setPast] = useState<Snapshot[]>([])
  const [future, setFuture] = useState<Snapshot[]>([])
  const [nodeHistory, setNodeHistory] = useState<NodeHistoryMap>(
    () => options.initialNodeHistory ?? {},
  )
  const idCounter = useRef(0)

  // Refs mirror state so callbacks can read current values synchronously
  // without adding them to dependency arrays.
  const nodesRef = useRef(nodes)
  const edgesRef = useRef(edges)
  const nodeHistoryRef = useRef(nodeHistory)
  useEffect(() => {
    nodesRef.current = nodes
  }, [nodes])
  useEffect(() => {
    edgesRef.current = edges
  }, [edges])
  useEffect(() => {
    nodeHistoryRef.current = nodeHistory
  }, [nodeHistory])

  // --- Session undo/redo (whole-workflow) ------------------------------
  //
  // NOTE: persistence of nodes/edges/nodeHistory is handled one layer up
  // by the workflow registry (see `useWorkflowRegistry`). This hook is
  // purely in-memory session state.

  const commitHistory = useCallback(() => {
    setPast((p) => {
      const snap: Snapshot = { nodes: nodesRef.current, edges: edgesRef.current }
      const next = [...p, snap]
      return next.length > MAX_HISTORY ? next.slice(next.length - MAX_HISTORY) : next
    })
    setFuture([])
  }, [])

  const undo = useCallback(() => {
    setPast((p) => {
      if (p.length === 0) return p
      const snap = p[p.length - 1]
      setFuture((f) => [
        ...f,
        { nodes: nodesRef.current, edges: edgesRef.current },
      ])
      setNodes(snap.nodes)
      setEdges(snap.edges)
      setSelectedNodeId(null)
      return p.slice(0, -1)
    })
  }, [])

  const redo = useCallback(() => {
    setFuture((f) => {
      if (f.length === 0) return f
      const snap = f[f.length - 1]
      setPast((p) => [
        ...p,
        { nodes: nodesRef.current, edges: edgesRef.current },
      ])
      setNodes(snap.nodes)
      setEdges(snap.edges)
      setSelectedNodeId(null)
      return f.slice(0, -1)
    })
  }, [])

  // --- Per-node version history helpers --------------------------------

  const pushNodeVersion = useCallback(
    (nodeId: string, version: NodeVersion) => {
      setNodeHistory((h) => {
        const existing = h[nodeId] ?? []
        const last = existing[existing.length - 1]

        // Debounce: merge edits to the same fields within HISTORY_DEBOUNCE_MS
        // so typing into a title field doesn't create 20 versions.
        if (
          last &&
          version.timestamp - last.timestamp < HISTORY_DEBOUNCE_MS &&
          sameFieldSet(last.changedFields, version.changedFields)
        ) {
          // Keep the older snapshot (which is further back in time) but
          // bump the timestamp so continued edits keep merging.
          const merged: NodeVersion = { ...last, timestamp: version.timestamp }
          return { ...h, [nodeId]: [...existing.slice(0, -1), merged] }
        }

        const next = [...existing, version]
        const capped =
          next.length > MAX_VERSIONS_PER_NODE
            ? next.slice(next.length - MAX_VERSIONS_PER_NODE)
            : next
        return { ...h, [nodeId]: capped }
      })
    },
    [],
  )

  const restoreNodeVersion = useCallback(
    (nodeId: string, timestamp: number) => {
      const versions = nodeHistoryRef.current[nodeId] ?? []
      const target = versions.find((v) => v.timestamp === timestamp)
      if (!target) return

      const current = nodesRef.current.find((n) => n.id === nodeId)
      if (!current) return

      // No-op: clicking Restore on a version that equals the current state
      // (e.g. the "Restored from history" entry we just added, or an entry
      // whose data matches right now) would produce no visible change.
      if (valuesEqual(current.data, target.data)) return

      // Snapshot the current (pre-restore) data so the restore itself is
      // reversible — BUT only if that state isn't already the most recent
      // entry in history. Otherwise we'd create a duplicate "Restored from
      // history" entry every time the user bounces between two versions.
      const last = versions[versions.length - 1]
      const alreadyCapturedAsLatest = last && valuesEqual(last.data, current.data)
      if (!alreadyCapturedAsLatest) {
        pushNodeVersion(nodeId, {
          timestamp: Date.now(),
          data: current.data as AnyNodeData,
          changedFields: ["__restore__"],
        })
      }

      commitHistory() // session-level undo/redo
      setNodes((ns) =>
        ns.map((n) => (n.id === nodeId ? { ...n, data: target.data } : n)),
      )
    },
    [commitHistory, pushNodeVersion],
  )

  const clearNodeHistory = useCallback((nodeId: string) => {
    setNodeHistory((h) => {
      if (!(nodeId in h)) return h
      const { [nodeId]: _dropped, ...rest } = h
      return rest
    })
  }, [])

  // --- React Flow change handlers --------------------------------------

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => {
      const structural = changes.some((c) => c.type === "remove")
      if (structural) commitHistory()

      setNodes((ns) => applyNodeChanges(changes, ns) as Node<AnyNodeData>[])
      for (const change of changes) {
        if (change.type === "remove") {
          setSelectedNodeId((prev) => (prev === change.id ? null : prev))
          // Drop history for removed nodes so localStorage doesn't grow forever.
          clearNodeHistory(change.id)
        }
      }
    },
    [commitHistory, clearNodeHistory],
  )

  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      const structural = changes.some((c) => c.type === "remove")
      if (structural) commitHistory()
      setEdges((es) => applyEdgeChanges(changes, es))
    },
    [commitHistory],
  )

  const onConnect = useCallback(
    (connection: Connection) => {
      commitHistory()
      setEdges((es) =>
        rfAddEdge(
          {
            ...connection,
            id: `e-${connection.source}-${connection.target}-${Date.now()}`,
            animated: true,
          },
          es,
        ),
      )
    },
    [commitHistory],
  )

  const onNodeDragStart = useCallback(() => {
    commitHistory()
  }, [commitHistory])

  const selectNode = useCallback((id: string | null) => {
    setSelectedNodeId(id)
  }, [])

  // --- Mutations -------------------------------------------------------

  const addNode = useCallback(
    (type: NodeType, position: { x: number; y: number }) => {
      commitHistory()
      const entry = NODE_REGISTRY[type]
      idCounter.current += 1
      const id = nextId(type, idCounter.current)
      const newNode: Node<AnyNodeData> = {
        id,
        type,
        position,
        data: entry.defaultData(),
      }
      setNodes((ns) => [...ns, newNode])
    },
    [commitHistory],
  )

  const updateNodeData = useCallback(
    (id: string, data: Partial<AnyNodeData>) => {
      commitHistory()

      // Record per-node version history BEFORE applying the patch so the
      // snapshot captures the pre-change state.
      const prev = nodesRef.current.find((n) => n.id === id)
      if (prev) {
        const oldData = prev.data as AnyNodeData
        const changedFields = diffChangedFields(oldData, data)
        if (changedFields.length > 0) {
          pushNodeVersion(id, {
            timestamp: Date.now(),
            data: oldData,
            changedFields,
          })
        }
      }

      setNodes((ns) =>
        ns.map((n) =>
          n.id === id ? { ...n, data: { ...n.data, ...data } as AnyNodeData } : n,
        ),
      )
    },
    [commitHistory, pushNodeVersion],
  )

  const deleteNode = useCallback(
    (id: string) => {
      commitHistory()
      setNodes((ns) => ns.filter((n) => n.id !== id))
      setEdges((es) => es.filter((e) => e.source !== id && e.target !== id))
      setSelectedNodeId((prev) => (prev === id ? null : prev))
      clearNodeHistory(id)
    },
    [commitHistory, clearNodeHistory],
  )

  const clear = useCallback(() => {
    commitHistory()
    setNodes([])
    setEdges([])
    setSelectedNodeId(null)
    // Intentionally do NOT clear nodeHistory — if the user restores a
    // template with the same node ids, their history is preserved.
  }, [commitHistory])

  const loadWorkflow = useCallback(
    (newNodes: Node<AnyNodeData>[], newEdges: Edge[]) => {
      commitHistory()
      setNodes(newNodes)
      setEdges(newEdges)
      setSelectedNodeId(null)
    },
    [commitHistory],
  )

  const autoLayout = useCallback(
    (direction: LayoutDirection = "TB") => {
      if (nodesRef.current.length === 0) return
      commitHistory()
      const laid = autoLayoutGraph(nodesRef.current, edgesRef.current, direction)
      setNodes(laid.nodes)
      setEdges(laid.edges)
    },
    [commitHistory],
  )

  const getWorkflow = useCallback<() => Workflow>(() => {
    return {
      nodes: nodes.map((n) => ({
        id: n.id,
        type: n.type as NodeType,
        position: n.position,
        data: n.data,
      })),
      edges: edges.map((e) => ({
        id: e.id,
        source: e.source,
        target: e.target,
      })),
    }
  }, [nodes, edges])

  const selectedNode = useMemo(
    () => nodes.find((n) => n.id === selectedNodeId) ?? null,
    [nodes, selectedNodeId],
  )

  return {
    nodes,
    edges,
    selectedNodeId,
    onNodesChange,
    onEdgesChange,
    onConnect,
    onNodeDragStart,
    selectNode,
    addNode,
    updateNodeData,
    deleteNode,
    clear,
    loadWorkflow,
    getWorkflow,
    selectedNode,
    undo,
    redo,
    canUndo: past.length > 0,
    canRedo: future.length > 0,
    autoLayout,
    nodeHistory,
    restoreNodeVersion,
    clearNodeHistory,
  }
}
