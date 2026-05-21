import { NextRequest, NextResponse } from "next/server"
import { adminAuth, adminDb } from "@/lib/firebase-admin"
import { FieldValue } from "firebase-admin/firestore"
import { logActivity } from "@/lib/activity-log"

const ADMIN_DOMAIN = (process.env.ADMIN_DOMAIN || "").toLowerCase()

async function verifyAdmin(req: NextRequest) {
  const auth = req.headers.get("authorization")
  if (!auth?.startsWith("Bearer ")) return null
  try {
    const decoded = await adminAuth.verifyIdToken(auth.slice(7))
    if (!ADMIN_DOMAIN || !decoded.email?.toLowerCase().endsWith(`@${ADMIN_DOMAIN}`)) return null
    return decoded
  } catch {
    return null
  }
}

export async function GET(req: NextRequest) {
  const admin = await verifyAdmin(req)
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const snap = await adminDb.collection("blogposts").orderBy("createdAt", "desc").get()
    const posts = snap.docs.map((doc) => {
      const data = doc.data()
      return {
        id: doc.id,
        ...data,
        // Don't send full content in list view
        content: undefined,
        // Don't send full image data in list view
        imageDataUrl: data.imageDataUrl ? "[has image]" : "",
        createdAt: data.createdAt?.toDate?.()?.toISOString() ?? null,
        updatedAt: data.updatedAt?.toDate?.()?.toISOString() ?? null,
        publishedAt: data.publishedAt?.toDate?.()?.toISOString() ?? null,
      }
    })
    return NextResponse.json({ posts })
  } catch {
    return NextResponse.json({ error: "Blogposts ophalen mislukt." }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const admin = await verifyAdmin(req)
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const body = await req.json()

    const slug = body.slug || body.title
      ?.toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .slice(0, 80) || "untitled"

    // Check slug uniqueness
    const existing = await adminDb.collection("blogposts").where("slug", "==", slug).get()
    if (!existing.empty) {
      return NextResponse.json({ error: "Er bestaat al een bericht met deze URL. Kies een andere titel of slug." }, { status: 400 })
    }

    const postData = {
      title: body.title || "",
      slug,
      excerpt: body.excerpt || "",
      content: body.content || "",
      author: body.author || "Marco Lange",
      category: body.category || "Algemeen",
      tags: body.tags || [],
      imageDataUrl: body.imageDataUrl || "",
      imageAlt: body.imageAlt || "",
      status: body.status || "concept",
      metaTitle: body.metaTitle || "",
      metaDescription: body.metaDescription || "",
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
      publishedAt: body.status === "gepubliceerd" ? FieldValue.serverTimestamp() : null,
      createdBy: admin.email,
    }

    const ref = await adminDb.collection("blogposts").add(postData)

    // Log activity
    await logActivity({
      action: "blogpost_created",
      userId: admin.uid,
      userEmail: admin.email || "",
      targetId: ref.id,
      targetType: "aanvraag",
      details: { title: body.title || "" },
    })

    return NextResponse.json({ id: ref.id, slug })
  } catch {
    return NextResponse.json({ error: "Blogpost aanmaken mislukt." }, { status: 500 })
  }
}
