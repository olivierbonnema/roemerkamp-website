import { NextRequest, NextResponse } from "next/server"
import { adminDb } from "@/lib/firebase-admin"

export async function GET(_req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  try {
    const snap = await adminDb
      .collection("blogposts")
      .where("slug", "==", slug)
      .where("status", "==", "gepubliceerd")
      .limit(1)
      .get()

    if (snap.empty) {
      return NextResponse.json({ error: "Niet gevonden." }, { status: 404 })
    }

    const doc = snap.docs[0]
    const data = doc.data()

    return NextResponse.json({
      post: {
        id: doc.id,
        title: data.title,
        slug: data.slug,
        excerpt: data.excerpt,
        content: data.content,
        author: data.author,
        category: data.category,
        tags: data.tags || [],
        imageDataUrl: data.imageDataUrl || "",
        imageAlt: data.imageAlt || "",
        metaTitle: data.metaTitle || "",
        metaDescription: data.metaDescription || "",
        publishedAt: data.publishedAt?.toDate?.()?.toISOString() ?? null,
        updatedAt: data.updatedAt?.toDate?.()?.toISOString() ?? null,
      },
    })
  } catch {
    return NextResponse.json({ error: "Bericht ophalen mislukt." }, { status: 500 })
  }
}
