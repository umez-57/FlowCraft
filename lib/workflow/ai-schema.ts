import { z } from "zod"

/**
 * Schema the LLM must output. Mirrors `WorkflowNode` / `WorkflowEdge`
 * from `types/workflow.ts` but uses `nullable()` instead of `optional()`
 * because OpenAI strict-mode (enabled by default in AI SDK 6) rejects
 * optional properties.
 *
 * Keep this schema narrow — every field the LLM sets we have to handle
 * on the client, and every field it forgets to set will trip the
 * validator.
 */

const positionSchema = z.object({
  x: z.number().describe("Horizontal position on the canvas in pixels"),
  y: z.number().describe("Vertical position on the canvas in pixels"),
})

const startDataSchema = z.object({
  type: z.literal("start"),
  label: z.string().describe("Always 'Start'"),
  title: z.string().describe("Human-readable title, e.g. 'Onboarding Start'"),
})

const taskDataSchema = z.object({
  type: z.literal("task"),
  label: z.string().describe("Always 'Task'"),
  title: z.string().describe("Short task name, e.g. 'Collect Documents'"),
  description: z
    .string()
    .nullable()
    .describe("One sentence describing what needs to happen"),
  assignee: z
    .string()
    .nullable()
    .describe("Role or email of the person responsible, e.g. 'HR Manager'"),
  dueDate: z
    .string()
    .nullable()
    .describe("ISO date string (YYYY-MM-DD) or null"),
})

const approvalDataSchema = z.object({
  type: z.literal("approval"),
  label: z.string().describe("Always 'Approval'"),
  title: z.string().describe("What is being approved, e.g. 'Manager Sign-off'"),
  approverRole: z
    .string()
    .describe("Role that must approve, e.g. 'Manager', 'HR', 'Finance'"),
  autoApproveThreshold: z
    .number()
    .nullable()
    .describe("Auto-approve threshold; 0 or null means no auto-approval"),
})

const automatedStepDataSchema = z.object({
  type: z.literal("automatedStep"),
  label: z.string().describe("Always 'Automated Step'"),
  title: z.string().describe("What the system does, e.g. 'Send Welcome Email'"),
  actionId: z
    .enum([
      "send_email",
      "generate_doc",
      "create_ticket",
      "notify_slack",
      "provision_account",
    ])
    .describe("Which mock action to run. Must be one of the listed IDs."),
})

const endDataSchema = z.object({
  type: z.literal("end"),
  label: z.string().describe("Always 'End'"),
  endMessage: z
    .string()
    .describe("Completion message shown to the user, e.g. 'Onboarding complete'"),
})

const nodeSchema = z.object({
  id: z
    .string()
    .describe("Unique ID for the node, e.g. 'node_1', 'node_2', 'node_3'"),
  position: positionSchema,
  data: z.union([
    startDataSchema,
    taskDataSchema,
    approvalDataSchema,
    automatedStepDataSchema,
    endDataSchema,
  ]),
})

const edgeSchema = z.object({
  id: z.string().describe("Unique ID for the edge, e.g. 'edge_1', 'edge_2'"),
  source: z.string().describe("ID of the source node"),
  target: z.string().describe("ID of the target node"),
})

export const aiWorkflowSchema = z.object({
  name: z
    .string()
    .describe(
      "A short, descriptive name for the workflow, e.g. 'Employee Onboarding'",
    ),
  nodes: z
    .array(nodeSchema)
    .min(2)
    .describe(
      "The workflow nodes. MUST contain exactly one 'start' node and at least one 'end' node.",
    ),
  edges: z
    .array(edgeSchema)
    .describe("The edges connecting the nodes. MUST form an acyclic graph."),
})

export type AIWorkflow = z.infer<typeof aiWorkflowSchema>
