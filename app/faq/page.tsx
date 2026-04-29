import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { ChatInterface } from "@/components/faq/chat-interface"

export const metadata = {
  title: "Veelgestelde vragen | Lange & Partners",
  description:
    "Stel uw vraag aan onze AI-assistent of bekijk de veelgestelde vragen over non-bancaire leningen en investeringen bij Lange & Partners.",
}

export default function FaqPage() {
  return (
    <>
      <Header />
      <main className="flex flex-col" style={{ minHeight: "calc(100vh - 120px)" }}>
        {/* Page header */}
        <section className="bg-[#1e3a5f] py-12">
          <div className="max-w-screen-2xl mx-auto px-4">
            <h1 className="text-3xl md:text-4xl font-serif font-normal text-white">
              Veelgestelde vragen
            </h1>
            <div className="w-12 h-1 bg-[#f75d20] mt-3" />
            <p className="text-white/70 mt-4 text-sm max-w-xl">
              Stel uw vraag hieronder. Onze assistent beantwoordt vragen over onze
              diensten op basis van bedrijfsinformatie. Voor persoonlijk advies kunt u
              altijd contact met ons opnemen.
            </p>
          </div>
        </section>

        {/* Chat area */}
        <section className="flex-1 bg-gray-50">
          <div className="max-w-screen-2xl mx-auto px-4 py-8">
            <div className="max-w-3xl mx-auto">
              <div
                className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex flex-col"
                style={{ height: "calc(100vh - 340px)", minHeight: "480px" }}
              >
                <ChatInterface />
              </div>

              {/* Contact fallback */}
              <div className="mt-6 p-5 rounded-2xl bg-white border border-gray-200 flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="flex-1">
                  <p className="text-sm font-medium text-[#1e3a5f]">
                    Persoonlijk in contact?
                  </p>
                  <p className="text-sm text-gray-500 mt-0.5">
                    Bel{" "}
                    <a
                      href="tel:0235173100"
                      className="text-[#311e86] hover:underline"
                    >
                      (023) 517 31 00
                    </a>{" "}
                    of mail naar{" "}
                    <a
                      href="mailto:info@langefa.nl"
                      className="text-[#311e86] hover:underline"
                    >
                      info@langefa.nl
                    </a>
                    .
                  </p>
                </div>
                <a
                  href="/contact"
                  className="inline-block bg-[#311e86] text-white px-5 py-2.5 text-sm font-medium rounded-full hover:bg-[#261770] transition-colors whitespace-nowrap"
                >
                  Naar contactpagina
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
