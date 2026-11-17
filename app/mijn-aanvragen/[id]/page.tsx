import { PortalPage } from "@/components/portaal/portal-page"
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
    <PortalPage title="Mijn aanvraag" intro="Volg de status van uw aanvraag en bekijk berichten.">
      <AuthGuard>
        <AanvraagDetail aanvraagId={id} />
      </AuthGuard>
    </PortalPage>
  )
}
