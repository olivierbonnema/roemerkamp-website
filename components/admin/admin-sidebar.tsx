"use client"

import Link from "next/link"
import Image from "next/image"
import { usePathname, useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import {
  LayoutDashboard,
  FileText,
  FolderOpen,
  Users,
  Activity,
  Settings,
  LogOut,
  ChevronLeft,
} from "lucide-react"

const NAV_ITEMS = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/aanvragen", label: "Aanvragen", icon: FolderOpen },
  { href: "/admin/documenten", label: "Documenten", icon: FileText },
  { href: "/admin/gebruikers", label: "Gebruikers", icon: Users },
  { href: "/admin/activiteit", label: "Activiteit", icon: Activity },
]

const BOTTOM_ITEMS = [
  { href: "/admin/instellingen", label: "Instellingen", icon: Settings },
]

export function AdminSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { user, logout } = useAuth()

  function isActive(href: string, exact?: boolean) {
    if (exact) return pathname === href
    return pathname === href || (pathname?.startsWith(href + "/") ?? false)
  }

  async function handleLogout() {
    await logout()
    router.push("/")
  }

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-[240px] bg-[#1E3A5F] flex flex-col z-40">
      <div className="px-5 pt-6 pb-5">
        <Link href="/" className="block">
          <Image
            src="/images/lange-logo.svg"
            alt="Lange & Partners"
            width={220}
            height={55}
            className="h-[92px] w-auto brightness-0 invert"
            priority
          />
        </Link>
      </div>

      <nav className="flex-1 px-3 py-2 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const active = isActive(item.href, item.exact)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium font-sans transition-colors ${
                active
                  ? "bg-white/15 text-white"
                  : "text-white/60 hover:text-white hover:bg-white/8"
              }`}
            >
              <item.icon size={16} strokeWidth={active ? 2.2 : 1.8} />
              {item.label}
            </Link>
          )
        })}
      </nav>

      <div className="px-3 py-2 space-y-0.5 border-t border-white/10">
        {BOTTOM_ITEMS.map((item) => {
          const active = isActive(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium font-sans transition-colors ${
                active
                  ? "bg-white/15 text-white"
                  : "text-white/60 hover:text-white hover:bg-white/8"
              }`}
            >
              <item.icon size={16} strokeWidth={active ? 2.2 : 1.8} />
              {item.label}
            </Link>
          )
        })}

        <Link
          href="/portaal"
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium font-sans text-white/40 hover:text-white/60 transition-colors"
        >
          <ChevronLeft size={16} strokeWidth={1.8} />
          Terug naar portaal
        </Link>
      </div>

      <div className="px-4 py-3 border-t border-white/10">
        <p className="text-[11px] text-white/40 font-sans truncate mb-1">
          {user?.email}
        </p>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 text-[12px] text-white/40 hover:text-white/70 font-sans transition-colors"
        >
          <LogOut size={13} />
          Uitloggen
        </button>
      </div>
    </aside>
  )
}
