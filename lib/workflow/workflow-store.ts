import type { Edge, Node } from "reactflow"
import type { AnyNodeData, NodeHistoryMap } from "@/types/workflow"

/**
 * A single saved workflow. Each workflow is an isolated document — its
 * nodes, edges, and per-node version history are stored together and are
 * independent of every other workflow. The user can have many of these
 * and switch between them from the navbar.
 */
export interface WorkflowRecord {
  id: string
  name: string
  nodes: Node<AnyNodeData>[]
  edges: Edge[]
  nodeHistory: NodeHistoryMap
  createdAt: number
  updatedAt: number
}

export interface RegistryState {
  version: 1
  workflows: WorkflowRecord[]
  activeId: string
}

const STORAGE_KEY = "hr-workflow:registry"

/** Short, URL-safe id. Sufficient for localStorage-scoped records. */
function genId(prefix = "wf") {
  return `${prefix}_${Date.now().toString(36)}_${Math.random()
    .toString(36)
    .slice(2, 8)}`
}

export function createEmptyWorkflow(
  name = "Untitled workflow",
  seed?: Pick<WorkflowRecord, "nodes" | "edges" | "nodeHistory">,
): WorkflowRecord {
  const now = Date.now()
  return {
    id: genId(),
    name,
    nodes: seed?.nodes ?? [],
    edges: seed?.edges ?? [],
    nodeHistory: seed?.nodeHistory ?? {},
    createdAt: now,
    updatedAt: now,
  }
}

export function loadRegistry(): RegistryState {
  if (typeof window === "undefined") {
    // SSR: return a transient default. The client useEffect will hydrate
    // from localStorage once mounted.
    const empty = createEmptyWorkflow()
    return { version: 1, workflows: [empty], activeId: empty.id }
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) throw new Error("empty")
    const parsed = JSON.parse(raw) as Partial<RegistryState>
    if (
      !parsed ||
      parsed.version !== 1 ||
      !Array.isArray(parsed.workflows) ||
      parsed.workflows.length === 0 ||
      typeof parsed.activeId !== "string"
    ) {
      throw new Error("invalid")
    }
    // Guard: activeId must reference one of the workflows.
    const hasActive = parsed.workflows.some((w) => w.id === parsed.activeId)
    return {
      version: 1,
      workflows: parsed.workflows as WorkflowRecord[],
      activeId: hasActive ? parsed.activeId : parsed.workflows[0].id,
    }
  } catch {
    const empty = createEmptyWorkflow()
    return { version: 1, workflows: [empty], activeId: empty.id }
  }
}

export function saveRegistry(state: RegistryState) {
  if (typeof window === "undefined") return
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    // Quota exceeded or blocked — silently drop. The in-memory state is
    // still authoritative for the current session.
  }
}

export { genId }
