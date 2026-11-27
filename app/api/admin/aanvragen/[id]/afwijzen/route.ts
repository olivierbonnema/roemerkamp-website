import { NextRequest, NextResponse } from "next/server"
import { FieldValue } from "firebase-admin/firestore"
import { adminAuth, adminDb } from "@/lib/firebase-admin"
import { logActivity } from "@/lib/activity-log"
import { sendEmail, sendEmailFromMailbox } from "@/lib/brevo"
import { buildAfwijzingMail, naamUitEmail, sanitizeAfwijzing } from "@/lib/afwijzing"

// Admin-only: reject an aanvraag with one or more reasons. The adviser who
// submitted it gets a mail from the colleague who clicks (lib/afwijzing.ts).
//
// POST body: { redenen, andersTekst?, toelichting?, afzenderNaam?, actie }
//   actie "voorbeeld"  the mail as it would leave, nothing is sent or stored
//   actie "eigen"      send from the colleague's own mailbox, then reject
//   actie "portaal"    send from the portal mailbox, replies go to the colleague
//   actie "geen"       reject without a mail (an aanvraag without an adviser)
//
// This is the one place where a change of status sends a mail, and only because
// a colleague asks for it here. The status dropdown and the automatic step to
// "In behandeling" stay silent (Tech/Aanvraag Status in the wiki).

const ADMIN_DOMAIN = (process.env.ADMIN_DOMAIN || "").toLowerCase()
// Only the name before the address is used: sendEmail sends from the portal mailbox.
const FROM_EMAIL = process.env.FROM_EMAIL || "noreply@nonbancaireleningen.nl"

// How long a send that is under way keeps a second one out.
const CLAIM_MS = 2 * 60 * 1000

const ACTIES = ["voorbeeld", "eigen", "portaal", "geen"] as const
type Actie = (typeof ACTIES)[number]

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

const text = (v: unknown) => (typeof v === "string" ? v.trim() : "")

function toMillis(v: unknown): number {
  if (v instanceof Date) return v.getTime()
  if (v && typeof v === "object" && typeof (v as { toDate?: unknown }).toDate === "function") {
    try { return (v as { toDate: () => Date }).toDate().getTime() } catch { return 0 }
  }
  return 0
}

// The adviser to write to: the partner who submitted the aanvraag. An aanvraag a
// colleague entered has no adviser, and the client is never written to.
function adviserOf(a: Record<string, unknown>): { email: string; uid: string } | null {
  const email = text(a.userEmail).toLowerCase()
  if (a.submittedByRole !== "partner" || !email.includes("@")) return null
  if (ADMIN_DOMAIN && email.endsWith(`@${ADMIN_DOMAIN}`)) return null
  return { email, uid: text(a.userId) }
}

