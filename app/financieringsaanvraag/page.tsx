import { Suspense } from "react"
import { PortalPage } from "@/components/portaal/portal-page"
import { FinancingFormLoader } from "@/components/financieringsaanvraag/concept-loader"
import { PartnerIntakeNote } from "@/components/financieringsaanvraag/partner-intake-note"
import { AuthGuard } from "@/components/auth-guard"
import type { Metadata } from 'next'
import { pageMetadata } from '@/lib/seo'

export const metadata: Metadata = pageMetadata({
  path: "/financieringsaanvraag",
  title: "Financiering aanvragen",
  description: "Vraag een vastgoedfinanciering aan van €200.000 tot €5.000.000. U ontvangt eerst een indicatie per e-mail. Pas na uw akkoord volgt de termsheet.",
})

export default function FinancieringsaanvraagPage() {
  return (
    <PortalPage
      title="Financiering aanvragen"
      intro="Dien uw financieringsaanvraag in via onderstaand formulier. Na ontvangst beoordelen wij uw aanvraag en nemen wij contact met u op."
    >
      <AuthGuard>
        {/* The whole form in one white card, as a form in Beheer. On a phone
            the card runs from edge to edge, so the fields and the row of
            steps keep the width they had. */}
        <div className="bg-white border-y border-gray-200 -mx-4 px-4 py-6 sm:mx-0 sm:p-8 sm:rounded-xl sm:border-x">
          <PartnerIntakeNote />
          {/* Suspense is required because the form reads useSearchParams
              (the ?draft= id) on a statically rendered page. The loader first
              fetches the server copy of a concept that is being continued. */}
          <Suspense>
            <FinancingFormLoader />
          </Suspense>
        </div>
      </AuthGuard>
    </PortalPage>
  )
}
