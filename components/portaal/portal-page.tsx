// The frame of a screen in the adviser portal, in the look of Beheer
// (components/admin): a light grey page, a small dark blue title at the top
// and white cards below it. Olivier, 17 November 2026: "doe het iets meer als
// het admin portaal" and "alles op het witte gedeelte gewoon in het midden".
//
// So, unlike Beheer, there is no bar on the left: the menu stays at the top
// (components/header.tsx) and everything sits in one column in the middle of
// the page. Nothing stands beside that column.
//
// Layout and class names only. What a screen shows and does is in its own
// component (components/portaal, mijn-aanvragen, financieringsaanvraag,
// account), which this file does not touch.
// Used by: app/portaal, app/mijn-aanvragen, app/mijn-aanvragen/[id],
// app/financieringsaanvraag, app/account.
import type { ReactNode } from "react"
import { Header } from "@/components/header"
import { PortalFooter } from "@/components/portal-footer"

export function PortalPage({ title, intro, children }: {
  title: string
  intro?: string
  children: ReactNode
}) {
  return (
    // The grey of the page is the grey of Beheer (components/admin/admin-layout.tsx).
    <div className="min-h-screen flex flex-col bg-[#f8f8fa]">
      <Header />
      <main className="flex-1">
        {/* px-4 as the head of the site, so the title starts under the logo
            on a screen that is narrower than the column. */}
        <div className="max-w-4xl mx-auto px-4 pt-8 md:pt-10 pb-16 md:pb-24">
          {/* Title and one line under it, as at the top of every Beheer screen. */}
          <div className="mb-6 md:mb-8">
            <h1 className="font-serif text-2xl text-[#1E3A5F]">{title}</h1>
            {intro && <p className="text-sm text-gray-500 font-sans mt-1 max-w-2xl">{intro}</p>}
          </div>
          {children}
        </div>
      </main>
      <PortalFooter />
    </div>
  )
}
