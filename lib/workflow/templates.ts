import type { Edge, Node } from "reactflow"
import type { AnyNodeData } from "@/types/workflow"
import { autoLayoutGraph } from "./auto-layout"

export interface WorkflowTemplate {
  id: string
  name: string
  description: string
  build: () => { nodes: Node<AnyNodeData>[]; edges: Edge[] }
}

// --- Helpers --------------------------------------------------------------

/**
 * Builds a linear workflow by pushing each node into Dagre afterwards, so we
 * don't have to hand-place coordinates. Positions set here are placeholders.
 */
function linear(
  nodes: Omit<Node<AnyNodeData>, "position">[],
  edgeSources: [string, string][],
): { nodes: Node<AnyNodeData>[]; edges: Edge[] } {
  const positioned = nodes.map((n, i) => ({
    ...n,
    position: { x: 0, y: i * 140 },
  })) as Node<AnyNodeData>[]
  const edges: Edge[] = edgeSources.map(([s, t], i) => ({
    id: `e-${i}-${s}-${t}`,
    source: s,
    target: t,
    animated: true,
  }))
  return autoLayoutGraph(positioned, edges, "TB")
}

// --- Template: Onboarding -------------------------------------------------

const onboarding = (): { nodes: Node<AnyNodeData>[]; edges: Edge[] } =>
  linear(
    [
      {
        id: "start-1",
        type: "start",
        data: {
          label: "Onboarding Start",
          title: "Onboarding Start",
          metadata: { department: "Engineering", level: "L4" },
        },
      },
      {
        id: "task-1",
        type: "task",
        data: {
          label: "Collect Documents",
          title: "Collect Documents",
          description: "Gather ID, PAN, bank details and signed offer letter.",
          assignee: "hr-ops@company.com",
          dueDate: "",
          customFields: { priority: "high" },
        },
      },
      {
        id: "approval-1",
        type: "approval",
        data: {
          label: "Manager Sign-off",
          title: "Manager Sign-off",
          approverRole: "Manager",
          autoApproveThreshold: 0,
        },
      },
      {
        id: "auto-1",
        type: "automatedStep",
        data: {
          label: "Send Welcome Email",
          title: "Send Welcome Email",
          actionId: "send_email",
          actionParams: {
            to: "new.hire@company.com",
            subject: "Welcome to the team!",
            body: "We're excited to have you on board.",
          },
        },
      },
      {
        id: "end-1",
        type: "end",
        data: {
          label: "Onboarding Complete",
          endMessage: "Onboarding Complete",
          summary: true,
        },
      },
    ],
    [
      ["start-1", "task-1"],
      ["task-1", "approval-1"],
      ["approval-1", "auto-1"],
      ["auto-1", "end-1"],
    ],
  )

// --- Template: Leave Approval --------------------------------------------

const leaveApproval = (): { nodes: Node<AnyNodeData>[]; edges: Edge[] } =>
  linear(
    [
      {
        id: "start-1",
        type: "start",
        data: {
          label: "Leave Request",
          title: "Leave Request Submitted",
          metadata: { category: "Annual Leave" },
        },
      },
      {
        id: "task-1",
        type: "task",
        data: {
          label: "Verify Balance",
          title: "Verify Leave Balance",
          description: "HR-Ops verifies remaining leave days before routing.",
          assignee: "hr-ops@company.com",
          dueDate: "",
          customFields: { sla: "4h" },
        },
      },
      {
        id: "approval-1",
        type: "approval",
        data: {
          label: "Manager Approval",
          title: "Manager Approval",
          approverRole: "Manager",
          autoApproveThreshold: 2,
        },
      },
      {
        id: "auto-1",
        type: "automatedStep",
        data: {
          label: "Update HRIS",
          title: "Update HRIS Calendar",
          actionId: "update_record",
          actionParams: {
            table: "leave_requests",
            status: "approved",
          },
        },
      },
      {
        id: "auto-2",
        type: "automatedStep",
        data: {
          label: "Notify Employee",
          title: "Notify Employee",
          actionId: "send_email",
          actionParams: {
            to: "{{employee.email}}",
            subject: "Your leave request has been approved",
          },
        },
      },
      {
        id: "end-1",
        type: "end",
        data: {
          label: "Leave Approved",
          endMessage: "Leave Approved",
          summary: true,
        },
      },
    ],
    [
      ["start-1", "task-1"],
      ["task-1", "approval-1"],
      ["approval-1", "auto-1"],
      ["auto-1", "auto-2"],
      ["auto-2", "end-1"],
    ],
  )

// --- Template: Document Verification --------------------------------------

const documentVerification = (): { nodes: Node<AnyNodeData>[]; edges: Edge[] } =>
  linear(
    [
      {
        id: "start-1",
        type: "start",
        data: {
          label: "Doc Upload",
          title: "Document Uploaded",
          metadata: { source: "Employee Portal" },
        },
      },
      {
        id: "auto-1",
        type: "automatedStep",
        data: {
          label: "OCR & Validate",
          title: "OCR & Field Validation",
          actionId: "generate_document",
          actionParams: {
            template: "ocr_validation",
            recipient: "hr-ops@company.com",
          },
        },
      },
      {
        id: "task-1",
        type: "task",
        data: {
          label: "Manual Review",
          title: "Manual Review",
          description: "HR manually reviews documents flagged by OCR.",
          assignee: "hr-ops@company.com",
          dueDate: "",
          customFields: {},
        },
      },
      {
        id: "approval-1",
        type: "approval",
        data: {
          label: "Compliance Approval",
          title: "Compliance Approval",
          approverRole: "Compliance Officer",
          autoApproveThreshold: 0,
        },
      },
      {
        id: "end-1",
        type: "end",
        data: {
          label: "Verified",
          endMessage: "Documents Verified",
          summary: true,
        },
      },
    ],
    [
      ["start-1", "auto-1"],
      ["auto-1", "task-1"],
      ["task-1", "approval-1"],
      ["approval-1", "end-1"],
    ],
  )

// --- Registry -------------------------------------------------------------

export const WORKFLOW_TEMPLATES: WorkflowTemplate[] = [
  {
    id: "onboarding",
    name: "Employee Onboarding",
    description: "New hire intake → docs → manager sign-off → welcome email",
    build: onboarding,
  },
  {
    id: "leave-approval",
    name: "Leave Approval",
    description: "Leave request → balance check → approval → HRIS update",
    build: leaveApproval,
  },
  {
    id: "document-verification",
    name: "Document Verification",
    description: "Upload → OCR → manual review → compliance sign-off",
    build: documentVerification,
  },
]
