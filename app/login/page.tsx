import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { LoginForm } from "@/components/login/login-form"

export const metadata = {
  title: "Inloggen",
  description: "Log in op uw account bij Lange & Partners.",
  robots: { index: false, follow: false },
}

// Drawn as the other screens before the portal and as the login of Beheer
// (app/admin-login, app/wachtwoord-instellen, app/mfa-setup): the logo above
// one white card in the middle of a light grey page. The head and the foot of
// the site stay, so every link they had on this page is still there.
export default function LoginPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#f5f5f7]">
      <Header />
      <main className="flex-1 flex items-center justify-center px-4 py-12 md:py-16">
        <div className="w-full max-w-[480px]">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm px-6 pt-8 pb-9 sm:px-10 sm:pt-10 sm:pb-11">
            <div className="mb-8">
              <h1 className="font-serif text-3xl font-normal text-gray-900 mb-1">
                Inloggen
              </h1>
              <p className="text-[14px] text-gray-400 font-sans">
                Log in op uw account om uw financieringsaanvraag in te dienen.
              </p>
            </div>
            <LoginForm />
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
