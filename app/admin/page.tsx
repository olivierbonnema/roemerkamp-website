import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { AdminGuard } from "@/components/auth-guard"
import { AdminPanel } from "@/components/admin/admin-panel"

export const metadata = {
  title: "Beheer | Lange & Partners Non-bancair",
}

export default function AdminPage() {
  return (
    <>
      <Header />
      <main>
        <section className="relative bg-[#1E3A5F] overflow-hidden">
          <div className="max-w-screen-2xl mx-auto px-4 pt-24 pb-12">
            <div className="w-12 h-1 bg-[#F75D20] rounded-sm mb-4" />
            <h1 className="font-serif text-4xl md:text-5xl font-normal text-white mb-3 leading-tight max-w-2xl">
              Beheer
            </h1>
            <p className="font-sans text-base text-white/70 max-w-lg">
              Beheer gebruikersaccounts en bekijk alle ingediende financieringsaanvragen.
            </p>
          </div>
        </section>

        <section className="max-w-4xl mx-auto px-4 py-12 pb-24">
          <AdminGuard>
            <AdminPanel />
          </AdminGuard>
        </section>
      </main>
      <Footer />
    </>
  )
}
