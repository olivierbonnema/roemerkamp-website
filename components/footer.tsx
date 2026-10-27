import Link from "next/link"
import { PRODUCT_PAGES, INVESTOR_PAGES } from "@/lib/site-nav"

const linkClass = "text-gray-600 hover:text-[#311e86] text-xs"

// Product pages come from lib/site-nav.ts (single source of truth for menu, footer, sitemap).
const borrowerFirst = PRODUCT_PAGES.slice(0, 5)
const borrowerRest = PRODUCT_PAGES.slice(5)

export function Footer() {
  return (
    <footer className="bg-white border-t border-gray-200 py-10">
      <div className="max-w-screen-2xl mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8">

          {/* Voor leningnemers, deel 1 */}
          <div>
            <h3 className="font-semibold text-[#311e86] mb-3 text-sm">Voor leningnemers</h3>
            <ul className="space-y-1.5">
              {borrowerFirst.map((p) => (
                <li key={p.href}>
                  <Link href={p.href} className={linkClass}>{p.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Voor leningnemers, deel 2 */}
          <div>
            <h3 className="font-semibold text-[#311e86] mb-3 text-sm">Meer financieringen</h3>
            <ul className="space-y-1.5">
              {borrowerRest.map((p) => (
                <li key={p.href}>
                  <Link href={p.href} className={linkClass}>{p.label}</Link>
                </li>
              ))}
              <li>
                <Link href="/voor-leningnemers" className={`${linkClass} font-medium`}>Alle financieringen</Link>
              </li>
            </ul>
          </div>

          {/* Voor investeerders */}
          <div>
            <h3 className="font-semibold text-[#311e86] mb-3 text-sm">Voor investeerders</h3>
            <ul className="space-y-1.5">
              {INVESTOR_PAGES.map((p) => (
                <li key={p.href}>
                  <Link href={p.href} className={linkClass}>{p.label}</Link>
                </li>
              ))}
              <li>
                <Link href="/berichten" className={linkClass}>Berichten</Link>
              </li>
              <li>
                <Link href="/nadere-informatie" className={linkClass}>Toezicht en registraties</Link>
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

        <p className="mt-10 text-[11px] text-gray-400">
          Lange &amp; Partners Financieel Advies B.V., Wilhelminastraat 50, 2011 VN Haarlem. KvK 34269870.
        </p>
      </div>
    </footer>
  )
}
