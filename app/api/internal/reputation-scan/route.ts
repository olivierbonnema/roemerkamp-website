import { NextRequest, NextResponse } from "next/server"
import { runReputationScan } from "@/lib/reputation-scan"

export const maxDuration = 300

export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-internal-secret")
  const expected = process.env.TRIGGER_SECRET
  if (!expected || secret !== expected) {
    console.error("Reputation scan auth failed — TRIGGER_SECRET:", expected ? "set" : "MISSING", "header:", secret ? "present" : "missing")
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { aanvraagId, subject } = await req.json()
  if (!aanvraagId || !subject) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 })
  }

  await runReputationScan(aanvraagId, subject)

  return NextResponse.json({ ok: true })
}
