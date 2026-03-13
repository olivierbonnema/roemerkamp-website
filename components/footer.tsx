import Link from "next/link"

export function Footer() {
  return (
    <footer className="bg-white border-t border-gray-200 py-10">
      <div className="max-w-screen-2xl mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {/* Vermogensbeheer */}
          <div>
            <h3 className="font-semibold text-[#311e86] mb-3 text-sm">Vermogensbeheer</h3>
            <ul className="space-y-1.5">
              <li>
                <Link href="/vermogensbeheer#wat-we-doen" className="text-gray-600 hover:text-[#311e86] text-xs">
                  Wat we doen
                </Link>
              </li>
              <li>
                <Link href="/vermogensbeheer#wat-we-niet-doen" className="text-gray-600 hover:text-[#311e86] text-xs">
                  Wat we niet doen
                </Link>
              </li>
              <li>
                <Link href="/vermogensbeheer#voor-wie" className="text-gray-600 hover:text-[#311e86] text-xs">
                  Voor wie we het doen
                </Link>
              </li>
              <li>
                <Link href="/vermogensbeheer#vermogensregie" className="text-gray-600 hover:text-[#311e86] text-xs">
                  Vermogensregie
                </Link>
              </li>
              <li>
                <Link href="/vermogensbeheer#kosten" className="text-gray-600 hover:text-[#311e86] text-xs">
                  Kosten
                </Link>
              </li>
            </ul>
          </div>

          {/* Non-bancaire leningen */}
          <div>
            <h3 className="font-semibold text-[#311e86] mb-3 text-sm">Non-bancaire leningen</h3>
            <ul className="space-y-1.5">
              <li>
                <Link href="/private-markets" className="text-gray-600 hover:text-[#311e86] text-xs">
                  Meer informatie
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
                <Link href="/over-wmp#nadere-informatie" className="text-gray-600 hover:text-[#311e86] text-xs">
                  Nadere informatie
                </Link>
              </li>
              <li>
                <Link href="/over-wmp#in-memoriam" className="text-gray-600 hover:text-[#311e86] text-xs">
                  In memoriam
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact & Login */}
          <div>
            <ul className="space-y-1.5">
              <li>
                <Link href="/contact" className="text-gray-600 hover:text-[#311e86] text-xs">
                  Contact
                </Link>
              </li>
              <li>
                <a 
                  href="https://rkp.portfolio.saxo" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-gray-600 hover:text-[#311e86] text-xs"
                >
                  Login bij Saxo Bank
                </a>
              </li>
              <li>
                <a 
                  href="https://client.roemerkamppartners.onperformativ.com/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-gray-600 hover:text-[#311e86] text-xs"
                >
                  Login bij AFS
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </footer>
  )
}
