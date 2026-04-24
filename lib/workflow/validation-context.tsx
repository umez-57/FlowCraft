"use client"

import { createContext, useContext, type ReactNode } from "react"
import type { ValidationError } from "@/types/api"

export type NodeIssuesMap = Map<string, ValidationError[]>

const ValidationContext = createContext<NodeIssuesMap>(new Map())

export function ValidationProvider({
  value,
  children,
}: {
  value: NodeIssuesMap
  children: ReactNode
}) {
  return <ValidationContext.Provider value={value}>{children}</ValidationContext.Provider>
}

/** Returns issues scoped to a single node, or an empty array. */
export function useNodeIssues(nodeId: string): ValidationError[] {
  const map = useContext(ValidationContext)
  return map.get(nodeId) ?? []
}
