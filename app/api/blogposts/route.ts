import { NextResponse } from "next/server"
import { adminDb } from "@/lib/firebase-admin"

export async function GET() {
  try {
    const snap = await adminDb
      .collection("blogposts")
      .where("status", "==", "gepubliceerd")
      .orderBy("publishedAt", "desc")
      .get()

    const posts = snap.docs.map((doc) => {
      const data = doc.data()
      return {
        id: doc.id,
        title: data.title,
        slug: data.slug,
        excerpt: data.excerpt,
        author: data.author,
        category: data.category,
        imageDataUrl: data.imageDataUrl || "",
        imageAlt: data.imageAlt || "",
        publishedAt: data.publishedAt?.toDate?.()?.toISOString() ?? null,
      }
    })

    return NextResponse.json({ posts })
  } catch {
    return NextResponse.json({ error: "Berichten ophalen mislukt." }, { status: 500 })
  }
}
