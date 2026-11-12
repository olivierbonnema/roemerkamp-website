import Link from "next/link"

const linkClass = "text-gray-600 hover:text-[#311e86] text-xs"

// The foot of a portal screen. Same look and the same closing line as the foot
// of the public site (components/footer.tsx), without its lists of pages: an
// adviser at work needs the way back and how to reach us.
export function PortalFooter() {
  return (
    <footer className="bg-white border-t border-gray-200 py-8 mt-auto">
      <div className="max-w-screen-2xl mx-auto px-4">
        <ul className="flex flex-wrap gap-x-8 gap-y-2 list-none m-0 p-0">
          <li>
            <Link href="/" className={linkClass}>Terug naar de website</Link>
          </li>
          <li>
            <a href="tel:0235173100" className={linkClass}>(023) 517 31 00</a>
          </li>
          <li>
            <a href="mailto:info@langefa.nl" className={linkClass}>info@langefa.nl</a>
          </li>
          <li>
            <Link href="/privacy" className={linkClass}>Privacyverklaring</Link>
          </li>
        </ul>
        <p className="mt-6 text-[11px] text-gray-400">
          Lange &amp; Partners is een handelsnaam van Lange Financieel Advies B.V., Wilhelminastraat 50, 2011 VN Haarlem.
          KvK 34269870. AFM-vergunning 12017043. Aangesloten bij Kifid onder nummer 300.012572.
        </p>
      </div>
    </footer>
  )
}
