# Flowcraft — Visual Workflow Designer

**Flowcraft** is a visual, drag-and-drop workflow designer for HR teams, built with **Next.js 16 (App Router) + React 19 + TypeScript + React Flow + Tailwind CSS v4 + shadcn/ui**, and enhanced with an **AI-powered natural-language workflow generator**.

An HR admin can either **describe a process in plain English and have the AI assistant build it automatically**, or compose internal workflows (onboarding, leave approval, document verification, etc.) manually from a palette of configurable nodes — with **multi-workflow management, real-time validation, auto-layout, per-node version history, and a sandbox simulator**, all powered by a mock API.

> Submitted as part of the Tredence Full Stack Engineering Intern case study.

---

## Hero Feature — AI Natural-Language Workflow Builder

Flowcraft ships with a first-class AI assistant that turns natural-language descriptions into fully-configured, validated workflows.

### What it does

1. Click the **AI Assistant** floating button at the bottom-right of the canvas.
2. Describe the process you want — for example:
  > *"Build an employee onboarding workflow with document collection, IT account provisioning, manager approval, and a welcome email."*
3. The assistant generates a complete graph (nodes + edges + per-node configuration), drops it straight onto your canvas, and auto-renames the workflow.

### How it works (under the hood)

- **Model:** `gpt-4o-mini` via `[@ai-sdk/openai](https://sdk.vercel.ai)` — fast, cheap, excellent at structured JSON.
- **Structured output:** Uses AI SDK 6's `generateText` + `Output.object({ schema })` with a **Zod schema that mirrors Flowcraft's `WorkflowNode` / `WorkflowEdge` types** — so the LLM output is guaranteed to match the canvas shape or the call fails loudly.
- **Domain-aware system prompt:** Feeds the model the full list of node types, the 5 allowed `actionId` values for Automated Steps, canonical HR flow patterns, and top-to-bottom layout rules.
- **Safe by design:** The generated graph replaces the **current** workflow's contents (matching the same UX contract as template loading), the prior state is pushed onto the undo stack so **Ctrl+Z reverts cleanly**, and the existing structural validator catches any mistakes the AI misses.
- **API route:** `POST /api/ai/generate-workflow` (`nodejs` runtime — AI SDK is not edge-compatible).

### Setup — required to enable the AI feature

The AI assistant needs your own OpenAI API key. The rest of the app runs without it.

