import { NextRequest, NextResponse } from "next/server"
import { adminAuth, adminDb } from "@/lib/firebase-admin"
import { FieldValue } from "firebase-admin/firestore"

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

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await verifyAdmin(req)
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  try {
    const doc = await adminDb.collection("blogposts").doc(id).get()
    if (!doc.exists) return NextResponse.json({ error: "Niet gevonden." }, { status: 404 })

    const data = doc.data()!
    return NextResponse.json({
      post: {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate?.()?.toISOString() ?? null,
        updatedAt: data.updatedAt?.toDate?.()?.toISOString() ?? null,
        publishedAt: data.publishedAt?.toDate?.()?.toISOString() ?? null,
      },
    })
  } catch {
    return NextResponse.json({ error: "Blogpost ophalen mislukt." }, { status: 500 })
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await verifyAdmin(req)
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  try {
    const body = await req.json()
    const docRef = adminDb.collection("blogposts").doc(id)
    const existing = await docRef.get()
    if (!existing.exists) return NextResponse.json({ error: "Niet gevonden." }, { status: 404 })

    const oldData = existing.data()!
    const wasPublished = oldData.status === "gepubliceerd"
    const isNowPublished = body.status === "gepubliceerd"

    const updateData: Record<string, unknown> = {
      title: body.title ?? oldData.title,
      slug: body.slug ?? oldData.slug,
      excerpt: body.excerpt ?? oldData.excerpt,
      content: body.content ?? oldData.content,
      author: body.author ?? oldData.author,
      category: body.category ?? oldData.category,
      tags: body.tags ?? oldData.tags,
      imageAlt: body.imageAlt ?? oldData.imageAlt,
      status: body.status ?? oldData.status,
      metaTitle: body.metaTitle ?? oldData.metaTitle,
      metaDescription: body.metaDescription ?? oldData.metaDescription,
      updatedAt: FieldValue.serverTimestamp(),
      updatedBy: admin.email,
    }

    // Only update image if explicitly provided
    if (body.imageDataUrl !== undefined) {
      updateData.imageDataUrl = body.imageDataUrl
    }

    // Set publishedAt when first published
    if (isNowPublished && !wasPublished) {
      updateData.publishedAt = FieldValue.serverTimestamp()
    }

    await docRef.update(updateData)

    // Log activity
    await adminDb.collection("activity").add({
      action: isNowPublished && !wasPublished ? "blogpost_published" : "blogpost_updated",
      entity: "blogpost",
      entityId: id,
      entityName: body.title || oldData.title,
      performedBy: admin.email,
      timestamp: FieldValue.serverTimestamp(),
    })

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: "Blogpost bijwerken mislukt." }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await verifyAdmin(req)
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  try {
    const doc = await adminDb.collection("blogposts").doc(id).get()
    const title = doc.exists ? doc.data()?.title : "Onbekend"

    await adminDb.collection("blogposts").doc(id).delete()

    await adminDb.collection("activity").add({
      action: "blogpost_deleted",
      entity: "blogpost",
      entityId: id,
      entityName: title,
      performedBy: admin.email,
      timestamp: FieldValue.serverTimestamp(),
    })

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: "Blogpost verwijderen mislukt." }, { status: 500 })
  }
}
