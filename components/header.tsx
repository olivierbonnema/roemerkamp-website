"use client"

import Link from "next/link"
import Image from "next/image"
import { useEffect, useState } from "react"
import { ShieldCheck, Menu, X, ChevronDown } from "lucide-react"
import { usePathname, useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { BORROWER_PAGE, INVESTOR_PAGE, SITUATION_PAGES } from "@/lib/site-nav"

interface DropdownItem {
  href: string
  label: string
  external?: boolean
}

interface NavItem {
  href: string
  label: string
  dropdown?: DropdownItem[]
}

const PORTAL_PATHS = ["/mijn-aanvragen", "/financieringsaanvraag", "/admin", "/account", "/portaal"]

// Public navigation. One product, several situations (decision 2 November 2026):
// the product pages are direct links, the situations sit in one dropdown.
// Page lists come from lib/site-nav.ts so menu, footer, homepage and sitemap stay in sync.
const NAV_ITEMS: NavItem[] = [
  { href: BORROWER_PAGE.href, label: "Voor leningnemers" },
  { href: INVESTOR_PAGE.href, label: "Voor investeerders" },
  {
    href: "/situaties",
    label: "Situaties",
    dropdown: [
      { href: "/situaties", label: "Alle situaties" },
      ...SITUATION_PAGES.map((p) => ({ href: p.href, label: p.label })),
    ],
  },
  { href: "/casussen", label: "Casussen" },
  { href: "/berichten", label: "Berichten" },
  { href: "/over-ons", label: "Over ons" },
  { href: "/contact", label: "Contact" },
]

// The admin login is deliberately not linked from the public site (SEO audit 21-10-2026).
const LOGIN_DROPDOWN: DropdownItem[] = [
  { href: "/login", label: "Login bij het aanvragenportaal" },
  { href: "https://www.geldvoorelkaar.nl/langefinancieeladvies/mijn-gegevens/", label: "Login bij Geld voor Elkaar", external: true },
  { href: "https://www.collincrowdfund.nl/mijn-collin/", label: "Login bij Collin Crowdfund", external: true },
]

function Logo() {
  return (
    <Link href="/" className="flex items-center flex-shrink-0">
      <Image
        src="/images/lange-logo.svg"
        alt="Lange & Partners"
        width={340}
        height={85}
        className="h-[56px] md:h-[72px] w-auto md:-mt-4"
        priority
      />
    </Link>
  )
}

export function Header() {
  const pathname = usePathname()
  const router = useRouter()
  const { user, loading, logout, isAdmin } = useAuth()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [openSection, setOpenSection] = useState<string | null>(null)

  // Close the mobile menu after navigation.
  useEffect(() => {
    setMobileOpen(false)
    setOpenSection(null)
  }, [pathname])

  // Lock page scroll while the mobile menu is open.
  useEffect(() => {
    if (!mobileOpen) return
    const previous = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = previous
    }
  }, [mobileOpen])

  const isLoginPage = pathname === "/login"
  const isPortalPage = PORTAL_PATHS.some((p) => pathname?.startsWith(p))

  const isActive = (href: string) => pathname === href || pathname?.startsWith(href + "/")

  /* ── Mode A: Login page - logo only ── */
  if (isLoginPage) {
    return (
      <header className="sticky top-0 z-50 bg-white border-b border-gray-100">
        <div className="max-w-screen-2xl mx-auto px-4 py-6">
          <Logo />
        </div>
      </header>
    )
  }

  /* ── Mode B: Portal pages (when logged in) ── */
  if (isPortalPage && !loading && user) {
    // Same look as the menu of the public site: plain links, the current one
    // purple. On a phone they sit in a row under the head.
    const portalLinks = [
      { href: "/portaal", label: "Home", current: pathname === "/portaal" },
      { href: "/mijn-aanvragen", label: "Mijn aanvragen", current: pathname === "/mijn-aanvragen" || !!pathname?.startsWith("/mijn-aanvragen/") },
      { href: "/financieringsaanvraag", label: "Aanvraag indienen", current: pathname === "/financieringsaanvraag" },
    ]
    const portalLinkClass = (current: boolean) =>
      `text-[13px] transition-colors hover:text-[#311e86] whitespace-nowrap ${current ? "text-[#311e86] font-semibold" : "text-gray-700 font-medium"}`
    const adminLink = isAdmin && (
      <Link
        href="/admin"
        className={`inline-flex items-center gap-1.5 text-[13px] transition-colors hover:text-[#311e86] whitespace-nowrap ${
          pathname?.startsWith("/admin") ? "text-[#311e86] font-semibold" : "text-gray-500 font-medium"
        }`}
      >
        <ShieldCheck size={13} aria-hidden="true" />
        Admin
      </Link>
    )
    return (
      <>
        <header className="sticky top-0 z-50 bg-white border-b border-gray-100">
          <div className="max-w-screen-2xl mx-auto px-4 py-4 md:py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-10">
                <Logo />

                {/* Portal nav */}
                <nav className="hidden md:flex items-center gap-7 xl:gap-9" aria-label="Portaal">
                  {portalLinks.map((item) => (
                    <Link key={item.href} href={item.href} className={portalLinkClass(item.current)} aria-current={item.current ? "page" : undefined}>
                      {item.label}
                    </Link>
                  ))}
                  {adminLink}
                </nav>
              </div>

              {/* Account dropdown */}
              <div className="relative group">
                <button className="px-4 py-2 text-sm font-medium text-[#311e86] border border-[#311e86] rounded-full hover:bg-gray-50 transition-colors flex items-center gap-1.5 font-sans">
                  Account
                  <svg className="w-3 h-3 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                <div className="absolute right-0 top-full pt-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible group-focus-within:opacity-100 group-focus-within:visible transition-all duration-200 ease-out z-50">
                  <div className="bg-white rounded-md shadow-lg border border-gray-100 py-2 min-w-[200px]">
                    <Link href="/account" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-[#311e86] transition-colors">
                      Accountinstellingen
                    </Link>
                    <div className="border-t border-gray-100 mt-1 pt-1">
                      <button
                        onClick={async () => { await logout(); router.push("/") }}
                        className="w-full text-left px-4 py-2 text-sm text-gray-500 hover:bg-gray-50 hover:text-red-500 transition-colors"
                      >
                        Uitloggen
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* The same links on a phone, where the head has no room for them. This
            row is not part of the head on purpose: the head stays in view while
            the page scrolls, and on a phone the form needs that room. */}
        <nav className="md:hidden bg-white border-b border-gray-100" aria-label="Portaal">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3">
            {portalLinks.map((item) => (
              <Link key={item.href} href={item.href} className={portalLinkClass(item.current)} aria-current={item.current ? "page" : undefined}>
                {item.label}
              </Link>
            ))}
            {adminLink}
          </div>
        </nav>
      </>
    )
  }

  /* ── Mode C: Default (regular website) ── */
  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-100">
      <div className="max-w-screen-2xl mx-auto px-4 py-4 md:py-6">
        <div className="flex items-center justify-between">
          {/* Logo and desktop navigation */}
          <div className="flex items-center gap-10">
            <Logo />

            <nav className="hidden lg:flex items-center gap-7 xl:gap-9" aria-label="Hoofdmenu">
              {NAV_ITEMS.map((item) => (
                <div key={item.href} className="relative group">
                  <Link
                    href={item.href}
                    className={`inline-flex items-center gap-1 text-[13px] font-medium transition-colors hover:text-[#311e86] ${
                      isActive(item.href) ? "text-[#311e86] font-semibold" : "text-gray-700"
                    }`}
                    aria-haspopup={item.dropdown ? "true" : undefined}
                  >
                    {item.label}
                    {item.dropdown && <ChevronDown size={13} className="opacity-60" aria-hidden="true" />}
                  </Link>
                  {item.dropdown && (
                    <div className="absolute left-0 top-full pt-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible group-focus-within:opacity-100 group-focus-within:visible transition-all duration-200 ease-out z-50">
                      <div className="bg-white rounded-md shadow-lg border border-gray-100 py-2 min-w-[260px]">
                        {item.dropdown.map((dropdownItem) => (
                          <Link
                            key={dropdownItem.href}
                            href={dropdownItem.href}
                            className={`block px-4 py-2 text-sm hover:bg-gray-50 hover:text-[#311e86] transition-colors ${
                              pathname === dropdownItem.href ? "text-[#311e86] font-medium" : "text-gray-700"
                            }`}
                          >
                            {dropdownItem.label}
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </nav>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-3">
            <a
              href="tel:+31235173100"
              className="hidden xl:inline text-sm font-medium text-[#1e3a5f] hover:text-[#311e86] transition-colors mr-2"
            >
              023 517 31 00
            </a>
            {!loading && user ? (
              /* Logged in - Account dropdown */
              <div className="relative group">
                <button className="px-4 py-2 text-sm font-medium text-[#311e86] border border-[#311e86] rounded-full hover:bg-gray-50 transition-colors flex items-center gap-1.5">
                  Account
                  <svg className="w-3 h-3 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                <div className="absolute right-0 top-full pt-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible group-focus-within:opacity-100 group-focus-within:visible transition-all duration-200 ease-out z-50">
                  <div className="bg-white rounded-md shadow-lg border border-gray-100 py-2 min-w-[200px]">
                    <Link href="/mijn-aanvragen" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-[#311e86] transition-colors">
                      Huidige aanvragen
                    </Link>
                    <Link href="/financieringsaanvraag" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-[#311e86] transition-colors">
                      Nieuwe aanvraag
                    </Link>
                    {isAdmin && (
                      <Link href="/admin" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-[#311e86] transition-colors">
                        Beheer
                      </Link>
                    )}
                    <Link href="/account" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-[#311e86] transition-colors">
                      Accountinstellingen
                    </Link>
                    <div className="border-t border-gray-100 mt-1 pt-1">
                      <button
                        onClick={async () => { await logout(); router.push("/") }}
                        className="w-full text-left px-4 py-2 text-sm text-gray-500 hover:bg-gray-50 hover:text-red-500 transition-colors"
                      >
                        Uitloggen
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : !loading ? (
              /* Not logged in */
              <div className="relative group hidden lg:block">
                <Link
                  href="/login"
                  className="px-4 py-2 text-sm font-medium text-[#311e86] border border-[#311e86] rounded-full hover:bg-gray-50 transition-colors"
                >
                  Login
                </Link>
                <div className="absolute right-0 top-full pt-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible group-focus-within:opacity-100 group-focus-within:visible transition-all duration-200 ease-out z-50">
                  <div className="bg-white rounded-md shadow-lg border border-gray-100 py-2 min-w-[220px]">
                    {LOGIN_DROPDOWN.map((item) =>
                      item.external ? (
                        <a key={item.href} href={item.href} target="_blank" rel="noopener noreferrer"
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-[#311e86] transition-colors">
                          {item.label}
                        </a>
                      ) : (
                        <Link key={item.href} href={item.href}
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-[#311e86] transition-colors">
                          {item.label}
                        </Link>
                      )
                    )}
                  </div>
                </div>
              </div>
            ) : null}

            {/* Mobile menu button */}
            <button
              type="button"
              className="lg:hidden inline-flex items-center justify-center w-11 h-11 -mr-2 rounded-md text-[#311e86] hover:bg-gray-50"
              aria-label={mobileOpen ? "Menu sluiten" : "Menu openen"}
              aria-expanded={mobileOpen}
              aria-controls="mobiel-menu"
              onClick={() => setMobileOpen((open) => !open)}
            >
              {mobileOpen ? <X size={24} aria-hidden="true" /> : <Menu size={24} aria-hidden="true" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <nav
          id="mobiel-menu"
          aria-label="Hoofdmenu"
          className="lg:hidden border-t border-gray-100 bg-white max-h-[calc(100vh-88px)] overflow-y-auto"
        >
          <ul className="px-4 py-2 divide-y divide-gray-100">
            {NAV_ITEMS.map((item) => (
              <li key={item.href} className="py-1">
                {item.dropdown ? (
                  <>
                    <div className="flex items-center justify-between">
                      <Link
                        href={item.href}
                        className={`flex-1 py-3 text-base font-medium ${isActive(item.href) ? "text-[#311e86]" : "text-gray-800"}`}
                      >
                        {item.label}
                      </Link>
                      <button
                        type="button"
                        className="w-11 h-11 inline-flex items-center justify-center text-[#311e86]"
                        aria-label={openSection === item.href ? `${item.label} inklappen` : `${item.label} uitklappen`}
                        aria-expanded={openSection === item.href}
                        onClick={() => setOpenSection((current) => (current === item.href ? null : item.href))}
                      >
                        <ChevronDown
                          size={20}
                          aria-hidden="true"
                          className={`transition-transform ${openSection === item.href ? "rotate-180" : ""}`}
                        />
                      </button>
                    </div>
                    {openSection === item.href && (
                      <ul className="pb-2 pl-3 border-l-2 border-[#f75d20]/60 ml-1">
                        {item.dropdown.map((sub) => (
                          <li key={sub.href}>
                            <Link
                              href={sub.href}
                              className={`block py-2.5 text-[15px] ${pathname === sub.href ? "text-[#311e86] font-medium" : "text-gray-700"}`}
                            >
                              {sub.label}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    )}
                  </>
                ) : (
                  <Link
                    href={item.href}
                    className={`block py-3 text-base font-medium ${isActive(item.href) ? "text-[#311e86]" : "text-gray-800"}`}
                  >
                    {item.label}
                  </Link>
                )}
              </li>
            ))}
            {!loading && !user && (
              <li className="py-3">
                <Link
                  href="/login"
                  className="inline-block px-5 py-2.5 text-sm font-medium text-white bg-[#311e86] rounded-full hover:bg-[#261770] transition-colors"
                >
                  Login aanvragenportaal
                </Link>
                <Link
                  href="/financieringsaanvraag"
                  className="inline-block ml-3 px-5 py-2.5 text-sm font-medium text-[#311e86] border border-[#311e86] rounded-full hover:bg-gray-50 transition-colors"
                >
                  Aanvraag indienen
                </Link>
              </li>
            )}
          </ul>
        </nav>
      )}
    </header>
  )
}
