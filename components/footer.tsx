import Link from "next/link"
import { BORROWER_PAGE, INVESTOR_PAGE, SITUATION_PAGES } from "@/lib/site-nav"

const linkClass = "text-gray-600 hover:text-[#311e86] text-xs"

// One product, several situations (2 November 2026). Page lists come from
// lib/site-nav.ts, the single source of truth for menu, footer and sitemap.
const situatiesEerste = SITUATION_PAGES.slice(0, 4)
const situatiesRest = SITUATION_PAGES.slice(4)

export function Footer() {
  return (
    <footer className="bg-white border-t border-gray-200 py-10">
      <div className="max-w-screen-2xl mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8">

          {/* Product */}
          <div>
            <h3 className="font-semibold text-[#311e86] mb-3 text-sm">Financiering</h3>
            <ul className="space-y-1.5">
              <li>
                <Link href={BORROWER_PAGE.href} className={linkClass}>Voor leningnemers</Link>
              </li>
              <li>
                <Link href={INVESTOR_PAGE.href} className={linkClass}>Voor investeerders</Link>
              </li>
              <li>
                <Link href="/casussen" className={linkClass}>Casussen</Link>
              </li>
              <li>
                <Link href="/berichten" className={linkClass}>Berichten</Link>
              </li>
              <li>
                <Link href="/nadere-informatie" className={linkClass}>Toezicht en registraties</Link>
              </li>
            </ul>
          </div>

          {/* Situaties, deel 1 */}
          <div>
            <h3 className="font-semibold text-[#311e86] mb-3 text-sm">Situaties</h3>
            <ul className="space-y-1.5">
              {situatiesEerste.map((p) => (
                <li key={p.href}>
                  <Link href={p.href} className={linkClass}>{p.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Situaties, deel 2 */}
          <div>
            <h3 className="font-semibold text-[#311e86] mb-3 text-sm">Meer situaties</h3>
            <ul className="space-y-1.5">
              {situatiesRest.map((p) => (
                <li key={p.href}>
                  <Link href={p.href} className={linkClass}>{p.label}</Link>
                </li>
              ))}
              <li>
                <Link href="/situaties" className={`${linkClass} font-medium`}>Alle situaties</Link>
              </li>
            </ul>
          </div>

          {/* Over ons */}
          <div>
            <h3 className="font-semibold text-[#311e86] mb-3 text-sm">Over ons</h3>
            <ul className="space-y-1.5">
              <li>
                <Link href="/over-ons#wat-ons-drijft" className={linkClass}>Wat ons drijft</Link>
              </li>
              <li>
                <Link href="/over-ons#wie-we-zijn" className={linkClass}>Wie we zijn</Link>
              </li>
              <li>
                <Link href="/over-ons#in-memoriam" className={linkClass}>In memoriam</Link>
              </li>
              <li>
                <Link href="/privacy" className={linkClass}>Privacyverklaring</Link>
              </li>
            </ul>
          </div>

          {/* Contact en portaal */}
          <div>
            <h3 className="font-semibold text-[#311e86] mb-3 text-sm">Contact</h3>
            <ul className="space-y-1.5">
              <li>
                <Link href="/contact" className={linkClass}>Contactpagina</Link>
              </li>
              <li>
                <a href="mailto:info@langefa.nl" className={linkClass}>info@langefa.nl</a>
              </li>
              <li>
                <a href="tel:0235173100" className={linkClass}>(023) 517 31 00</a>
              </li>
              <li className="pt-2">
                <Link href="/financieringsaanvraag" className={linkClass}>Aanvraag indienen</Link>
              </li>
              <li>
                <Link href="/login" className={linkClass}>Inloggen portaal</Link>
              </li>
            </ul>
          </div>

        </div>

        {/* Legal name (Olivier, 3 November 2026): the company is Lange Financieel
            Advies B.V.; Lange & Partners is its trade name. Licence and Kifid
            numbers checked in the AFM and Kifid registers on the same day. */}
        <p className="mt-10 text-[11px] text-gray-400">
          Lange &amp; Partners is een handelsnaam van Lange Financieel Advies B.V., Wilhelminastraat 50, 2011 VN Haarlem.
          KvK 34269870. AFM-vergunning 12017043. Aangesloten bij Kifid onder nummer 300.012572.
        </p>
      </div>
    </footer>
  )
}
