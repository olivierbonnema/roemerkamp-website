"use client"

// "Uitnodiging" dialog for an existing account: shows the invite mail exactly as
// it will be sent and resends it with a fresh set-password link.
// Server: app/api/admin/resend-invite. Template: lib/invite-email.ts.
// Used by: components/admin/admin-users.tsx, components/admin/admin-partners.tsx

import { useEffect, useState } from "react"
import { auth } from "@/lib/firebase"

export interface InviteAccount {
  uid: string
  email: string
  displayName?: string
  loginKnown?: boolean
  lastSignInAt?: string | null
  authMissing?: boolean
  inviteSentAt?: string | null
  inviteCount?: number
  // Imported account that was never mailed (app/api/admin/import-partners).
  invitePending?: boolean
}

function fmt(iso?: string | null) {
  if (!iso) return ""
  const d = new Date(iso)
  if (isNaN(d.getTime())) return ""
  return d.toLocaleString("nl-NL", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })
}

// Small badge for the account lists: "Nog niet ingelogd" (amber) or
// "Laatst ingelogd 3 nov 2026" (grey). Nothing when login info is unknown.
export function LoginBadge({ u }: { u: InviteAccount }) {
  if (!u.loginKnown) return null
  if (u.authMissing) return <span className="inline-block px-2 py-0.5 rounded-full text-[11px] font-medium font-sans bg-red-50 text-red-700">Geen inlogaccount</span>
  if (u.invitePending) return <span className="inline-block px-2 py-0.5 rounded-full text-[11px] font-medium font-sans bg-blue-50 text-blue-700">Nog niet uitgenodigd</span>
  if (!u.lastSignInAt) {
    return (
      <span className="inline-block px-2 py-0.5 rounded-full text-[11px] font-medium font-sans bg-amber-50 text-amber-700">
        Nog niet ingelogd{u.inviteSentAt ? ` · uitnodiging ${fmt(u.inviteSentAt)}` : ""}
      </span>
    )
  }
  return <span className="inline-block px-2 py-0.5 rounded-full text-[11px] font-sans bg-gray-100 text-gray-500">Laatst ingelogd {fmt(u.lastSignInAt)}</span>
}

