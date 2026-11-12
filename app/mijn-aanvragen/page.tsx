import { Header } from "@/components/header"
import { PortalFooter } from "@/components/portal-footer"
import { AuthGuard } from "@/components/auth-guard"
import { RequestsList } from "@/components/mijn-aanvragen/requests-list"
import { PortalHero } from "@/components/portaal/portal-ui"

export const metadata = {
  title: "Mijn aanvragen",
  description: "Bekijk de status van uw financieringsaanvragen.",
  robots: { index: false, follow: false },
}

export default function MijnAanvragenPage() {
  return (
    <>
      <Header />
      <main>
        <PortalHero
          title="Mijn aanvragen"
          intro="Hier vindt u een overzicht van uw financieringsaanvragen: ingediend én opgeslagen concepten."
          crumbs={[{ label: "Mijn aanvragen", href: "/mijn-aanvragen" }]}
        />
        {/* The list lays out its own columns: what is in the side column
            depends on what it has loaded. */}
        <AuthGuard>
          <RequestsList />
        </AuthGuard>
      </main>
      <PortalFooter />
    </>
  )
}
