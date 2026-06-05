import { NextRequest, NextResponse } from "next/server"
import { adminDb } from "@/lib/firebase-admin"
import { verifyAdmin } from "@/lib/admin-auth"

export async function GET(req: NextRequest) {
  const admin = await verifyAdmin(req)
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const limit = Math.min(parseInt(searchParams.get("limit") || "50", 10), 200)
  const userId = searchParams.get("userId")

  try {
    // Per-user view (userId set) queries on userId and sorts in JS to avoid a
    // composite index; the global view uses the indexed orderBy.
    const snap = userId
      ? await adminDb.collection("activity_log").where("userId", "==", userId).get()
      : await adminDb.collection("activity_log").orderBy("createdAt", "desc").limit(limit).get()

    const entries = snap.docs
      .map((doc) => {
        const data = doc.data()
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate?.()?.toISOString() ?? null,
        }
      })
      .sort((a, b) => String(b.createdAt ?? "").localeCompare(String(a.createdAt ?? "")))
      .slice(0, limit)

    return NextResponse.json({ entries })
  } catch {
    return NextResponse.json({ error: "Activiteitenlog ophalen mislukt." }, { status: 500 })
  }
}
