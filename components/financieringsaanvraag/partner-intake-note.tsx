"use client"

import { useAuth } from "@/contexts/auth-context"

// Shown only to partner accounts on the intake form: they submit on behalf of a
// client, and the request is auto-linked to their organization server-side.
export function PartnerIntakeNote() {
  const { isPartner } = useAuth()
  if (!isPartner) return null
  return (
    <div className="mb-6 rounded-xl border border-[#311E86]/20 bg-[#311E86]/5 px-5 py-4">
      <p className="text-sm font-medium text-[#1E3A5F] font-sans">U dient deze aanvraag in namens een klant.</p>
      <p className="text-[13px] text-gray-600 font-sans mt-1">
        Vul hieronder de gegevens van de klant (de aanvrager) in. De aanvraag wordt automatisch aan uw
        organisatie gekoppeld, zodat u en uw collega&apos;s de status kunnen volgen.
      </p>
    </div>
  )
}
