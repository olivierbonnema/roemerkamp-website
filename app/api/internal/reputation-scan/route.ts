import { NextRequest, NextResponse } from "next/server"
import { runBackgroundCheck } from "@/lib/reputation-scan"

export const maxDuration = 300

// Internal worker for background checks. Both the standalone Checks tab and the
// enquiry "Start achtergrondcheck" button create a `background_checks` doc and
// then call this route with its id; runBackgroundCheck does the actual scan and
// writes the result (mirroring onto the linked aanvraag when present).
export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-internal-secret")
  const expected = process.env.TRIGGER_SECRET
  if (!expected || secret !== expected) {
    console.error("Reputation scan auth failed - TRIGGER_SECRET:", expected ? "set" : "MISSING", "header:", secret ? "present" : "missing")
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { checkId } = await req.json()
  if (!checkId) {
    return NextResponse.json({ error: "checkId required" }, { status: 400 })
  }

  try {
    await runBackgroundCheck(checkId)
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error("Background check failed:", err)
    return NextResponse.json({ error: err instanceof Error ? err.message : "Scan failed" }, { status: 500 })
  }
}
