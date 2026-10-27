"use client"

import Link from "next/link"
import Image from "next/image"
import { useEffect, useState } from "react"
import { ShieldCheck, Menu, X, ChevronDown } from "lucide-react"
import { usePathname, useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { PRODUCT_PAGES, INVESTOR_PAGES } from "@/lib/site-nav"

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

// Public navigation. Product pages come from lib/site-nav.ts so menu, footer,
// homepage and sitemap stay in sync.
const NAV_ITEMS: NavItem[] = [
  {
    href: "/voor-leningnemers",
    label: "Voor leningnemers",
    dropdown: [
      { href: "/voor-leningnemers", label: "Overzicht financieringen" },
      ...PRODUCT_PAGES.map((p) => ({ href: p.href, label: p.label })),
    ],
  },
  {
    href: "/voor-investeerders",
    label: "Voor investeerders",
    dropdown: INVESTOR_PAGES.map((p) => ({ href: p.href, label: p.label })),
  },
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
    return (
      <header className="sticky top-0 z-50 bg-white border-b border-gray-100">
        <div className="max-w-screen-2xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-10">
              <Logo />

              {/* Portal nav */}
              <nav className="hidden md:flex items-center gap-3">
                <Link
                  href="/portaal"
                  className={`px-4 py-1.5 rounded-full text-[13px] font-medium transition-colors border ${
                    pathname === "/portaal"
                      ? "bg-[#311e86] text-white border-[#311e86]"
                      : "text-[#311e86] border-[#311e86]/40 hover:bg-[#311e86]/10"
                  }`}
                >
                  Home
                </Link>
                <Link
                  href="/mijn-aanvragen"
                  className={`px-4 py-1.5 rounded-full text-[13px] font-medium transition-colors border ${
                    pathname === "/mijn-aanvragen"
                      ? "bg-[#311e86] text-white border-[#311e86]"
                      : "text-[#311e86] border-[#311e86]/40 hover:bg-[#311e86]/10"
                  }`}
                >
                  Mijn aanvragen
                </Link>
                <Link
                  href="/financieringsaanvraag"
                  className={`px-4 py-1.5 rounded-full text-[13px] font-medium transition-colors border ${
                    pathname === "/financieringsaanvraag"
                      ? "bg-[#311e86] text-white border-[#311e86]"
                      : "text-[#311e86] border-[#311e86]/40 hover:bg-[#311e86]/10"
                  }`}
                >
                  Aanvraag indienen
                </Link>
                {isAdmin && (
                  <Link
                    href="/admin"
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[13px] font-medium transition-colors ${
                      pathname?.startsWith("/admin")
                        ? "bg-gray-100 text-gray-700"
                        : "text-gray-400 hover:text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    <ShieldCheck size={13} />
                    Admin
                  </Link>
                )}
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

            <nav className="hidden md:flex items-center gap-10" aria-label="Hoofdmenu">
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
              <div className="relative group hidden md:block">
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
              className="md:hidden inline-flex items-center justify-center w-11 h-11 -mr-2 rounded-md text-[#311e86] hover:bg-gray-50"
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
          className="md:hidden border-t border-gray-100 bg-white max-h-[calc(100vh-88px)] overflow-y-auto"
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
