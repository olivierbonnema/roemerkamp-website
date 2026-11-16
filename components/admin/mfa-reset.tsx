"use client"

// The two-factor block of one account in Beheer: is 2FA set up, and a way to
// clear it so that the owner sets it up again at the next login.
//
// For someone who can no longer get to the code (a new phone, a removed app).
// Before this the only way out was to delete the account and invite again.
//
// Server: app/api/admin/reset-mfa. The status comes with app/api/admin/list-users.
// Used by: components/admin/admin-partners.tsx (the "Beheren" window, MfaPanel)
// and components/admin/admin-users.tsx (the link per account, MfaDialog).

import { useState } from "react"
import { auth } from "@/lib/firebase"

export interface MfaAccount {
  uid: string
  email: string
  displayName?: string
  role?: string
  /** Firebase Auth could be read (see list-users). Without it the status is not known. */
  loginKnown?: boolean
  /** The users doc has no login account behind it. */
  authMissing?: boolean
  lastSignInAt?: string | null
  mfaEnrolled?: boolean
  mfaEnrolledAt?: string | null
  /** The account of an admin. The server does not clear the 2FA of those. */
  isAdmin?: boolean
  /** The last time an admin cleared the 2FA of this account, and who did. */
  mfaResetAt?: string | null
  mfaResetBy?: string
}

function fmt(iso?: string | null) {
  if (!iso) return ""
  const d = new Date(iso)
  if (isNaN(d.getTime())) return ""
  return d.toLocaleString("nl-NL", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })
}

/** How the texts call the owner of the account. */
function ownerWord(a: MfaAccount) {
  return a.role === "partner" ? "adviseur" : "gebruiker"
}

/** One line on where the account stands. */
export function mfaStatusText(a: MfaAccount): string {
  if (!a.loginKnown) return "De status is nu niet op te vragen."
  if (a.authMissing) return "Dit account heeft geen inlogaccount."
  if (a.mfaEnrolled) return fmt(a.mfaEnrolledAt) ? `Ingesteld op ${fmt(a.mfaEnrolledAt)}.` : "Ingesteld."
  return a.lastSignInAt
    ? `Niet ingesteld. Bij de volgende keer inloggen krijgt de ${ownerWord(a)} de QR-code om het in te stellen.`
    : "Nog niet ingesteld. Dat gebeurt bij de eerste keer inloggen."
}

