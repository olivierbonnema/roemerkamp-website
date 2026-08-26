import { Suspense } from "react"
import { Header } from "@/components/header"
import { PortalFooter } from "@/components/portal-footer"
import { FinancingForm } from "@/components/financieringsaanvraag/financing-form"
import { PartnerIntakeNote } from "@/components/financieringsaanvraag/partner-intake-note"
import { AuthGuard } from "@/components/auth-guard"

export const metadata = {
  title: "Financieringsaanvraag",
  description: "Dien uw non-bancaire financieringsaanvraag in. Na ontvangst beoordelen wij uw aanvraag en nemen wij contact met u op.",
  alternates: { canonical: "https://www.nonbancaireleningen.nl/financieringsaanvraag" },
  openGraph: {
    title: "Financieringsaanvraag | Lange & Partners",
    description: "Dien uw non-bancaire financieringsaanvraag in. Na ontvangst beoordelen wij uw aanvraag en nemen wij contact met u op.",
    url: "https://www.nonbancaireleningen.nl/financieringsaanvraag",
  },
  twitter: {
    title: "Financieringsaanvraag | Lange & Partners",
    description: "Dien uw non-bancaire financieringsaanvraag in. Na ontvangst beoordelen wij uw aanvraag en nemen wij contact met u op.",
  },
}

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
              Financieringsaanvraag
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
            {/* Suspense is required because FinancingForm reads useSearchParams
                (the ?draft= id) on a statically rendered page. */}
            <Suspense>
              <FinancingForm />
            </Suspense>
          </AuthGuard>
        </section>
      </main>
      <PortalFooter />
    </>
  )
}
