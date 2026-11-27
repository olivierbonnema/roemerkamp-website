"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { onAuthStateChanged } from "firebase/auth"
import { auth } from "@/lib/firebase"

// Where the Kadaster sends a colleague back to after logging in with
// eHerkenning (KIK Inzage, lib/kadaster-kik.ts). The address of this page is
// registered at the Kadaster to the letter: do not move it.
//
// The Kadaster adds a code to the address that is valid for 30 seconds and
// only once. This page hands it to the server straight away and takes it out
// of the address bar.

type Stand = { soort: "bezig" } | { soort: "klaar"; geldigTot: number; test: boolean } | { soort: "fout"; tekst: string }

const datum = (ms: number) => new Date(ms).toLocaleString("nl-NL", { weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" })

export default function KadasterKoppelenPage() {
  const [stand, setStand] = useState<Stand>({ soort: "bezig" })
  const gestart = useRef(false)

  useEffect(() => {
    if (gestart.current) return
    gestart.current = true
    const query = new URLSearchParams(window.location.search)
    const code = query.get("code") || ""
    const state = query.get("state") || ""
    const geweigerd = query.get("error") || ""
    window.history.replaceState(null, "", window.location.pathname)

    if (geweigerd) {
      setStand({ soort: "fout", tekst: "Het Kadaster heeft geen toestemming gegeven. Begin opnieuw vanuit het venster Kadaster bij een aanvraag." })
      return
    }
    if (!code || !state) {
      setStand({ soort: "fout", tekst: "Deze pagina hoort bij het inloggen bij het Kadaster. Begin vanuit het venster Kadaster bij een aanvraag." })
      return
    }

    const stop = onAuthStateChanged(auth, async (user) => {
      if (!user) return
      stop()
      try {
        const token = await user.getIdToken()
        const res = await fetch("/api/admin/kadaster/koppeling", {
          method: "POST",
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
          body: JSON.stringify({ actie: "afronden", code, state }),
        })
        let body: Record<string, unknown> = {}
        try { body = await res.json() } catch { /* handled below */ }
        if (res.ok && typeof body.geldigTot === "number") setStand({ soort: "klaar", geldigTot: body.geldigTot, test: body.omgeving === "eto" })
        else setStand({ soort: "fout", tekst: typeof body.error === "string" ? body.error : "De aanmelding bij het Kadaster afronden is niet gelukt." })
      } catch {
        setStand({ soort: "fout", tekst: "De aanmelding bij het Kadaster afronden is niet gelukt. Controleer de verbinding en begin opnieuw." })
      }
    })
    return stop
  }, [])

  return (
    <div className="px-8 py-8">
      <div className="max-w-xl border border-gray-200 rounded-xl bg-white px-6 py-6">
        <h1 className="font-serif text-2xl text-[#1E3A5F]">Kadaster</h1>
        {stand.soort === "bezig" && <p className="text-sm font-sans text-gray-500 mt-3">De aanmelding wordt afgerond...</p>}
        {stand.soort === "klaar" && (
          <div data-klaar>
            <p className="text-sm font-sans text-gray-900 mt-3">
              U bent ingelogd bij het Kadaster{stand.test ? " (testomgeving)" : ""}. Dat blijft zo tot {datum(stand.geldigTot)}.
            </p>
            <p className="text-sm font-sans text-gray-500 mt-2">U kunt dit tabblad sluiten en verdergaan in het venster Kadaster bij de aanvraag.</p>
          </div>
        )}
        {stand.soort === "fout" && <p role="alert" className="text-sm font-sans text-red-600 mt-3">{stand.tekst}</p>}
        {stand.soort !== "bezig" && (
          <Link href="/admin/aanvragen" className="inline-block mt-5 px-5 py-2 text-[13px] font-medium font-sans rounded-full bg-[#1E3A5F] text-white hover:bg-[#162c49]">
            Naar de aanvragen
          </Link>
        )}
      </div>
    </div>
  )
}
