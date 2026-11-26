import { PortalPage } from "@/components/portaal/portal-page"
import { AuthGuard } from "@/components/auth-guard"
import { AccountSettings } from "@/components/account/account-settings"

export const metadata = {
  title: "Accountinstellingen",
  robots: { index: false, follow: false },
}

export default function AccountPage() {
  return (
    <PortalPage title="Accountinstellingen" intro="Beheer uw accountgegevens en wachtwoord.">
      <AuthGuard>
        <AccountSettings />
      </AuthGuard>
    </PortalPage>
  )
}
