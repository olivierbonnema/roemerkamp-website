import { Suspense } from "react"
import { Header } from "@/components/header"
import { PortalFooter } from "@/components/portal-footer"
import { FinancingFormLoader } from "@/components/financieringsaanvraag/concept-loader"
import { PortalHero } from "@/components/portaal/portal-ui"
import { AuthGuard } from "@/components/auth-guard"
import type { Metadata } from 'next'
import { pageMetadata } from '@/lib/seo'

export const metadata: Metadata = pageMetadata({
  path: "/financieringsaanvraag",
  title: "Financiering aanvragen",
  description: "Vraag een vastgoedfinanciering aan van €200.000 tot €5.000.000. U ontvangt eerst een indicatie per e-mail. Pas na uw akkoord volgen factuur en termsheet.",
})

export default function FinancieringsaanvraagPage() {
  return (
    <>
      <Header />
      <main>
        <PortalHero
          title="Financiering aanvragen"
          intro="Dien uw financieringsaanvraag in via onderstaand formulier. Na ontvangst beoordelen wij uw aanvraag en nemen wij contact met u op."
          crumbs={[{ label: "Aanvraag indienen", href: "/financieringsaanvraag" }]}
        />
        {/* The form lays out its own columns: the steps sit in its side
            column, the note for partners above the form
            (components/financieringsaanvraag).
            Suspense is required because the form reads useSearchParams (the
            ?draft= id) on a statically rendered page. The loader first
            fetches the server copy of a concept that is being continued. */}
        <AuthGuard>
          <Suspense>
            <FinancingFormLoader />
          </Suspense>
        </AuthGuard>
      </main>
      <PortalFooter />
    </>
  )
}
