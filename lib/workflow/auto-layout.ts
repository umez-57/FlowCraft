import dagre from "dagre"
import type { Edge, Node } from "reactflow"
import type { AnyNodeData } from "@/types/workflow"

// Keep in sync with the visual width/height of `CustomNode` (see custom-node.tsx).
// CustomNode is `w-60` (240px) and ~84px tall with the accent stripe + body.
const NODE_WIDTH = 240
const NODE_HEIGHT = 84

export type LayoutDirection = "TB" | "LR"

/**
 * Runs the Dagre layered layout algorithm on the given graph and returns a new
 * node array with updated `position` values. Edges are returned unchanged.
 *
 * @param direction "TB" = top-to-bottom (default), "LR" = left-to-right.
 */
export function autoLayoutGraph(
  nodes: Node<AnyNodeData>[],
  edges: Edge[],
  direction: LayoutDirection = "TB",
): { nodes: Node<AnyNodeData>[]; edges: Edge[] } {
  if (nodes.length === 0) return { nodes, edges }

  const g = new dagre.graphlib.Graph()
  g.setDefaultEdgeLabel(() => ({}))
  g.setGraph({
    rankdir: direction,
    nodesep: direction === "TB" ? 60 : 40,
    ranksep: direction === "TB" ? 80 : 100,
    marginx: 20,
    marginy: 20,
  })

  nodes.forEach((n) => {
    g.setNode(n.id, { width: NODE_WIDTH, height: NODE_HEIGHT })
  })
  edges.forEach((e) => {
    g.setEdge(e.source, e.target)
  })

  dagre.layout(g)

  const laidOutNodes = nodes.map((n) => {
    const { x, y } = g.node(n.id)
    // Dagre returns center coordinates; React Flow expects top-left.
    return {
      ...n,
      position: { x: x - NODE_WIDTH / 2, y: y - NODE_HEIGHT / 2 },
    }
  })

  return { nodes: laidOutNodes, edges }
}
