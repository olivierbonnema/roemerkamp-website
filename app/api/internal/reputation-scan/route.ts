import { NextRequest, NextResponse } from "next/server"
import { runReputationScan } from "@/lib/reputation-scan"

export const maxDuration = 300

export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-internal-secret")
  if (secret !== process.env.TRIGGER_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { aanvraagId, subject } = await req.json()
  if (!aanvraagId || !subject) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 })
  }

  await runReputationScan(aanvraagId, subject)

  return NextResponse.json({ ok: true })
}
