export function OverigeSection() {
  return (
    <section className="py-16 bg-white">
      <div className="max-w-screen-2xl mx-auto px-4">
        <div className="grid md:grid-cols-2 gap-12 max-w-4xl">

          <div>
            <div className="w-8 h-0.5 bg-[#f75d20] mb-4" />
            <h3 className="font-serif text-xl font-normal text-[#1e3a5f] mb-3">Duurzaamheid</h3>
            <p className="text-gray-600 text-sm leading-relaxed font-sans">
              Voor nadere informatie over het duurzaamheidsbeleid van Lange &amp; Partners kunt u contact met ons opnemen via{" "}
              <a href="mailto:info@langefa.nl" className="text-[#311e86] hover:underline">
                info@langefa.nl
              </a>
              .
            </p>
          </div>

          <div>
            <div className="w-8 h-0.5 bg-[#f75d20] mb-4" />
            <h3 className="font-serif text-xl font-normal text-[#1e3a5f] mb-3">Wat wij graag steunen</h3>
            <p className="text-gray-600 text-sm leading-relaxed font-sans">
              Lange &amp; Partners is corporate friend van{" "}
              <a
                href="https://www.black-jaguar.org"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#311e86] hover:underline"
              >
                The Black Jaguar Foundation
              </a>
              .
            </p>
          </div>

        </div>
      </div>
    </section>
  )
}
