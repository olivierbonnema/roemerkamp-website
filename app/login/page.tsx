import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { LoginForm } from "@/components/login/login-form"

export const metadata = {
  title: "Inloggen | Lange & Partners Non-bancair",
  description: "Log in op uw account bij Lange & Partners Non-bancair.",
}

export default function LoginPage() {
  return (
    <>
      <Header />
      <main>
        {/* Hero */}
        <section className="relative bg-[#1E3A5F] overflow-hidden">
          <div className="max-w-screen-2xl mx-auto px-4 pt-24 pb-12">
            <div className="w-12 h-1 bg-[#F75D20] rounded-sm mb-4" />
            <h1 className="font-serif text-4xl md:text-5xl font-normal text-white mb-3 leading-tight max-w-2xl">
              Inloggen
            </h1>
            <p className="font-sans text-base text-white/70 max-w-lg">
              Log in op uw account om uw financieringsaanvraag in te dienen.
            </p>
          </div>
        </section>

        {/* Form */}
        <section className="max-w-md mx-auto px-4 py-16 pb-24">
          <LoginForm />
        </section>
      </main>
      <Footer />
    </>
  )
}
