"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import type { Edge, Node } from "reactflow"
import type { AnyNodeData, NodeHistoryMap } from "@/types/workflow"
import {
  createEmptyWorkflow,
  genId,
  loadRegistry,
  saveRegistry,
  type RegistryState,
  type WorkflowRecord,
} from "@/lib/workflow/workflow-store"

type InitialContent = {
  nodes: Node<AnyNodeData>[]
  edges: Edge[]
  nodeHistory?: NodeHistoryMap
}

export interface WorkflowRegistry {
  hydrated: boolean
  workflows: WorkflowRecord[]
  activeId: string
  active: WorkflowRecord | null
  setActive: (id: string) => void
  create: (name?: string, initial?: InitialContent) => string
  rename: (id: string, name: string) => void
  duplicate: (id: string) => void
  remove: (id: string) => void
  /**
   * Patch fields on the currently-active workflow. Called by the designer
   * as the user edits. Bumps `updatedAt` so the switcher can show "edited
   * 2m ago".
   */
  updateActive: (patch: {
    nodes?: Node<AnyNodeData>[]
    edges?: Edge[]
    nodeHistory?: NodeHistoryMap
  }) => void
}

const PERSIST_DEBOUNCE_MS = 300

export function useWorkflowRegistry(): WorkflowRegistry {
  // On the server, render with a throwaway default so React can match the
  // initial client HTML. We hydrate from localStorage inside an effect to
  // avoid SSR/CSR mismatches.
  const [state, setState] = useState<RegistryState>(() => {
    const empty = createEmptyWorkflow()
    return { version: 1, workflows: [empty], activeId: empty.id }
  })
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    setState(loadRegistry())
    setHydrated(true)
  }, [])

  // Debounced persistence. Writes at most every PERSIST_DEBOUNCE_MS while
  // the user is actively editing, flushing when they pause.
  const persistTimer = useRef<number | null>(null)
  useEffect(() => {
    if (!hydrated) return
    if (persistTimer.current) window.clearTimeout(persistTimer.current)
    persistTimer.current = window.setTimeout(() => {
      saveRegistry(state)
    }, PERSIST_DEBOUNCE_MS)
    return () => {
      if (persistTimer.current) window.clearTimeout(persistTimer.current)
    }
  }, [state, hydrated])

  const setActive = useCallback((id: string) => {
    setState((s) => (s.activeId === id ? s : { ...s, activeId: id }))
  }, [])

  const create = useCallback(
    (name?: string, initial?: InitialContent) => {
      const wf = createEmptyWorkflow(name ?? "Untitled workflow", initial)
      setState((s) => ({
        version: 1,
        workflows: [...s.workflows, wf],
        activeId: wf.id,
      }))
      return wf.id
    },
    [],
  )

  const rename = useCallback((id: string, name: string) => {
    const trimmed = name.trim() || "Untitled workflow"
    setState((s) => ({
      ...s,
      workflows: s.workflows.map((w) =>
        w.id === id ? { ...w, name: trimmed, updatedAt: Date.now() } : w,
      ),
    }))
  }, [])

  const duplicate = useCallback((id: string) => {
    setState((s) => {
      const src = s.workflows.find((w) => w.id === id)
      if (!src) return s
      const now = Date.now()
      const copy: WorkflowRecord = {
        ...src,
        // structuredClone keeps nested arrays/objects independent so the
        // duplicate can diverge without mutating the source record.
        nodes: structuredClone(src.nodes),
        edges: structuredClone(src.edges),
        nodeHistory: structuredClone(src.nodeHistory),
        id: genId(),
        name: `${src.name} (copy)`,
        createdAt: now,
        updatedAt: now,
      }
      return {
        version: 1,
        workflows: [...s.workflows, copy],
        activeId: copy.id,
      }
    })
  }, [])

  const remove = useCallback((id: string) => {
    setState((s) => {
      const remaining = s.workflows.filter((w) => w.id !== id)
      if (remaining.length === 0) {
        // Never leave the app in a "no workflows" state — always seed a
        // fresh empty one so the UI has something to show.
        const empty = createEmptyWorkflow()
        return { version: 1, workflows: [empty], activeId: empty.id }
      }
      return {
        version: 1,
        workflows: remaining,
        activeId: s.activeId === id ? remaining[0].id : s.activeId,
      }
    })
  }, [])

  const updateActive = useCallback(
    (patch: {
      nodes?: Node<AnyNodeData>[]
      edges?: Edge[]
      nodeHistory?: NodeHistoryMap
    }) => {
      setState((s) => ({
        ...s,
        workflows: s.workflows.map((w) =>
          w.id === s.activeId
            ? { ...w, ...patch, updatedAt: Date.now() }
            : w,
        ),
      }))
    },
    [],
  )

  const active =
    state.workflows.find((w) => w.id === state.activeId) ?? null

  return {
    hydrated,
    workflows: state.workflows,
    activeId: state.activeId,
    active,
    setActive,
    create,
    rename,
    duplicate,
    remove,
    updateActive,
  }
}
