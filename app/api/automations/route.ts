import { NextResponse } from "next/server"
import { MOCK_AUTOMATED_ACTIONS } from "@/lib/workflow/mock-data"

export async function GET() {
  // simulate network latency
  await new Promise((r) => setTimeout(r, 200))
  return NextResponse.json(MOCK_AUTOMATED_ACTIONS)
}
