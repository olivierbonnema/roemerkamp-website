import Link from "next/link"

export function Footer() {
  return (
    <footer className="bg-white border-t border-gray-200 py-10">
      <div className="max-w-screen-2xl mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">

          {/* Voor leningnemers & investeerders */}
          <div>
            <h3 className="font-semibold text-[#311e86] mb-3 text-sm">Non-bancaire leningen</h3>
            <ul className="space-y-1.5">
              <li>
                <Link href="/voor-leningnemers" className="text-gray-600 hover:text-[#311e86] text-xs">
                  Voor leningnemers
                </Link>
              </li>
              <li>
                <Link href="/voor-investeerders" className="text-gray-600 hover:text-[#311e86] text-xs">
                  Voor investeerders
                </Link>
              </li>
              <li>
                <Link href="/berichten" className="text-gray-600 hover:text-[#311e86] text-xs">
                  Berichten
                </Link>
              </li>
            </ul>
          </div>

          {/* Over ons */}
          <div>
            <h3 className="font-semibold text-[#311e86] mb-3 text-sm">Over ons</h3>
            <ul className="space-y-1.5">
              <li>
                <Link href="/over-wmp#wat-ons-drijft" className="text-gray-600 hover:text-[#311e86] text-xs">
                  Wat ons drijft
                </Link>
              </li>
              <li>
                <Link href="/over-wmp#wie-we-zijn" className="text-gray-600 hover:text-[#311e86] text-xs">
                  Wie we zijn
                </Link>
              </li>
              <li>
                <Link href="/over-wmp#in-memoriam" className="text-gray-600 hover:text-[#311e86] text-xs">
                  In memoriam
                </Link>
              </li>
            </ul>
          </div>

          {/* Portaal */}
          <div>
            <h3 className="font-semibold text-[#311e86] mb-3 text-sm">Portaal</h3>
            <ul className="space-y-1.5">
              <li>
                <Link href="/login" className="text-gray-600 hover:text-[#311e86] text-xs">
                  Inloggen
                </Link>
              </li>
              <li>
                <Link href="/financieringsaanvraag" className="text-gray-600 hover:text-[#311e86] text-xs">
                  Aanvraag indienen
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-semibold text-[#311e86] mb-3 text-sm">Contact</h3>
            <ul className="space-y-1.5">
              <li>
                <Link href="/contact" className="text-gray-600 hover:text-[#311e86] text-xs">
                  Contactpagina
                </Link>
              </li>
              <li>
                <a
                  href="mailto:info@langefa.nl"
                  className="text-gray-600 hover:text-[#311e86] text-xs"
                >
                  info@langefa.nl
                </a>
              </li>
              <li>
                <a
                  href="tel:0235173106"
                  className="text-gray-600 hover:text-[#311e86] text-xs"
                >
                  (023) 517 31 06
                </a>
              </li>
            </ul>
          </div>

        </div>
      </div>
    </footer>
  )
}
