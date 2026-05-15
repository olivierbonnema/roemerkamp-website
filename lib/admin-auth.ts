import { NextRequest } from "next/server"
import { adminAuth } from "@/lib/firebase-admin"

const ADMIN_DOMAIN = (process.env.ADMIN_DOMAIN || "").toLowerCase()

export async function verifyAdmin(req: NextRequest) {
  const authHeader = req.headers.get("authorization")
  if (!authHeader?.startsWith("Bearer ")) return null
  try {
    const decoded = await adminAuth.verifyIdToken(authHeader.slice(7))
    if (!ADMIN_DOMAIN || !decoded.email?.toLowerCase().endsWith(`@${ADMIN_DOMAIN}`)) return null
    return decoded
  } catch {
    return null
  }
}
