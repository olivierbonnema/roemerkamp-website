import { PortalPage } from "@/components/portaal/portal-page"
import { AuthGuard } from "@/components/auth-guard"
import { RequestsList } from "@/components/mijn-aanvragen/requests-list"

export const metadata = {
  title: "Mijn aanvragen",
  description: "Bekijk de status van uw financieringsaanvragen.",
  robots: { index: false, follow: false },
}

export default function MijnAanvragenPage() {
  return (
    <PortalPage
      title="Mijn aanvragen"
      intro="Hier vindt u een overzicht van uw financieringsaanvragen: ingediend én opgeslagen concepten."
    >
      <AuthGuard>
        <RequestsList />
      </AuthGuard>
    </PortalPage>
  )
}
