import { NextRequest, NextResponse } from "next/server"
import { adminAuth } from "@/lib/firebase-admin"
import { logActivity } from "@/lib/activity-log"

// Records a "login" event for the signed-in user in the activity log.
// Called (fire-and-forget) by the client right after a successful sign-in, so
// the admin can see each user's login history. The caller is identified by
// their own ID token — a login can only ever be recorded for oneself.
export async function POST(req: NextRequest) {
  const auth = req.headers.get("authorization")
  if (!auth?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  try {
    const decoded = await adminAuth.verifyIdToken(auth.slice(7))
    await logActivity({
      action: "login",
      userId: decoded.uid,
      userEmail: decoded.email || "",
      targetType: "user",
    })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
}
