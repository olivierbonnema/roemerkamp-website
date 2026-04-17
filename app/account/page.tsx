import { Header } from "@/components/header"
import { PortalFooter } from "@/components/portal-footer"
import { AuthGuard } from "@/components/auth-guard"
import { AccountSettings } from "@/components/account/account-settings"

export const metadata = {
  title: "Accountinstellingen | Lange & Partners Non-bancair",
}

export default function AccountPage() {
  return (
    <>
      <Header />
      <main>
        <section className="relative bg-[#1E3A5F] overflow-hidden">
          <div className="max-w-screen-2xl mx-auto px-4 pt-24 pb-12">
            <div className="w-12 h-1 bg-[#F75D20] rounded-sm mb-4" />
            <h1 className="font-serif text-4xl md:text-5xl font-normal text-white mb-3 leading-tight max-w-2xl">
              Accountinstellingen
            </h1>
            <p className="font-sans text-base text-white/70 max-w-lg">
              Beheer uw accountgegevens en wachtwoord.
            </p>
          </div>
        </section>

        <section className="max-w-3xl mx-auto px-4 py-12 pb-24">
          <AuthGuard>
            <AccountSettings />
          </AuthGuard>
        </section>
      </main>
      <PortalFooter />
    </>
  )
}
