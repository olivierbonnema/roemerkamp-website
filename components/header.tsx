"use client"

import Link from "next/link"
import Image from "next/image"
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

const PORTAL_PATHS = ["/mijn-aanvragen", "/financieringsaanvraag", "/admin"]

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
    { href: "https://rkp.portfolio.saxo", label: "Login bij Saxo Bank", external: true },
    { href: "https://client.roemerkamppartners.onperformativ.com/", label: "Login bij AFS", external: true },
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

              {/* Portal nav — where regular nav sits */}
              <nav className="hidden md:flex items-center gap-10">
                <Link
                  href="/mijn-aanvragen"
                  className={`text-[13px] font-medium transition-colors hover:text-[#311e86] ${
                    pathname === "/mijn-aanvragen" ? "text-[#311e86] font-semibold" : "text-gray-700"
                  }`}
                >
                  Mijn aanvragen
                </Link>
                <button
                  onClick={() => router.push("/financieringsaanvraag")}
                  className={`text-[13px] font-medium transition-colors hover:text-[#311e86] cursor-pointer bg-transparent border-none p-0 ${
                    pathname === "/financieringsaanvraag" ? "text-[#311e86] font-semibold" : "text-gray-700"
                  }`}
                >
                  Aanvraag indienen
                </button>
                {isAdmin && (
                  <Link
                    href="/admin"
                    className={`text-[13px] font-medium transition-colors hover:text-[#311e86] ${
                      pathname?.startsWith("/admin") ? "text-[#311e86] font-semibold" : "text-gray-700"
                    }`}
                  >
                    Admin
                  </Link>
                )}
              </nav>
            </div>

            <button
              onClick={async () => { await logout(); router.push("/") }}
              className="px-4 py-2 text-sm font-medium text-gray-600 border border-gray-300 rounded-full hover:border-gray-400 transition-colors"
            >
              Uitloggen
            </button>
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
              /* Logged in on a non-portal page — show portal shortcut */
              <div className="flex items-center gap-3">
                <Link
                  href="/mijn-aanvragen"
                  className="text-[13px] font-medium text-gray-700 transition-colors hover:text-[#311e86]"
                >
                  Mijn aanvragen
                </Link>
                <button
                  onClick={async () => { await logout(); router.push("/") }}
                  className="px-4 py-2 text-sm font-medium text-gray-600 border border-gray-300 rounded-full hover:border-gray-400 transition-colors"
                >
                  Uitloggen
                </button>
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
