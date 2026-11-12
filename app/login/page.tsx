import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { LoginForm } from "@/components/login/login-form"
import { PageHero } from "@/components/product/page-hero"

export const metadata = {
  title: "Inloggen",
  description: "Log in op uw account bij Lange & Partners.",
  robots: { index: false, follow: false },
}

export default function LoginPage() {
  return (
    <>
      <Header />
      <main>
        {/* The same page head as the public pages and the portal. */}
        <PageHero
          title="Inloggen"
          intro="Log in op uw account om uw financieringsaanvraag in te dienen."
          breadcrumbs={[{ label: "Inloggen", href: "/login" }]}
        />

        {/* Form, on the left edge of the page like the forms on the site. */}
        <section className="max-w-[1200px] mx-auto px-5 md:px-10 pt-10 md:pt-14 pb-16 md:pb-24">
          <div className="max-w-md">
            <LoginForm />
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
