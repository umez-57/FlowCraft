import type { AutomatedAction } from "@/types/api"

export const MOCK_AUTOMATED_ACTIONS: AutomatedAction[] = [
  {
    id: "send_email",
    label: "Send Email",
    params: ["to", "subject", "body"],
  },
  {
    id: "generate_doc",
    label: "Generate Document",
    params: ["template", "recipient"],
  },
  {
    id: "create_ticket",
    label: "Create Support Ticket",
    params: ["title", "priority"],
  },
  {
    id: "notify_slack",
    label: "Send Slack Notification",
    params: ["channel", "message"],
  },
  {
    id: "provision_account",
    label: "Provision System Account",
    params: ["system", "username", "role"],
  },
]
