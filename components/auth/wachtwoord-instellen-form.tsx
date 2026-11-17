"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { verifyPasswordResetCode, confirmPasswordReset } from "firebase/auth"
import { auth } from "@/lib/firebase"
import { EntryPage, SectionTitle, ui } from "@/components/portaal/portal-ui"

// Branded "set a new password" page. Used by the invite mails and the
// "wachtwoord vergeten" mails (see lib/auth-links.ts). It completes the reset
// with the client SDK, which works from any domain, so we don't depend on
// Firebase's (misconfigured) action handler.
//
// Two kinds of link arrive here:
//   ?oobCode=...       "wachtwoord vergeten": the Firebase code itself (1 hour)
//   ?uitnodiging=...   an invite: our own token, valid for 14 days. It is
//                      traded for a fresh Firebase code at /api/invite/redeem
//                      (lib/invite-token.ts), again when the page was left
//                      open for more than an hour.
type InviteProblem = "" | "expired" | "used" | "invalid"

async function redeemInvite(token: string, done = false): Promise<{ oobCode?: string; error?: string }> {
  try {
    const res = await fetch("/api/invite/redeem", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(done ? { token, done: true } : { token }),
    })
    const data = await res.json().catch(() => ({}))
    return res.ok ? data : { error: data.error || "invalid" }
  } catch {
    return { error: "server" }
  }
}

export function WachtwoordInstellenForm() {
  const params = useSearchParams()
  const inviteToken = params.get("uitnodiging") || ""
  const urlCode = params.get("oobCode") || ""
  const [oobCode, setOobCode] = useState(urlCode)
  const [inviteProblem, setInviteProblem] = useState<InviteProblem>("")

  const [email, setEmail] = useState("")
  const [verifying, setVerifying] = useState(true)
  const [invalid, setInvalid] = useState(false)
  const [pw, setPw] = useState("")
  const [pw2, setPw2] = useState("")
  const [error, setError] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)

  useEffect(() => {
    let cancelled = false
    const fail = (problem: InviteProblem = "") => {
      if (cancelled) return
      setInviteProblem(problem)
      setInvalid(true)
      setVerifying(false)
    }
    ;(async () => {
      let code = urlCode
      if (inviteToken) {
        const r = await redeemInvite(inviteToken)
        if (cancelled) return
        if (!r.oobCode) { fail(r.error === "expired" || r.error === "used" ? r.error : "invalid"); return }
        code = r.oobCode
        setOobCode(code)
      }
      if (!code) { fail(); return }
      try {
        const mail = await verifyPasswordResetCode(auth, code)
        if (!cancelled) { setEmail(mail); setVerifying(false) }
      } catch {
        fail()
      }
    })()
    return () => { cancelled = true }
  }, [inviteToken, urlCode])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    if (pw.length < 8) { setError("Gebruik minimaal 8 tekens."); return }
    if (pw !== pw2) { setError("De wachtwoorden komen niet overeen."); return }
    setSubmitting(true)
    try {
      try {
        await confirmPasswordReset(auth, oobCode, pw)
      } catch (err: unknown) {
        // Invite page left open for more than an hour: the Firebase code behind
        // it has expired, but the invite itself is still good. Get a fresh code
        // and try once more.
        const code = (err as { code?: string }).code
        if (!inviteToken || (code !== "auth/expired-action-code" && code !== "auth/invalid-action-code")) throw err
        const r = await redeemInvite(inviteToken)
        if (!r.oobCode) throw err
        setOobCode(r.oobCode)
        await confirmPasswordReset(auth, r.oobCode, pw)
      }
      // The invite has done its job: make the link stop working.
      if (inviteToken) await redeemInvite(inviteToken, true)
      setDone(true)
    } catch (err: unknown) {
      const code = (err as { code?: string }).code
      if (code === "auth/expired-action-code" || code === "auth/invalid-action-code") {
        setError("Deze link is verlopen of al gebruikt. Vraag een nieuwe aan via 'Wachtwoord vergeten'.")
      } else if (code === "auth/weak-password") {
        setError("Dit wachtwoord is te zwak. Kies een sterker wachtwoord.")
      } else {
        setError(`Er ging iets mis${code ? ` (${code})` : ""}. Probeer het opnieuw.`)
      }
    } finally {
      setSubmitting(false)
    }
  }

  // Built like the login screen (EntryPage in components/portaal/portal-ui.tsx).
  // The page head names the screen and, once the link is checked, whose
  // password it is. What the link turned out to be stands below it.
  return (
    <EntryPage
      title="Wachtwoord instellen"
      intro={!verifying && !invalid && !done ? `Voor ${email}` : undefined}
      path="/wachtwoord-instellen"
    >
      {verifying ? (
        <div className="flex justify-center py-12">
          <div className={`${ui.spinner} w-8 h-8 border-2`} />
        </div>
      ) : invalid ? (
        <div>
          <SectionTitle>
            {inviteProblem === "used" ? "Account al geactiveerd" : inviteProblem === "expired" ? "Uitnodiging verlopen" : "Link ongeldig"}
          </SectionTitle>
          <p className={`${ui.text} mt-3`}>
            {inviteProblem === "used"
              ? "Via deze uitnodiging is al een wachtwoord ingesteld. U kunt inloggen. Weet u het wachtwoord niet meer, kies dan \u2018Wachtwoord vergeten\u2019 op de inlogpagina."
              : inviteProblem === "expired"
                ? "Deze uitnodiging is niet meer geldig. Kies \u2018Wachtwoord vergeten\u2019 op de inlogpagina en vul uw e-mailadres in; u ontvangt dan direct een nieuwe link."
                : "Deze link is verlopen of al gebruikt. Vraag een nieuwe aan via \u2018Wachtwoord vergeten\u2019 op de inlogpagina."}
          </p>
          <Link href="/login" className={`${ui.link} inline-block mt-6`}>
            Naar inloggen
          </Link>
        </div>
      ) : done ? (
        <div>
          <SectionTitle>Wachtwoord ingesteld</SectionTitle>
          <p className={`${ui.text} mt-3`}>
            U kunt nu inloggen. De eerste keer stelt u eenmalig tweestapsverificatie in.
          </p>
          <Link href="/login" className={`${ui.buttonPrimary} w-full mt-6`}>
            Naar inloggen
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className={ui.label}>Nieuw wachtwoord</label>
            <input
              type="password" value={pw} onChange={(e) => setPw(e.target.value)} placeholder="Minimaal 8 tekens" autoFocus
              className={`${ui.field} ${ui.fieldOk}`}
            />
          </div>
          <div>
            <label className={ui.label}>Herhaal wachtwoord</label>
            <input
              type="password" value={pw2} onChange={(e) => setPw2(e.target.value)} placeholder="Herhaal uw wachtwoord"
              className={`${ui.field} ${ui.fieldOk}`}
            />
          </div>
          {error && <p className={ui.error} role="alert">{error}</p>}
          <button
            type="submit" disabled={submitting || !pw || !pw2}
            className={`w-full ${ui.buttonPrimary}`}
          >
            {submitting ? "Bezig…" : "Wachtwoord instellen"}
          </button>
        </form>
      )}
    </EntryPage>
  )
}
