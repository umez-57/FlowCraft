import type { AnyNodeData, NodeType } from "@/types/workflow"
import { Play, ListTodo, ShieldCheck, Zap, CircleStop } from "lucide-react"
import type { LucideIcon } from "lucide-react"

export interface NodeRegistryEntry {
  type: NodeType
  label: string
  description: string
  icon: LucideIcon
  // Tailwind-friendly token pair for the accent stripe
  accent: string
  accentBg: string
  defaultData: () => AnyNodeData
}

export const NODE_REGISTRY: Record<NodeType, NodeRegistryEntry> = {
  start: {
    type: "start",
    label: "Start",
    description: "Workflow entry point",
    icon: Play,
    accent: "bg-emerald-500",
    accentBg: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    defaultData: () => ({
      label: "Start",
      title: "Start",
      metadata: {},
    }),
  },
  task: {
    type: "task",
    label: "Task",
    description: "Human task (collect docs, etc.)",
    icon: ListTodo,
    accent: "bg-blue-500",
    accentBg: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
    defaultData: () => ({
      label: "Task",
      title: "New Task",
      description: "",
      assignee: "",
      dueDate: "",
      customFields: {},
    }),
  },
  approval: {
    type: "approval",
    label: "Approval",
    description: "Manager / HR approval step",
    icon: ShieldCheck,
    accent: "bg-amber-500",
    accentBg: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    defaultData: () => ({
      label: "Approval",
      title: "Approval Required",
      approverRole: "Manager",
      autoApproveThreshold: 0,
    }),
  },
  automatedStep: {
    type: "automatedStep",
    label: "Automated Step",
    description: "System-triggered action",
    icon: Zap,
    accent: "bg-violet-500",
    accentBg: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
    defaultData: () => ({
      label: "Automated Step",
      title: "Automated Action",
      actionId: "",
      actionParams: {},
    }),
  },
  end: {
    type: "end",
    label: "End",
    description: "Workflow completion",
    icon: CircleStop,
    accent: "bg-rose-500",
    accentBg: "bg-rose-500/10 text-rose-600 dark:text-rose-400",
    defaultData: () => ({
      label: "End",
      endMessage: "Workflow completed",
      summary: true,
    }),
  },
}

export const NODE_TYPE_ORDER: NodeType[] = [
  "start",
  "task",
  "approval",
  "automatedStep",
  "end",
]
