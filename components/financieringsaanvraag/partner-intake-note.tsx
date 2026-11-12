"use client"

import { useAuth } from "@/contexts/auth-context"
import { ui } from "@/components/portaal/portal-ui"

// Shown only to partner accounts on the intake form: they submit on behalf of a
// client, and the request is auto-linked to their organization server-side.
export function PartnerIntakeNote() {
  const { isPartner } = useAuth()
  if (!isPartner) return null
  return (
    <div className={`${ui.noticeInfo} mb-8`}>
      <p className="text-[15px] font-semibold text-[#1e3a5f]">U dient deze aanvraag in namens een klant.</p>
      <p className="text-[15px] leading-relaxed text-[#2a2f3a] mt-1.5">
        Vul hieronder de gegevens van de klant (de aanvrager) in. De aanvraag wordt automatisch aan uw
        organisatie gekoppeld, zodat u en uw collega&apos;s de status kunnen volgen.
      </p>
      {/* Said out loud: what is typed here reaches us before "indienen". */}
      <p className="text-[15px] leading-relaxed text-[#2a2f3a] mt-2">
        Wat u invult, wordt automatisch als concept bewaard, ook de documenten die u toevoegt. U kunt later
        verdergaan via Mijn aanvragen, ook op een andere computer. Lange &amp; Partners kan concepten inzien.
      </p>
    </div>
  )
}
