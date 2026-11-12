import { Header } from "@/components/header"
import { PortalFooter } from "@/components/portal-footer"
import { AuthGuard } from "@/components/auth-guard"
import { AccountSettings } from "@/components/account/account-settings"
import { ContactPanel, PortalColumns, PortalHero } from "@/components/portaal/portal-ui"

export const metadata = {
  title: "Accountinstellingen",
  robots: { index: false, follow: false },
}

export default function AccountPage() {
  return (
    <>
      <Header />
      <main>
        <PortalHero
          title="Accountinstellingen"
          intro="Beheer uw accountgegevens en wachtwoord."
          crumbs={[{ label: "Accountinstellingen", href: "/account" }]}
        />
        <AuthGuard>
          <PortalColumns aside={<ContactPanel />}>
            <AccountSettings />
          </PortalColumns>
        </AuthGuard>
      </main>
      <PortalFooter />
    </>
  )
}
