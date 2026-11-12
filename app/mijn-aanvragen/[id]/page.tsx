import { Header } from "@/components/header"
import { PortalFooter } from "@/components/portal-footer"
import { AuthGuard } from "@/components/auth-guard"
import { AanvraagDetail } from "@/components/mijn-aanvragen/aanvraag-detail"
import { PortalHero } from "@/components/portaal/portal-ui"

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
        <PortalHero
          title="Mijn aanvraag"
          intro="Volg de status van uw aanvraag en bekijk berichten."
          crumbs={[
            { label: "Mijn aanvragen", href: "/mijn-aanvragen" },
            { label: "Aanvraag", href: `/mijn-aanvragen/${id}` },
          ]}
        />
        <AuthGuard>
          <AanvraagDetail aanvraagId={id} />
        </AuthGuard>
      </main>
      <PortalFooter />
    </>
  )
}