async function accountName(uid: string): Promise<string> {
  if (!uid) return ""
  try {
    return text((await adminAuth.getUser(uid)).displayName)
  } catch {
    return ""
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await verifyAdmin(req)
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const adminEmail = text(admin.email).toLowerCase()

  const { id } = await params
  let body: Record<string, unknown>
  try {
    const parsed = await req.json()
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error("not an object")
    body = parsed
  } catch {
    return NextResponse.json({ error: "Ongeldige invoer." }, { status: 400 })
  }
  const actie = body.actie as Actie
  if (!ACTIES.includes(actie)) return NextResponse.json({ error: "Ongeldige invoer." }, { status: 400 })

  const checked = sanitizeAfwijzing(body)
  if (!checked.ok) return NextResponse.json({ error: checked.error }, { status: 400 })
  const invoer = checked.invoer
  // The signature always carries a name: what was typed, else the name of the
  // account, else the first part of the address.
  if (!invoer.afzenderNaam) invoer.afzenderNaam = text((admin as { name?: unknown }).name) || naamUitEmail(adminEmail)

  const ref = adminDb.collection("aanvragen").doc(id)

  try {
    const snap = await ref.get()
    if (!snap.exists) return NextResponse.json({ error: "Aanvraag niet gevonden." }, { status: 404 })
    const a = snap.data() || {}
    const adviser = adviserOf(a)

    const mail = buildAfwijzingMail({
      adviseurNaam: adviser ? await accountName(adviser.uid) : "",
      klantNaam: text(a.naam) || text(a.bedrijfsnaam),
      objectAdres: text(a.objectAdres),
      objectPlaats: text(a.objectPlaats),
      invoer,
    })

    if (actie === "voorbeeld") {
      return NextResponse.json({
        naar: adviser?.email ?? null,
        van: adminEmail,
        afzenderNaam: invoer.afzenderNaam,
        subject: mail.subject,
        html: mail.html,
        alAfgewezen: !!(a.afwijzing && typeof a.afwijzing === "object"),
      })
    }

    if (actie === "geen" && adviser) {
      return NextResponse.json({ error: "Deze aanvraag heeft een adviseur. Kies een afwijzing met mail, of zet de status met de hand op Afgewezen." }, { status: 400 })
    }
    if (actie !== "geen" && !adviser) {
      return NextResponse.json({ error: "Deze aanvraag heeft geen adviseur om te mailen." }, { status: 400 })
    }

    // One rejection per aanvraag, and one send at a time: the claim keeps a
    // second click or a second colleague out while the mail is under way.
    const claim = await adminDb.runTransaction(async (tx) => {
      const now = await tx.get(ref)
      if (!now.exists) return "weg" as const
      const d = now.data() || {}
      if (d.afwijzing && typeof d.afwijzing === "object") return "al" as const
      if (Date.now() - toMillis(d.afwijzingBezig) < CLAIM_MS) return "bezig" as const
      tx.update(ref, { afwijzingBezig: new Date() })
      return "ok" as const
    })
    if (claim === "weg") return NextResponse.json({ error: "Aanvraag niet gevonden." }, { status: 404 })
    if (claim === "al") return NextResponse.json({ error: "Deze aanvraag is al afgewezen. Er is geen tweede mail verstuurd." }, { status: 409 })
    if (claim === "bezig") return NextResponse.json({ error: "Een collega is deze aanvraag op dit moment aan het afwijzen." }, { status: 409 })

    if (adviser && actie !== "geen") {
      try {
        if (actie === "eigen") {
          await sendEmailFromMailbox({ mailbox: adminEmail, to: adviser.email, subject: mail.subject, html: mail.html, type: "aanvraag_afgewezen" })
        } else {
          await sendEmail({
            from: `${invoer.afzenderNaam} | Lange & Partners <${FROM_EMAIL}>`,
            to: adviser.email,
            subject: mail.subject,
            html: mail.html,
            type: "aanvraag_afgewezen",
            replyTo: adminEmail,
          })
        }
      } catch (err) {
        console.error(`[admin/afwijzen] mail (${actie}) failed:`, err)
        await ref.update({ afwijzingBezig: FieldValue.delete() }).catch(() => {})
        if (actie === "eigen") {
          return NextResponse.json({
            code: "eigen_mailbox",
            error: "Versturen uit uw eigen mailbox is niet gelukt. Er is niets verstuurd en de aanvraag is niet afgewezen. Waarschijnlijk staat Microsoft 365 het portaal nog niet toe om uit uw mailbox te versturen.",
          }, { status: 502 })
        }
        return NextResponse.json({ error: "De mail versturen is niet gelukt. Er is niets verstuurd en de aanvraag is niet afgewezen." }, { status: 502 })
      }
    }

    // The mail is out (or there was none to send): from here on the rejection stands.
    const afwijzing = {
      redenen: invoer.redenen,
      andersTekst: invoer.andersTekst,
      toelichting: invoer.toelichting,
      door: adminEmail,
      doorNaam: invoer.afzenderNaam,
      op: new Date(),
      mailNaar: adviser && actie !== "geen" ? adviser.email : "",
      mailVia: actie,
      onderwerp: actie === "geen" ? "" : mail.subject,
    }
    try {
      await ref.update({ status: "afgewezen", afwijzing, afwijzingBezig: FieldValue.delete(), updatedAt: new Date(), updatedBy: adminEmail })
    } catch (err) {
      console.error("[admin/afwijzen] the mail went out but the rejection was not stored:", err)
      return NextResponse.json({
        error: actie === "geen"
          ? "De afwijzing opslaan is niet gelukt."
          : "De mail is verstuurd, maar de afwijzing opslaan is niet gelukt. Zet de status met de hand op Afgewezen en verstuur de mail niet opnieuw.",
        mailVerstuurd: actie !== "geen",
      }, { status: 500 })
    }

    await logActivity({
      action: "status_changed",
      userId: admin.uid,
      userEmail: adminEmail,
      targetId: id,
      targetType: "aanvraag",
      details: {
        status: "afgewezen",
        how: actie === "geen" ? "afwijzing zonder mail" : actie === "eigen" ? "afwijzing met mail uit eigen mailbox" : "afwijzing met mail uit de portaalmailbox",
        redenen: invoer.redenen.join(", "),
      },
    })

    return NextResponse.json({ success: true, status: "afgewezen", mailNaar: afwijzing.mailNaar, mailVia: actie })
  } catch (err) {
    console.error("[admin/afwijzen] failed:", err)
    return NextResponse.json({ error: "Afwijzen is niet gelukt." }, { status: 500 })
  }
}
