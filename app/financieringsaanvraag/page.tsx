import { Suspense } from "react"
import { Header } from "@/components/header"
import { PortalFooter } from "@/components/portal-footer"
import { FinancingFormLoader } from "@/components/financieringsaanvraag/concept-loader"
import { PartnerIntakeNote } from "@/components/financieringsaanvraag/partner-intake-note"
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
        {/* Hero */}
        <section className="relative bg-[#1E3A5F] overflow-hidden">
          <div className="max-w-screen-2xl mx-auto px-4 pt-24 pb-12">
            <div className="w-12 h-1 bg-[#F75D20] rounded-sm mb-4" />
            <h1 className="font-serif text-4xl md:text-5xl font-normal text-white mb-3 leading-tight max-w-2xl">
              Financiering aanvragen
            </h1>
            <p className="font-sans text-base text-white/70 max-w-lg">
              Dien uw financieringsaanvraag in via onderstaand formulier.
              Na ontvangst beoordelen wij uw aanvraag en nemen wij contact met u op.
            </p>
          </div>
        </section>

        {/* Form */}
        <section className="max-w-3xl mx-auto px-4 py-12 pb-20">
          <AuthGuard>
            <PartnerIntakeNote />
            {/* Suspense is required because the form reads useSearchParams
                (the ?draft= id) on a statically rendered page. The loader first
                fetches the server copy of a concept that is being continued. */}
            <Suspense>
              <FinancingFormLoader />
            </Suspense>
          </AuthGuard>
        </section>
      </main>
      <PortalFooter />
    </>
  )
}
