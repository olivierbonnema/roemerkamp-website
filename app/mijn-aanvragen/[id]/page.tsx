import { Header } from "@/components/header"
import { PortalFooter } from "@/components/portal-footer"
import { AuthGuard } from "@/components/auth-guard"
import { AanvraagDetail } from "@/components/mijn-aanvragen/aanvraag-detail"

export const metadata = {
  title: "Aanvraag details",
  description: "Bekijk de status en berichten van uw financieringsaanvraag.",
  robots: { index: false, follow: false },
}

export default async function AanvraagDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  return (
    <>
      <Header />
      <main>
        <section className="relative bg-[#1E3A5F] overflow-hidden">
          <div className="max-w-screen-2xl mx-auto px-4 pt-24 pb-12">
            <div className="w-12 h-1 bg-[#F75D20] rounded-sm mb-4" />
            <h1 className="font-serif text-4xl md:text-5xl font-normal text-white mb-3 leading-tight max-w-2xl">
              Mijn aanvraag
            </h1>
            <p className="font-sans text-base text-white/70 max-w-lg">
              Volg de status van uw aanvraag en bekijk berichten.
            </p>
          </div>
        </section>

        <section className="max-w-3xl mx-auto px-4 py-12 pb-24">
          <AuthGuard>
            <AanvraagDetail aanvraagId={id} />
          </AuthGuard>
        </section>
      </main>
      <PortalFooter />
    </>
  )
}
