import { NextRequest, NextResponse } from "next/server"
import { adminAuth, adminDb } from "@/lib/firebase-admin"

function isAdminEmail(email: string) {
  const domain = (process.env.ADMIN_DOMAIN || "").toLowerCase()
  const emails = (process.env.NEXT_PUBLIC_ADMIN_EMAILS || "")
    .toLowerCase().split(",").map(e => e.trim()).filter(Boolean)
  const e = email.toLowerCase()
  return (!!domain && e.endsWith(`@${domain}`)) || emails.includes(e)
}

export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization")
  if (!auth?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  let uid: string
  try {
    const decoded = await adminAuth.verifyIdToken(auth.slice(7))
    uid = decoded.uid
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const snap = await adminDb
      .collection("aanvragen")
      .where("userId", "==", uid)
      .get()

    const aanvragen = snap.docs
      .map((doc) => {
        const data = doc.data()
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate?.()?.toISOString() ?? null,
          updatedAt: data.updatedAt?.toDate?.()?.toISOString() ?? null,
        }
      })
      .sort((a, b) => {
        if (!a.createdAt) return 1
        if (!b.createdAt) return -1
        return b.createdAt.localeCompare(a.createdAt)
      })
    return NextResponse.json({ aanvragen })
  } catch {
    return NextResponse.json({ error: "Aanvragen ophalen mislukt." }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  const authHeader = req.headers.get("authorization")
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  let email: string
  try {
    const decoded = await adminAuth.verifyIdToken(authHeader.slice(7))
    email = decoded.email ?? ""
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  if (!isAdminEmail(email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const id = new URL(req.url).searchParams.get("id")
  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 })
  }

  try {
    await adminDb.collection("aanvragen").doc(id).delete()
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: "Verwijderen mislukt." }, { status: 500 })
  }
}
