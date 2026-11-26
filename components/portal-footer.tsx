import Link from "next/link"

// The foot of a portal screen: one quiet line on the grey of the page, as wide
// as the column above it (components/portaal/portal-page.tsx). Beheer has no
// foot at all; the portal keeps the way back to the website.
export function PortalFooter() {
  const year = new Date().getFullYear()

  return (
    <footer className="mt-auto">
      <div className="max-w-4xl mx-auto px-4">
        <div className="border-t border-gray-200 py-5 flex flex-wrap items-center justify-between gap-x-6 gap-y-2">
          <span className="text-xs text-gray-400 font-sans">
            © {year} Lange & Partners
          </span>
          <Link
            href="/"
            className="text-xs text-gray-500 hover:text-[#311e86] font-sans transition-colors"
          >
            ← Terug naar website
          </Link>
        </div>
      </div>
    </footer>
  )
}
