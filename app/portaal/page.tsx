import { Header } from "@/components/header"
import { PortalFooter } from "@/components/portal-footer"
import { AuthGuard } from "@/components/auth-guard"
import { PortalDashboard } from "@/components/portaal/portal-dashboard"
import { ContactPanel, PortalColumns, PortalHero } from "@/components/portaal/portal-ui"

export const metadata = {
  title: "Mijn portaal",
  robots: { index: false, follow: false },
}

export default function PortaalPage() {
  return (
    <>
      <Header />
      <main>
        {/* The one portal screen with a photo: the hall of the office, where a
            visitor comes in. The working screens keep a short head. */}
        <PortalHero
          title="Welkom"
          intro="Wat wilt u vandaag doen?"
          image={{ src: "/images/kantoor-hal.jpg", alt: "De hal van het kantoor van Lange & Partners in Haarlem" }}
        />
        <AuthGuard>
          <PortalColumns aside={<ContactPanel />}>
            <PortalDashboard />
          </PortalColumns>
        </AuthGuard>
      </main>
      <PortalFooter />
    </>
  )
}
