"use client"

import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"

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

export function Header() {
  const pathname = usePathname()

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

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-100">
      <div className="max-w-screen-2xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo and Navigation */}
          <div className="flex items-center gap-8">
            <Link href="/" className="flex-shrink-0">
              <Image
                src="/images/rkp-logo.png"
                alt="Roemer Kamp & Partners"
                width={200}
                height={60}
                className="h-16 w-auto"
                priority
              />
            </Link>

            {/* Navigation */}
            <nav className="hidden md:flex items-center gap-6">
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

          {/* Right side buttons */}
          <div className="flex items-center gap-3">
            <div className="relative group">
              <button
                className="px-4 py-2 text-sm font-medium text-[#311e86] border border-[#311e86] rounded-full hover:bg-gray-50 transition-colors"
              >
                Login
              </button>
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
          </div>
        </div>
      </div>
    </header>
  )
}