export function MfaPanel({ account, onChange }: {
  account: MfaAccount
  // Called with what changed on the account, for the list that holds it.
  onChange: (change: Partial<MfaAccount>) => void
}) {
  const [confirming, setConfirming] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")
  // What the last click led to: "cleared", or "nothing" when there was nothing to clear.
  const [result, setResult] = useState<"" | "cleared" | "nothing">("")
  const [signedOut, setSignedOut] = useState(true)

  const who = ownerWord(account)
  const known = !!account.loginKnown && !account.authMissing
  const canClear = known && !!account.mfaEnrolled && !account.isAdmin
  // Cleared and not set up again yet: the owner still has the steps to do.
  const waiting = known && !account.mfaEnrolled && !!fmt(account.mfaResetAt)

  async function clear() {
    setBusy(true)
    setError("")
    try {
      const token = await auth.currentUser?.getIdToken()
      const res = await fetch("/api/admin/reset-mfa", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ uid: account.uid }),
      })
      const data = await res.json().catch(() => ({}))
      if (res.status === 401) {
        setError("U bent niet meer ingelogd als beheerder. Log opnieuw in en probeer het nog eens.")
        return
      }
      if (!res.ok || !data.success) {
        setError(data.error || "Wissen mislukt. Probeer het opnieuw.")
        return
      }
      setConfirming(false)
      if (data.removed === 0) {
        // The list was behind: the account had no 2FA any more.
        setResult("nothing")
        onChange({ mfaEnrolled: false, mfaEnrolledAt: null })
        return
      }
      setSignedOut(data.signedOut !== false)
      setResult("cleared")
      onChange({ mfaEnrolled: false, mfaEnrolledAt: null, mfaResetAt: data.mfaResetAt || new Date().toISOString(), mfaResetBy: data.mfaResetBy || "" })
    } catch {
      setError("Wissen mislukt. Probeer het opnieuw.")
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="border border-gray-200 rounded-lg p-4" data-mfa-panel>
      <h4 className="text-sm font-semibold text-[#311E86] font-sans mb-1">Tweestapsverificatie</h4>
      <p className="text-[13px] text-gray-800 font-sans" data-mfa-status>{mfaStatusText(account)}</p>
      {fmt(account.mfaResetAt) && (
        <p className="text-[12px] text-gray-500 font-sans mt-0.5">
          Laatst gewist op {fmt(account.mfaResetAt)}{account.mfaResetBy ? ` door ${account.mfaResetBy}` : ""}.
        </p>
      )}

      {result === "cleared" && (
        <p className="mt-3 rounded-lg bg-emerald-50 border border-emerald-200 px-3 py-2 text-[13px] font-medium text-emerald-900 font-sans" role="status">
          De tweestapsverificatie is gewist.
          {!signedOut && <span className="block font-normal mt-0.5">Uitloggen op andere apparaten is niet gelukt. Voor het opnieuw instellen maakt dat niet uit.</span>}
        </p>
      )}
      {result === "nothing" && (
        <p className="mt-3 text-[13px] text-gray-600 font-sans" role="status">Dit account had geen tweestapsverificatie meer. Er is niets gewijzigd.</p>
      )}

      {waiting && (
        <div className="mt-3 text-[13px] text-gray-800 font-sans" data-mfa-steps>
          <p>Geef de {who} deze drie stappen door.</p>
          <ol className="list-decimal pl-5 mt-1 space-y-0.5">
            <li>De oude regel Lange &amp; Partners uit de authenticator-app verwijderen.</li>
            <li>Inloggen met e-mailadres en wachtwoord.</li>
            <li>De nieuwe QR-code scannen en de code van zes cijfers invullen.</li>
          </ol>
        </div>
      )}

      {known && !!account.mfaEnrolled && account.isAdmin && (
        <p className="text-[12px] text-gray-500 font-sans mt-2">De tweestapsverificatie van een beheerder kan hier niet worden gewist.</p>
      )}

      {canClear && !confirming && (
        <>
          <p className="text-[12px] text-gray-500 font-sans mt-2">
            Kan de {who} niet meer bij de code, bijvoorbeeld door een nieuwe telefoon? Wis dan de tweestapsverificatie.
            De {who} stelt die bij de volgende keer inloggen opnieuw in. Het wachtwoord en de aanvragen blijven zoals ze zijn.
          </p>
          <button
            type="button"
            onClick={() => { setConfirming(true); setError(""); setResult("") }}
            className="mt-3 px-3 py-1.5 text-xs font-medium font-sans rounded-md border border-[#311E86] text-[#311E86] hover:bg-[#311E86]/5 transition-colors"
          >
            Tweestapsverificatie wissen
          </button>
        </>
      )}

      {canClear && confirming && (
        <div className="mt-3 rounded-lg bg-amber-50 border border-amber-200 px-3 py-2.5">
          <p className="text-[13px] text-amber-900 font-sans">
            De {who} wordt overal uitgelogd en stelt bij de volgende keer inloggen opnieuw tweestapsverificatie in.
            Tot dat moment werkt het account met alleen het wachtwoord. Doorgaan?
          </p>
          <div className="flex items-center gap-2 mt-2.5">
            <button
              type="button"
              onClick={clear}
              disabled={busy}
              className="px-3 py-1.5 text-xs font-medium font-sans rounded-md bg-red-600 text-white hover:bg-red-700 transition-colors disabled:opacity-50"
            >
              {busy ? "Wissen…" : "Ja, wissen"}
            </button>
            <button
              type="button"
              onClick={() => { setConfirming(false); setError("") }}
              disabled={busy}
              className="px-3 py-1.5 text-xs font-medium font-sans rounded-md border border-gray-300 text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Annuleren
            </button>
          </div>
        </div>
      )}

      {error && <p className="mt-2 text-[13px] text-red-600 font-sans" role="alert">{error}</p>}
    </div>
  )
}

// The same block in a window of its own, for an account list that has no
// detail window per account (Beheer > Gebruikers).
export function MfaDialog({ account, onClose, onChange }: {
  account: MfaAccount
  onClose: () => void
  onChange: (change: Partial<MfaAccount>) => void
}) {
  return (
    <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white rounded-xl border border-gray-200 shadow-xl w-full max-w-lg max-h-[85vh] overflow-y-auto p-6"
        role="dialog"
        aria-modal="true"
        aria-label={`Tweestapsverificatie van ${account.displayName || account.email}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between mb-1">
          <h3 className="font-serif text-xl text-[#1E3A5F]">{account.displayName || account.email}</h3>
          <button type="button" onClick={onClose} aria-label="Sluiten" className="text-gray-400 hover:text-gray-600 text-sm leading-none">✕</button>
        </div>
        <p className="text-[12px] text-gray-400 font-sans mb-5">{account.email}</p>
        <MfaPanel account={account} onChange={onChange} />
      </div>
    </div>
  )
}
