import { generateText, Output } from "ai"
import { openai } from "@ai-sdk/openai"
import { NextResponse } from "next/server"
import { aiWorkflowSchema } from "@/lib/workflow/ai-schema"

export const runtime = "nodejs" // Edge runtime is NOT compatible with AI SDK

// The @ai-sdk/openai provider automatically picks up OPENAI_API_KEY from
// process.env, so no manual wiring is needed here as long as the env var
// is set in Vercel (Project Settings → Environment Variables).

const SYSTEM_PROMPT = `You are an expert HR workflow designer for "Flowcraft", a visual workflow tool.

Your job: given a natural-language description, output a complete, structurally-valid workflow graph as JSON matching the provided schema.

## Node types available

1. **start** — the workflow entry point. EXACTLY ONE required. No incoming edges.
2. **task** — a human task (e.g. "Collect documents", "Fill form"). Has assignee + due date.
3. **approval** — a sign-off step. Has approverRole (Manager / HR / Finance / etc.).
4. **automatedStep** — a system action. Must pick one actionId from:
   - send_email, generate_doc, create_ticket, notify_slack, provision_account
5. **end** — workflow completion. AT LEAST ONE required. No outgoing edges.

## Layout rules

- Lay nodes out top-to-bottom. Start node at y=0, then increment y by ~150 per level.
- Spread parallel branches horizontally with x-offsets of ~300.
- Default x center is 400.

## Graph rules

- Graph MUST be a DAG (no cycles).
- Every non-start node must be reachable from start.
- Every non-end node should have at least one outgoing edge.
- Prefer linear flows unless the user explicitly asks for branches.
- Typical HR flow order: Start → (Task | Automated) → Approval → (Task | Automated) → End

## Good examples

"Employee onboarding" →
  Start → Task (Collect Docs, HR) → Automated (send_email, welcome) → Approval (Manager) → Automated (provision_account) → End

"Leave request approval" →
  Start → Task (Submit request, Employee) → Approval (Manager) → Automated (notify_slack) → End

"Document verification" →
  Start → Task (Upload docs) → Automated (generate_doc, OCR) → Approval (HR) → Automated (create_ticket, archive) → End

## Output rules

- Use clear, specific titles — never "Step 1", "Step 2".
- IDs should be simple and sequential: node_1, node_2, ..., edge_1, edge_2, ...
- For task dueDate, use ISO format (YYYY-MM-DD) relative to a reasonable timeline, or null.
- For approval autoApproveThreshold, use 0 or null unless the user asks for automatic approval.
- Do NOT invent new node types or action IDs.
- Keep the workflow to 4-8 nodes unless the user explicitly asks for more.`

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}))
    const prompt = typeof body.prompt === "string" ? body.prompt.trim() : ""

    if (!prompt) {
      return NextResponse.json(
        { error: "Prompt is required" },
        { status: 400 },
      )
    }
    if (prompt.length > 2000) {
      return NextResponse.json(
        { error: "Prompt too long (max 2000 chars)" },
        { status: 400 },
      )
    }

    // Guard rail: if the key is missing, fail fast with a clear message
    // instead of a cryptic provider error.
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        {
          error:
            "OPENAI_API_KEY is not configured. Add it in your Vercel project's Environment Variables and redeploy.",
        },
        { status: 500 },
      )
    }

    const { output } = await generateText({
      // Direct OpenAI provider — reads OPENAI_API_KEY from process.env.
      // gpt-4o-mini is fast, cheap, and excellent at structured JSON
      // output, which is exactly what we need for workflow generation.
      model: openai("gpt-4o-mini"),
      output: Output.object({ schema: aiWorkflowSchema }),
      system: SYSTEM_PROMPT,
      prompt,
    })

    return NextResponse.json(output)
  } catch (err) {
    console.error("[v0] generate-workflow error:", err)
    const message =
      err instanceof Error ? err.message : "Failed to generate workflow"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
