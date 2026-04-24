import type { ValidationError, ValidationResult } from "@/types/api"
import type { Workflow } from "@/types/workflow"

/**
 * Validates the structural integrity of a workflow graph.
 * - Must have at least one Start node and one End node.
 * - Must not contain cycles.
 * - All nodes (besides Start) must be reachable from the Start node.
 * - End nodes must be reachable.
 */
export function validateWorkflow(workflow: Workflow): ValidationResult {
  const errors: ValidationError[] = []
  const { nodes, edges } = workflow

  if (nodes.length === 0) {
    errors.push({
      nodeId: null,
      message: "Workflow is empty. Drag nodes from the sidebar to get started.",
      severity: "error",
    })
    return { isValid: false, errors }
  }

  const startNodes = nodes.filter((n) => n.type === "start")
  const endNodes = nodes.filter((n) => n.type === "end")

  if (startNodes.length === 0) {
    errors.push({
      nodeId: null,
      message: "Workflow must have a Start node.",
      severity: "error",
    })
  }
  if (startNodes.length > 1) {
    errors.push({
      nodeId: null,
      message: "Workflow can only have one Start node.",
      severity: "error",
    })
  }
  if (endNodes.length === 0) {
    errors.push({
      nodeId: null,
      message: "Workflow must have at least one End node.",
      severity: "error",
    })
  }

  // Build adjacency lists
  const outgoing = new Map<string, string[]>()
  const incoming = new Map<string, string[]>()
  nodes.forEach((n) => {
    outgoing.set(n.id, [])
    incoming.set(n.id, [])
  })
  edges.forEach((e) => {
    outgoing.get(e.source)?.push(e.target)
    incoming.get(e.target)?.push(e.source)
  })

  // Cycle detection (DFS with recursion stack)
  const visited = new Set<string>()
  const stack = new Set<string>()
  let hasCycle = false

  const dfs = (id: string): boolean => {
    visited.add(id)
    stack.add(id)
    for (const next of outgoing.get(id) ?? []) {
      if (!visited.has(next)) {
        if (dfs(next)) return true
      } else if (stack.has(next)) {
        return true
      }
    }
    stack.delete(id)
    return false
  }

  for (const n of nodes) {
    if (!visited.has(n.id)) {
      if (dfs(n.id)) {
        hasCycle = true
        break
      }
    }
  }

  if (hasCycle) {
    errors.push({
      nodeId: null,
      message: "Workflow contains a cycle. Remove loops to continue.",
      severity: "error",
    })
  }

  // Reachability from start
  if (startNodes.length === 1) {
    const reachable = new Set<string>()
    const queue = [startNodes[0].id]
    while (queue.length > 0) {
      const id = queue.shift()!
      if (reachable.has(id)) continue
      reachable.add(id)
      for (const next of outgoing.get(id) ?? []) queue.push(next)
    }
    nodes.forEach((n) => {
      if (!reachable.has(n.id)) {
        errors.push({
          nodeId: n.id,
          message: `Node "${n.data.label}" is not reachable from Start.`,
          severity: "warning",
        })
      }
    })
  }

  // Start node should have no incoming, End node should have no outgoing
  startNodes.forEach((s) => {
    if ((incoming.get(s.id) ?? []).length > 0) {
      errors.push({
        nodeId: s.id,
        message: "Start node must not have any incoming connections.",
        severity: "error",
      })
    }
  })
  endNodes.forEach((e) => {
    if ((outgoing.get(e.id) ?? []).length > 0) {
      errors.push({
        nodeId: e.id,
        message: "End node must not have any outgoing connections.",
        severity: "error",
      })
    }
  })

  // Non-start, non-end nodes should have at least one incoming & outgoing
  nodes.forEach((n) => {
    if (n.type === "start" || n.type === "end") return
    if ((incoming.get(n.id) ?? []).length === 0) {
      errors.push({
        nodeId: n.id,
        message: `Node "${n.data.label}" has no incoming connection.`,
        severity: "warning",
      })
    }
    if ((outgoing.get(n.id) ?? []).length === 0) {
      errors.push({
        nodeId: n.id,
        message: `Node "${n.data.label}" has no outgoing connection.`,
        severity: "warning",
      })
    }
  })

  const isValid = errors.filter((e) => e.severity === "error").length === 0
  return { isValid, errors }
}

/**
 * Returns an ordered execution path by performing a topological sort.
 * Only includes nodes reachable from the Start node.
 */
export function topologicalOrder(workflow: Workflow): string[] {
  const { nodes, edges } = workflow
  const inDegree = new Map<string, number>()
  const outgoing = new Map<string, string[]>()
  nodes.forEach((n) => {
    inDegree.set(n.id, 0)
    outgoing.set(n.id, [])
  })
  edges.forEach((e) => {
    outgoing.get(e.source)?.push(e.target)
    inDegree.set(e.target, (inDegree.get(e.target) ?? 0) + 1)
  })

  const queue: string[] = []
  nodes.forEach((n) => {
    if ((inDegree.get(n.id) ?? 0) === 0) queue.push(n.id)
  })
  const order: string[] = []
  while (queue.length > 0) {
    const id = queue.shift()!
    order.push(id)
    for (const next of outgoing.get(id) ?? []) {
      inDegree.set(next, (inDegree.get(next) ?? 0) - 1)
      if ((inDegree.get(next) ?? 0) === 0) queue.push(next)
    }
  }
  return order
}
