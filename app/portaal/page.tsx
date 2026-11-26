import { PortalPage } from "@/components/portaal/portal-page"
import { AuthGuard } from "@/components/auth-guard"
import { PortalDashboard } from "@/components/portaal/portal-dashboard"

export const metadata = {
  title: "Mijn portaal",
  robots: { index: false, follow: false },
}

export default function PortaalPage() {
  return (
    <PortalPage title="Welkom" intro="Wat wilt u vandaag doen?">
      <AuthGuard>
        <PortalDashboard />
      </AuthGuard>
    </PortalPage>
  )
}