export function InviteMailDialog({ account, onClose, onSent }: {
  account: InviteAccount
  onClose: () => void
  // Called after a successful resend with the new stamps.
  onSent: (r: { inviteSentAt: string; inviteCount: number }) => void
}) {
  const [loading, setLoading] = useState(true)
  const [preview, setPreview] = useState<{ to: string; subject: string; html: string } | null>(null)
  const [error, setError] = useState("")
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState("")
  const [link, setLink] = useState("")
  const [linkBusy, setLinkBusy] = useState(false)
  const [linkCopied, setLinkCopied] = useState(false)

  async function call(body: Record<string, unknown>) {
    const token = await auth.currentUser?.getIdToken()
    const res = await fetch("/api/admin/resend-invite", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ uid: account.uid, ...body }),
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(data.error || "Mislukt.")
    return data
  }

  useEffect(() => {
    let alive = true
    call({ preview: true })
      .then((d) => { if (alive) setPreview(d) })
      .catch((e: Error) => { if (alive) setError(e.message || "Voorbeeld laden mislukt.") })
      .finally(() => { if (alive) setLoading(false) })
    return () => { alive = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [account.uid])

  async function send() {
    setSending(true)
    setError("")
    try {
      const d = await call({})
      setSent(`Uitnodiging verstuurd naar ${d.to}.`)
      onSent({ inviteSentAt: d.inviteSentAt, inviteCount: d.inviteCount })
    } catch (e: unknown) {
      setError((e as Error).message || "Uitnodiging versturen mislukt.")
    } finally {
      setSending(false)
    }
  }

  // Make a set-password link WITHOUT sending a mail, so the admin can send it
  // from their own Outlook when our noreply mail does not get through.
  async function makeLink() {
    setLinkBusy(true)
    setError("")
    try {
      const d = await call({ linkOnly: true })
      setLink(d.setupLink)
      let ok = false
      try { await navigator.clipboard.writeText(d.setupLink); ok = true } catch {}
      setLinkCopied(ok)
    } catch (e: unknown) {
      setError((e as Error).message || "Link maken mislukt.")
    } finally {
      setLinkBusy(false)
    }
  }

  const loggedIn = !!account.lastSignInAt

  return (
    <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-xl border border-gray-200 shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between px-6 pt-5 pb-3 border-b border-gray-100">
          <div>
            <h3 className="font-serif text-xl text-[#1E3A5F]">Uitnodiging</h3>
            <p className="text-[12px] text-gray-500 font-sans mt-0.5">
              {account.displayName ? `${account.displayName} · ` : ""}{account.email}
            </p>
            <div className="mt-1.5"><LoginBadge u={account} /></div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-sm leading-none">✕</button>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto px-6 py-4 space-y-3">
          {loading && <div className="flex justify-center py-10"><div className="w-6 h-6 border-2 border-[#311E86] border-t-transparent rounded-full animate-spin" /></div>}
          {preview && (
            <>
              <div className="text-[13px] font-sans text-gray-700 space-y-0.5">
                <p><span className="text-gray-400">Aan:</span> {preview.to}</p>
                <p><span className="text-gray-400">Onderwerp:</span> {preview.subject}</p>
              </div>
              <iframe
                title="Voorbeeld uitnodiging"
                srcDoc={preview.html}
                sandbox=""
                className="w-full h-[440px] border border-gray-200 rounded-lg bg-gray-50"
              />
              <p className="text-[11px] text-gray-400 font-sans">
                Voorbeeld. Bij versturen krijgt de knop &ldquo;Wachtwoord instellen&rdquo; een nieuwe, persoonlijke link.
                {account.inviteCount ? ` Eerder ${account.inviteCount}× verstuurd${account.inviteSentAt ? `, laatst op ${fmt(account.inviteSentAt)}` : ""}.` : ""}
              </p>
              {loggedIn && (
                <p className="text-[12px] text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2 font-sans">
                  Dit account heeft al eens ingelogd. Opnieuw versturen laat de gebruiker een nieuw wachtwoord instellen; het huidige wachtwoord blijft werken tot dat gebeurt.
                </p>
              )}
            </>
          )}
          {link && (
            <div className="border border-[#311E86]/20 bg-[#311E86]/[0.03] rounded-lg p-3 space-y-2">
              <p className="text-[12px] font-sans text-gray-700">
                {linkCopied ? "Link gekopieerd. " : "Kopieer de link hieronder. "}
                Stuur hem zelf vanuit je eigen mail naar {account.email}. De link is <strong>ongeveer 1 uur geldig</strong> en werkt maar één keer; daarna kun je een nieuwe maken.
              </p>
              <input readOnly value={link} onFocus={(e) => e.currentTarget.select()}
                className="w-full h-9 px-3 text-[12px] font-mono border border-gray-300 rounded-md bg-white text-gray-700" />
            </div>
          )}
          {error && <p className="text-sm text-red-500 font-sans">{error}</p>}
          {sent && <p className="text-sm text-green-600 font-sans">{sent}</p>}
        </div>

        <div className="flex justify-end gap-2 px-6 py-4 border-t border-gray-100">
          <button
            onClick={makeLink}
            disabled={linkBusy || !preview}
            title="Maakt de inloglink zonder te mailen, zodat je hem zelf kunt versturen"
            className="mr-auto px-5 py-2 text-sm font-medium font-sans rounded-full border border-[#311E86] text-[#311E86] hover:bg-[#311E86]/5 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {linkBusy ? "Link maken…" : link ? "Nieuwe link kopiëren" : "Link kopiëren"}
          </button>
          <button onClick={onClose} className="px-5 py-2 text-sm font-medium font-sans rounded-full border border-gray-300 text-gray-600 hover:bg-gray-50 transition-colors">
            Sluiten
          </button>
          <button
            onClick={send}
            disabled={sending || !preview || !!sent}
            className="px-5 py-2 text-sm font-medium font-sans rounded-full bg-[#311E86] text-white hover:bg-[#26175e] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {sending ? "Versturen…" : sent ? "Verstuurd" : account.invitePending ? "Uitnodiging versturen" : "Uitnodiging opnieuw versturen"}
          </button>
        </div>
      </div>
    </div>
  )
}