1. **Get a key:** [https://docs.google.com/document/d/15f8W5dztOyq5qjpPS1zu5vbCrtiO8O8L/edit?usp=sharing&ouid=103511385425695784623&rtpof=true&sd=true](https://docs.google.com/document/d/15f8W5dztOyq5qjpPS1zu5vbCrtiO8O8L/edit?usp=sharing&ouid=103511385425695784623&rtpof=true&sd=true)
2. **Add the key to a local env file.** From the project root:
  ```bash
   cp .env.example .env.local
  ```
   Then edit `.env.local` and set:
3. **Restart the dev server** (`pnpm dev`). The AI Assistant button will now generate real workflows.

If the variable is missing, the route returns a clear `500` with a human-readable message pointing you back to this section — it never crashes silently.

---

## Live Demo : [https://flowcraft-hr.vercel.app/](https://flowcraft-hr.vercel.app/)

1. `pnpm install`
2. `cp .env.example .env.local` and add your `OPENAI_API_KEY` (only needed for the AI feature)
3. `pnpm dev`
4. Open [http://localhost:3000](http://localhost:3000)

A first-time welcome tour walks new users through the **AI assistant**, the node palette, canvas gestures, and keyboard shortcuts. Pick any of the three built-in templates (Employee Onboarding, Leave Approval, Document Verification) to see a finished workflow, click the **AI Assistant** button to generate one from a prompt, or build your own — then click **Test Workflow** to simulate.

Apart from the optional AI key, no external services are required — everything else runs on Next.js Route Handlers and `localStorage`.

---

## Feature Matrix

### Required (from the case study spec)


| Requirement                                                     | Status                                                           |
| --------------------------------------------------------------- | ---------------------------------------------------------------- |
| React app scaffolding (Vite **or** Next.js)                     | Done — Next.js 16 App Router                                     |
| React Flow canvas with multiple custom node types               | Done — 5 node types (Start, Task, Approval, Automated Step, End) |
| Drag from sidebar · connect · select · delete                   | Done                                                             |
| Per-node configuration forms with dynamic fields                | Done — one typed form per node type                              |
| Mock `GET /automations`                                         | Done — returns 5 actions with typed params                       |
| Mock `POST /simulate`                                           | Done — validates, topologically sorts, returns timestamped log   |
| Sandbox panel with step-by-step execution                       | Done — slide-over sheet with validation + timeline               |
| Structural validation (cycles · reachability · Start/End rules) | Done — DFS + BFS + Kahn's algorithm                              |
| Clean folder structure, hooks, type safety                      | Done                                                             |
| README with architecture and design decisions                   | This document                                                    |


### Bonus (all seven implemented)


| Bonus feature                             | Status                                                                     |
| ----------------------------------------- | -------------------------------------------------------------------------- |
| Export / Import workflow as JSON          | Done                                                                       |
| Node templates                            | Done — 3 templates (Onboarding, Leave, Documents)                          |
| Undo / Redo                               | Done — Ctrl+Z / Ctrl+Y + toolbar buttons, 50-step history                  |
| Mini-map + zoom controls                  | Done                                                                       |
| Validation errors visually shown on nodes | Done — red/amber badges with hover tooltips                                |
| Auto-layout                               | Done — Dagre top-to-bottom                                                 |
| Node version history                      | Done — per-node timeline, persisted to `localStorage`, restore-any-version |


### Additional polish (beyond the spec)


| Addition                                            | Why it matters                                                                                               |
| --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| **AI natural-language workflow generator**          | **Hero feature — describes-and-builds with GPT-4o-mini, full Zod schema validation, safe replace semantics** |
| Multi-workflow registry with switcher               | Users can manage several HR processes in parallel without losing state                                       |
| Welcome tour on first visit                         | Teaches the AI assistant, canvas gestures and shortcuts; dismissal persisted                                 |
| Four-sided connection handles with smart visibility | Matches the CodeAuto reference design; handles only appear on hover or when connected                        |
| Edges tinted by source-node type                    | Canvas stays legible — green from Start, amber from Approval, etc.                                           |
| Collapsible Tips panel                              | Surfaces shortcuts without cluttering the palette long-term                                                  |
| Dagre-based layout on template load                 | Generated workflows look hand-arranged, not dumped                                                           |
| Brand + metadata polish                             | Custom SVG mark, proper `<title>` and `<meta description>`                                                   |


---

## Architecture

### High-level data flow

```
┌──────────────────────────────┐
│     WorkflowDesigner         │  owns: WorkflowRegistry (multi-workflow)
│                              │
│  ┌────────────────────────┐  │
│  │   ActiveWorkflow       │  │  owns: in-memory state for ONE workflow
│  │   (key = activeId)     │  │
│  │                        │  │
│  │  useWorkflowState()    │  │  nodes, edges, selection, undo/redo, node history
│  │  useAutomations()      │  │  -> GET /api/automations
│  │  useSimulation()       │  │  -> POST /api/simulate
│  │                        │  │
│  │  <Toolbar />           │  │  logo · switcher · action clusters · Test CTA
│  │  <Sidebar />           │  │  draggable node palette + collapsible Tips
│  │  <Canvas />            │  │  React Flow with EdgesProvider + ValidationProvider
│  │  <FormPanel />         │  │  per-type form + node version history
│  │  <TestPanel />         │  │  validation results + simulation log
│  │  <AIAssistantPanel />  │  │  -> POST /api/ai/generate-workflow  (hero feature)
│  │                        │  │
│  └────────────────────────┘  │
│                              │
│  <WelcomeTour />  (first visit)
│  <Toaster />                 │
└──────────────────────────────┘
```

Switching workflows remounts `<ActiveWorkflow>` via `key={activeId}` — a clean reset of in-memory state, while the registry preserves each workflow's nodes, edges, and node history in `localStorage`.

### Folder structure

```
app/
├── api/
│   ├── automations/route.ts           # GET mock automated actions
│   ├── simulate/route.ts              # POST graph → validation + execution log
│   └── ai/
│       └── generate-workflow/route.ts # POST prompt → AI-generated workflow (hero feature)
├── layout.tsx                         # Metadata + fonts + <Toaster>
├── page.tsx                           # Mounts <WorkflowDesigner />
└── globals.css                        # Design tokens + React Flow theme overrides

components/workflow/
├── workflow-designer.tsx         # Outer composition + registry + welcome tour mount
├── workflow-toolbar.tsx          # 3-column header (brand · switcher · clusters · Test CTA)
├── workflow-switcher.tsx         # Multi-workflow dropdown with rename/duplicate/delete
├── workflow-canvas.tsx           # React Flow wrapper, drop handler, edge coloring
├── node-sidebar.tsx              # Draggable node palette + collapsible Tips
├── node-form-panel.tsx           # Right-hand config panel
├── node-history.tsx              # Per-node version timeline with restore
├── workflow-test-panel.tsx       # Sandbox sheet (validation + simulation)
├── ai-assistant-panel.tsx        # Floating button + prompt dialog (hero feature)
├── welcome-tour.tsx              # 6-step first-visit walkthrough (incl. AI assistant)
├── nodes/
│   └── custom-node.tsx           # Single parameterized node with SmartHandle + validation badges
└── forms/
    ├── start-node-form.tsx
    ├── task-node-form.tsx
    ├── approval-node-form.tsx
    ├── automated-step-node-form.tsx
    ├── end-node-form.tsx
    └── key-value-editor.tsx      # Reusable K/V editor for metadata / custom fields

hooks/
├── use-workflow-state.ts         # Nodes/edges/selection + undo/redo + auto-layout + node history
├── use-workflow-registry.ts      # Multi-workflow CRUD + active-id + localStorage sync
├── use-automations.ts            # SWR-style fetch for /api/automations
└── use-workflow-simulation.ts    # Fetch wrapper for /api/simulate

lib/workflow/
├── node-registry.ts              # Central registry (label, icon, color, default data)
├── validator.ts                  # validateWorkflow + topologicalOrder (DFS · BFS · Kahn)
├── auto-layout.ts                # Dagre wrapper
├── templates.ts                  # 3 HR templates (each declaratively built + dagre-laid-out)
├── workflow-store.ts             # Registry ↔ localStorage serialization
├── validation-context.tsx        # React context broadcasting per-node issues to custom-node
├── edges-context.tsx             # React context exposing edges to nodes (for smart handle visibility)
├── ai-schema.ts                  # Zod schema for structured LLM output (hero feature)
├── api-client.ts                 # Typed thin fetch wrapper
└── mock-data.ts                  # MOCK_AUTOMATED_ACTIONS

types/
├── workflow.ts                   # NodeType, WorkflowNode, WorkflowEdge, NodeVersion, etc.
└── api.ts                        # AutomatedAction, SimulationRequest, SimulationResponse
```

---

## Design Decisions

### 1. Plugin-style Node Registry

Every node type lives in a single `NODE_REGISTRY` map holding its label, icon, accent color, and default-data factory. Adding a new node type is a **three-step change**: add a variant to the `NodeType` union, add an entry to the registry, and add a matching form component. No other file needs editing. The sidebar, canvas, validator, form panel, **and AI schema** all read from this single source of truth.

### 2. State: One Hook, Bounded Undo/Redo, Per-Node History

`useWorkflowState` centralizes nodes, edges, selection, a session undo/redo stack (50 steps), and a **per-node version history** (25 entries per node, debounced 1.5s to avoid one-version-per-keystroke).

- Every mutation calls `commitHistory()` before applying the change, making Ctrl+Z reliable.
- Node history uses semantic labels ("Changed assignee", "Changed 3 fields") computed from diffing the patch keys.
- Restore is **deduplicated** — if the current state already matches a history entry, the Restore button is a no-op and the entry is labeled "Current" with a green badge.
- `onNodeDragStart` captures a single history entry per drag so undoing a drag is one Ctrl+Z, not one per animation frame.

### 3. Multi-Workflow via a Separate Registry Hook

`useWorkflowRegistry` owns the list of workflows and the active id, persisted to `localStorage` under `hr-workflow:registry` (key kept stable to avoid wiping returning users). `useWorkflowState` owns only the *current* workflow's in-memory state. Switching workflows remounts the component tree via a React `key`, which gives each workflow its own clean undo stack and prevents state bleed-through.

Template loading and **AI generation** both replace the **current** workflow's contents (instead of spawning a new one) and auto-rename it if the user hasn't renamed it yet — bugs the user caught during testing.

### 4. Validation via React Context

`validateWorkflow()` returns issues with optional `nodeId` fields. The designer runs validation once per render, groups issues by node, and broadcasts the map through `ValidationContext`. `CustomNode` reads from the context and renders a red dot (error) or amber triangle (warning) in its top-right corner, with a hover tooltip listing every issue. No prop drilling through React Flow's internals.

### 5. AI with Schema-Enforced Structured Output

The AI assistant **never** returns freeform text. The API route uses AI SDK 6's `Output.object({ schema: aiWorkflowSchema })` bound to a Zod schema that exactly mirrors `WorkflowNode` + `WorkflowEdge`. If the model produces invalid JSON or fields outside the allowed set (wrong `nodeType`, non-whitelisted `actionId`, missing required properties), the call fails with a structured error before ever touching the canvas. The system prompt is deliberately domain-specific — it lists the 5 node types, 5 automated action IDs, canonical HR patterns, and layout conventions — so the model rarely needs retries.

### 6. Smart Handles (4 sides, Hover-Revealed)

Each node exposes **eight handles** (top/bottom/left/right, each as both source and target except on Start/End). By default they are invisible. They fade in on node hover (`group-hover:opacity-100`) and stay permanently visible when an edge is connected to them, computed via `EdgesContext` + `useIsHandleConnected(nodeId, handleId)`. This matches Figma/n8n conventions and keeps the canvas clean.

### 7. Mock API via Next.js Route Handlers

Instead of pulling in MSW or json-server, the mock backend lives in `app/api/*/route.ts`. Two benefits:

- The project runs as a single process (`pnpm dev`) — no extra setup.
- The `/api/simulate` handler re-uses the **exact same validator** as the UI, so the sandbox cannot disagree with what the canvas shows.

### 8. Clean Graph Algorithms

`validator.ts` contains three textbook algorithms used for real correctness (not decoration):

- **DFS cycle detection** with visited + recursion-stack sets — a simulation engine must never loop.
- **BFS reachability** from Start — unreachable nodes produce warnings, not errors (they might be work-in-progress).
- **Kahn's topological sort** — deterministic execution order for `/api/simulate`.

### 9. Auto-Layout with Dagre

One-click layout uses Dagre with tuned spacing (240×84 node box, 50px horizontal / 60px vertical). Templates and AI-generated workflows are laid out through the same function at construction time, so hand-coded coordinates are gone and outputs stay pretty after schema changes.

---

## How to Test (5-Minute Walkthrough)

### Shortest path — generate with AI

1. Make sure `OPENAI_API_KEY` is set in `.env.local`
2. Click the **AI Assistant** floating button (bottom-right of the canvas)
3. Paste: *"Employee onboarding with document collection, IT account provisioning, manager approval, and a welcome email"*
4. Click **Generate** — a valid, configured workflow appears in ~2-3 seconds
5. Click **Test Workflow** → **Run Simulation** to see the execution timeline

### Shortcut — load a template

1. Click **Templates** in the toolbar → **Employee Onboarding**
2. Click any node to inspect its form
3. Click **Test Workflow** → **Run Simulation**

### Build a workflow from scratch

1. Drag **Start** from the left sidebar onto the canvas
2. Drag **Task**, **Approval**, **Automated Step** and connect them by dragging between handles
3. Drop an **End** node and connect the last step to it
4. Click each node to configure it
5. Click **Test Workflow** — the sandbox validates and simulates the graph

### Try the bonus features

- **Undo/Redo:** delete a node, press Ctrl+Z to get it back, Ctrl+Y to redo
- **Node version history:** edit a task's assignee twice, then open the collapsible "Version history" section at the bottom of the form panel → click **Restore** on an older version
- **Auto-layout:** scatter nodes messily, click the grid icon in the toolbar
- **Multi-workflow:** click the workflow name in the navbar → **+ New workflow** → confirm it's separate
- **Import / Export:** export JSON, clear canvas, re-import

### Intentionally break the graph (prove the validator works)

- Delete an edge between Start and the rest of the graph → red "unreachable" badge appears on affected nodes
- Add a second Start node → test panel shows "Workflow can only have one Start node"
- Connect End back to an earlier node (creating a loop) → "Workflow contains a cycle"

---

## Canvas Interactions Cheat Sheet


| Gesture                              | Action                         |
| ------------------------------------ | ------------------------------ |
| Left-drag on empty canvas            | Box-select multiple nodes      |
| Space + drag **or** right-click drag | Pan the canvas                 |
| Scroll wheel                         | Pan                            |
| Ctrl + scroll                        | Zoom                           |
| Shift / Ctrl + click                 | Add node to selection          |
| Delete / Backspace                   | Remove selected nodes or edges |
| Ctrl + Z                             | Undo                           |
| Ctrl + Y **or** Ctrl + Shift + Z     | Redo                           |
| Drag from handle to another handle   | Connect nodes                  |


---

## Tricky Bug Solved

**Maximum update depth exceeded (infinite render loop)**

The initial implementation had three overlapping selection mechanisms feeding into each other:

1. `selectNode()` called `setNodes()` to map `selected: true` onto the clicked node
2. React Flow's internal `useDirectStoreUpdater` synced this back via `onNodesChange` as a "select" change
3. `onSelectionChange` also called `selectNode()` whenever selection changed

Click a node → `selectNode()` → `setNodes()` → React Flow syncs → `onNodesChange` fires → selection change → `selectNode()` fires again → infinite loop.

**Fix:** Made `onSelectionChange` the single source of truth for selection. Removed the manual `selected: true` mapping from `selectNode()` — React Flow's `applyNodeChanges` already handles selection state internally. `selectNode(id)` now just updates our local `selectedNodeId` for the form panel, with no writes to React Flow's node state. All three selection APIs agree on who owns what.

A secondary variant of the same pattern bit the per-node history feature later: restoring a version was appending a "Restored from history" snapshot even when the current state already matched the newest history entry, producing visible duplicates. Fixed by deduping on deep-equal data, and adding a visible "Current" badge to whichever entry matches the live state so the Restore button can't become a no-op from the user's perspective.

---

## What I'd Add With More Time

- **Conditional branching** on Approval nodes — `approved → nodeA`, `rejected → nodeB`
- **Real backend** — swap `workflow-store.ts` to call Supabase (schema: `workflows(id, user_id, nodes, edges, node_history, updated_at)`), add auth with RLS (`user_id = auth.uid()`)
- **Real-time collaboration** via Supabase Realtime / Liveblocks
- **Conversational AI assistant** — follow-up multi-turn clarifying questions before generation (currently single-shot), plus an "edit with AI" mode that modifies an existing workflow from natural-language instructions
- **Tests** — Vitest for the validator + layout + history hooks, Playwright for the full create-edit-simulate flow
- **Workflow execution engine** — interpret the graph against real integrations (email, Slack, HRIS) through a job queue
- **Node-level RBAC** — admins edit, viewers only simulate

---

## Tech Stack

- **Framework:** Next.js 16 (App Router) · React 19 · TypeScript 5
- **Canvas:** React Flow 11
- **Styling:** Tailwind CSS v4 · shadcn/ui · Radix primitives
- **Layout:** Dagre
- **Icons:** Lucide React
- **Notifications:** Sonner
- **AI:** [AI SDK 6](https://sdk.vercel.ai) · `[@ai-sdk/openai](https://sdk.vercel.ai/providers/ai-sdk-providers/openai)` · `gpt-4o-mini` · Zod for structured output validation
- **Validation:** Hand-rolled graph algorithms (DFS · BFS · Kahn)
- **Persistence:** `localStorage` (registry + node history) — intentionally mock-only per the case study spec

---

## Environment Variables


| Variable         | Required                | Purpose                                   | Where to get it                                                                                                                                                                                                                                                            |
| ---------------- | ----------------------- | ----------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `OPENAI_API_KEY` | Only for the AI feature | Authenticates AI SDK calls to GPT-4o-mini | [https://docs.google.com/document/d/15f8W5dztOyq5qjpPS1zu5vbCrtiO8O8L/edit?usp=sharing&ouid=103511385425695784623&rtpof=true&sd=true](https://docs.google.com/document/d/15f8W5dztOyq5qjpPS1zu5vbCrtiO8O8L/edit?usp=sharing&ouid=103511385425695784623&rtpof=true&sd=true) |


See `[.env.example](./.env.example)` for the template. Copy it to `.env.local` and fill in your key. `.env.local` is already in `.gitignore`.

---

## Scripts

```bash
pnpm install      # Install dependencies
pnpm dev          # Dev server at http://localhost:3000
pnpm build        # Production build
pnpm start        # Start production server
pnpm lint         # ESLint
```

