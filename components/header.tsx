"use client"

import Link from "next/link"
import Image from "next/image"
import { ShieldCheck } from "lucide-react"
import { usePathname, useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"

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

const PORTAL_PATHS = ["/mijn-aanvragen", "/financieringsaanvraag", "/admin", "/account"]

export function Header() {
  const pathname = usePathname()
  const router = useRouter()
  const { user, loading, logout, isAdmin } = useAuth()

  const isLoginPage = pathname === "/login"
  const isPortalPage = PORTAL_PATHS.some((p) => pathname?.startsWith(p))

  const navItems: NavItem[] = [
    {
      href: "/vermogensbeheer",
      label: "Vermogensbeheer",
      dropdown: [
        { href: "/vermogensbeheer#wat-we-doen", label: "Wat we doen" },
        { href: "/vermogensbeheer#wat-we-niet-doen", label: "Wat we niet doen" },
        { href: "/vermogensbeheer#voor-wie", label: "Voor wie we het doen" },
        { href: "/vermogensbeheer#vermogensregie", label: "Vermogensregie" },
        { href: "/vermogensbeheer#kosten", label: "Kosten" },
      ],
    },
    { href: "/private-markets", label: "Non-bancaire leningen" },
    { href: "/berichten", label: "Berichten" },
    {
      href: "/over-wmp",
      label: "Over ons",
      dropdown: [
        { href: "/over-wmp#wat-ons-drijft", label: "Wat ons drijft" },
        { href: "/over-wmp#wie-we-zijn", label: "Wie we zijn" },
        { href: "/over-wmp#in-memoriam", label: "In memoriam" },
      ],
    },
    { href: "/nadere-informatie", label: "Nadere informatie" },
    { href: "/contact", label: "Contact" },
  ]

  const loginDropdown: DropdownItem[] = [
    { href: "https://www.geldvoorelkaar.nl/langefinancieeladvies/mijn-gegevens/", label: "Login bij Geld voor Elkaar", external: true },
    { href: "https://www.collincrowdfund.nl/mijn-collin/", label: "Login bij Collin Crowdfund", external: true },
  ]

  /* ── Mode A: Login page — logo only ── */
  if (isLoginPage) {
    return (
      <header className="sticky top-0 z-50 bg-white border-b border-gray-100">
        <div className="max-w-screen-2xl mx-auto px-4 py-6">
          <Link href="/" className="flex items-center flex-shrink-0">
            <Image
              src="/images/lange-logo.svg"
              alt="Lange & Partners Non-bancair"
              width={340}
              height={85}
              className="h-[72px] w-auto -mt-4"
              priority
            />
          </Link>
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
              <Link href="/" className="flex items-center flex-shrink-0">
                <Image
                  src="/images/lange-logo.svg"
                  alt="Lange & Partners Non-bancair"
                  width={340}
                  height={85}
                  className="h-[72px] w-auto -mt-4"
                  priority
                />
              </Link>

              {/* Portal nav */}
              <nav className="hidden md:flex items-center gap-3">
                <Link
                  href="/mijn-aanvragen"
                  className={`px-3 py-1.5 rounded-full text-[13px] font-medium transition-colors ${
                    pathname === "/mijn-aanvragen"
                      ? "bg-[#311e86]/10 text-[#311e86]"
                      : "text-gray-600 hover:text-[#311e86] hover:bg-gray-50"
                  }`}
                >
                  Mijn aanvragen
                </Link>
                <Link
                  href="/financieringsaanvraag"
                  className={`px-4 py-1.5 rounded-full text-[13px] font-medium transition-colors border ${
                    pathname === "/financieringsaanvraag"
                      ? "bg-[#311e86]/10 text-[#311e86] border-[#311e86]/30"
                      : "text-[#311e86] border-[#311e86]/30 hover:bg-[#311e86]/10"
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
              <div className="absolute right-0 top-full pt-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 ease-out z-50">
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
      <div className="max-w-screen-2xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between">
          {/* Logo and Navigation */}
          <div className="flex items-center gap-10">
            <Link href="/" className="flex items-center flex-shrink-0">
              <Image
                src="/images/lange-logo.svg"
                alt="Lange & Partners Non-bancair"
                width={340}
                height={85}
                className="h-[72px] w-auto -mt-4"
                priority
              />
            </Link>

            <nav className="hidden md:flex items-center gap-10">
              {navItems.map((item) => (
                <div key={item.href} className="relative group">
                  <Link
                    href={item.href}
                    className={`text-[13px] font-medium transition-colors hover:text-[#311e86] ${
                      pathname === item.href || pathname?.startsWith(item.href + "/")
                        ? "text-[#311e86] font-semibold"
                        : "text-gray-700"
                    }`}
                  >
                    {item.label}
                  </Link>
                  {item.dropdown && (
                    <div className="absolute left-0 top-full pt-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 ease-out">
                      <div className="bg-white rounded-md shadow-lg border border-gray-100 py-2 min-w-[200px]">
                        {item.dropdown.map((dropdownItem) => (
                          <Link
                            key={dropdownItem.href}
                            href={dropdownItem.href}
                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-[#311e86] transition-colors"
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
              /* Logged in — Account dropdown */
              <div className="relative group">
                <button className="px-4 py-2 text-sm font-medium text-[#311e86] border border-[#311e86] rounded-full hover:bg-gray-50 transition-colors flex items-center gap-1.5">
                  Account
                  <svg className="w-3 h-3 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                <div className="absolute right-0 top-full pt-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 ease-out z-50">
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
              <div className="relative group">
                <Link
                  href="/login"
                  className="px-4 py-2 text-sm font-medium text-[#311e86] border border-[#311e86] rounded-full hover:bg-gray-50 transition-colors"
                >
                  Login
                </Link>
                <div className="absolute right-0 top-full pt-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 ease-out">
                  <div className="bg-white rounded-md shadow-lg border border-gray-100 py-2 min-w-[200px]">
                    {loginDropdown.map((item) => (
                      <a
                        key={item.href}
                        href={item.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-[#311e86] transition-colors"
                      >
                        {item.label}
                      </a>
                    ))}
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </header>
  )
}
