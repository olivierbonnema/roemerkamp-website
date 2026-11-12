// The look of the portal: the building blocks every portal screen is made of.
//
// Olivier, 2026-11-12: the portal has to look like the rest of the website.
// So these follow the product pages (components/product/*): the dark blue
// page head with the orange bar, one left edge on a 1200 px grid, a reading
// column with a side column, square frames with hairlines, and round shapes
// only for what you click or type in.
//
// Nothing here knows about data or does anything: it is layout and class
// names. Kept apart from components/product on purpose, so a change to the
// portal can never touch a public page and the other way round.
//
// Rules of thumb, so a new portal screen comes out the same:
//   - one <PortalHero>, then <PortalColumns> with the content and a side column
//   - at most one <Panel accent> per screen, for what matters most there
//   - text is 16 px in ink (#2a2f3a); notes are 14 px in slate (#5b6472)
//   - frames are square, buttons and fields are pills
import type { ReactNode } from "react"
import Link from "next/link"
import Image from "next/image"

/* ── Class names ── */

// Never two classes for the same thing in one string (mt-1.5 next to mt-3):
// which one wins is then decided by the stylesheet, not by the order here. So
// a shared style below leaves out whatever differs from place to place (the
// space around an error line, the size of the turning ring): add that where
// the style is used.
const button =
  "inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-medium rounded-full transition-colors cursor-pointer " +
  "disabled:opacity-60 disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#311e86]"
const field =
  "w-full h-12 text-base bg-white border rounded-full text-[#2a2f3a] placeholder:text-gray-400 outline-none transition-colors " +
  "focus:border-[#311e86] focus:ring-2 focus:ring-[#311e86]/15"

export const ui = {
  /** The usual action: next step, continue, upload. */
  buttonPrimary: `${button} bg-[#311e86] text-white hover:bg-[#261770]`,
  /** The one call to action of the site: submitting an aanvraag. */
  buttonCta: `${button} bg-[#cc4410] text-white hover:bg-[#b83a0a]`,
  /** A second choice next to a primary one. */
  buttonSecondary: `${button} border border-[#311e86] text-[#311e86] bg-white hover:bg-[#311e86]/5`,
  /** A small button inside a row or a panel. */
  buttonSmall:
    "inline-flex items-center justify-center gap-1.5 px-4 py-2 text-sm font-medium rounded-full border border-[#311e86] text-[#311e86] bg-white " +
    "hover:bg-[#311e86]/5 transition-colors cursor-pointer whitespace-nowrap disabled:opacity-60 disabled:cursor-not-allowed " +
    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#311e86]",
  /** A link in running text or under a list. */
  link: "font-medium text-[#1e3a5f] underline underline-offset-2 hover:text-[#311e86] cursor-pointer",
  /** A link that undoes or removes something. */
  linkQuiet: "text-sm text-[#5b6472] underline underline-offset-2 hover:text-red-700 cursor-pointer",

  /** Text fields, selects and date fields. Add fieldOk or fieldError. */
  field: `${field} px-5`,
  /** The same without the space left and right, for a field with a sign in it (pl-10 pr-5). */
  fieldBare: field,
  fieldOk: "border-gray-300",
  fieldError: "border-red-600",
  label: "block text-[15px] font-medium text-[#1e3a5f] mb-1.5",
  /** What went wrong. No space of its own: add the margin where it is used. */
  error: "text-sm leading-relaxed text-red-700",

  /** Running text and notes. */
  text: "text-base leading-[1.65] text-[#2a2f3a]",
  note: "text-sm leading-relaxed text-[#5b6472]",
  /** Label above a value, as in the key facts on the product pages. */
  factLabel: "text-sm leading-snug text-[#5b6472]",
  factValue: "text-[15px] leading-snug font-medium text-[#1e3a5f] break-words",

  /** Messages. Square, with a bar on the left, as the contact form's thanks. */
  noticeInfo: "border-l-4 border-[#1e3a5f] bg-gray-50 px-5 py-4",
  noticeWarn: "border-l-4 border-amber-500 bg-amber-50 px-5 py-4",
  noticeError: "border-l-4 border-red-600 bg-red-50 px-5 py-4",
  noticeOk: "border-l-4 border-emerald-600 bg-emerald-50 px-5 py-4",

  /** The turning ring. Give it its size and line where it is used (w-4 h-4 border-2). */
  spinner: "border-[#311e86] border-t-transparent rounded-full animate-spin shrink-0",
}

/* ── Page head ── */

interface Crumb {
  label: string
  href: string
}

interface PortalHeroProps {
  title: string
  intro?: string
  /** The path below "Portaal". The last one is the page itself. */
  crumbs?: Crumb[]
  /** A photo on the right, on wide screens only (a working screen stays short on a phone). */
  image?: { src: string; alt: string; position?: string }
}

/** The dark blue page head, built like the one on the product pages. */
export function PortalHero({ title, intro, crumbs = [], image }: PortalHeroProps) {
  return (
    <section className="relative overflow-hidden bg-[#1e3a5f] text-white">
      <div className="relative z-10 max-w-[1200px] mx-auto px-5 md:px-10">
        <div className="max-w-[600px] py-10 md:py-14">
          <nav aria-label="Kruimelpad" className="text-[13px] text-[#c5cedb] mb-6">
            {crumbs.length === 0 ? (
              <span>Portaal</span>
            ) : (
              <Link href="/portaal" className="hover:text-white transition-colors">Portaal</Link>
            )}
            {crumbs.map((c, i) => (
              <span key={c.href}>
                <span aria-hidden="true" className="mx-2">/</span>
                {i === crumbs.length - 1 ? (
                  <span>{c.label}</span>
                ) : (
                  <Link href={c.href} className="hover:text-white transition-colors">{c.label}</Link>
                )}
              </span>
            ))}
          </nav>
          <div className="w-14 h-[5px] bg-[#f75d20] mb-4" />
          <h1 className="font-serif font-normal text-white text-[30px] md:text-[42px] leading-[1.15]">{title}</h1>
          {intro && <p className="text-[17px] md:text-lg leading-relaxed text-[#e6eaf0] mt-4 md:mt-5">{intro}</p>}
        </div>
      </div>
      {image && (
        <div className="absolute inset-y-0 right-0 left-[60%] hidden lg:block">
          <div className="absolute inset-y-0 left-0 w-48 bg-gradient-to-r from-[#1e3a5f] to-transparent z-10" />
          <Image
            src={image.src}
            alt={image.alt}
            fill
            sizes="40vw"
            className="object-cover"
            style={{ objectPosition: image.position ?? "center" }}
            priority
          />
        </div>
      )}
    </section>
  )
}

/* ── Page body ── */

/**
 * The content of a portal screen: a column of at most 720 px and, when given,
 * a side column of 360 px that stays in view while the page scrolls. On a
 * phone the side column comes under the content.
 */
export function PortalColumns({ children, aside }: { children: ReactNode; aside?: ReactNode }) {
  return (
    <div className="max-w-[1200px] mx-auto px-5 md:px-10 pt-10 md:pt-14 pb-16 md:pb-24">
      <div className={aside ? "grid gap-10 lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-x-14 items-start" : ""}>
        <div className="min-w-0 max-w-[720px]">{children}</div>
        {aside && (
          // The site head is about 104 px high and stays on top.
          <aside className="space-y-4 lg:sticky lg:top-[120px] lg:max-h-[calc(100vh-136px)] lg:overflow-y-auto">
            {aside}
          </aside>
        )}
      </div>
    </div>
  )
}

/** A frame in the side column. `accent`: the one that matters most on the screen. */
export function Panel({ title, accent = false, children, className = "" }: {
  title?: string
  accent?: boolean
  children: ReactNode
  className?: string
}) {
  return (
    <section className={`border border-gray-200 bg-white px-6 py-5 ${accent ? "border-t-[5px] border-t-[#f75d20]" : ""} ${className}`}>
      {title && <h2 className="text-lg font-semibold text-[#1e3a5f] mb-2">{title}</h2>}
      {children}
    </section>
  )
}

/** A heading inside the content column. */
export function SectionTitle({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <h2 className={`font-serif font-semibold text-[#311e86] text-[22px] md:text-[26px] leading-snug ${className}`}>
      {children}
    </h2>
  )
}

/**
 * The grid for the facts of an aanvraag (a <dl> with <Fact>s in it). Two
 * columns on a phone, three on a tablet and on a wide screen. Next to the side
 * column on a laptop the content is narrow again, so two there.
 * Add the space between the rows where it is used (gap-y-*).
 */
export const FACT_GRID = "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3 gap-x-6"

/**
 * Label and value under each other, for the facts of an aanvraag. Shows nothing
 * without a value.
 *
 * A word that does not fit in one column of FACT_GRID (an e-mail address,
 * "Overbruggingsfinanciering") would be cut in the middle. Such a fact takes
 * two columns instead. One column holds about 18 characters on the narrowest
 * phone and about 27 on a wide screen.
 */
export function Fact({ label, value }: { label: string; value?: string | number | null }) {
  const v = value === 0 ? "0" : typeof value === "string" ? value.trim() : value
  if (v === undefined || v === null || v === "") return null
  const longestWord = Math.max(...String(v).split(/\s+/).map((word) => word.length))
  const span = longestWord >= 27 ? "col-span-2" : longestWord >= 18 ? "col-span-2 lg:col-span-1" : undefined
  return (
    <div className={span}>
      <dt className={ui.factLabel}>{label}</dt>
      <dd className={`${ui.factValue} m-0 mt-0.5`}>{v}</dd>
    </div>
  )
}

/**
 * How to reach Lange & Partners: the same details as in the head and foot of
 * the site. Kept to a few lines, so it fits under the main frame of the side
 * column on a laptop screen without the column having to scroll.
 */
export function ContactPanel() {
  const contact = "font-medium text-[#1e3a5f] whitespace-nowrap hover:text-[#311e86] hover:underline"
  return (
    <Panel title="Vragen over een aanvraag?">
      <p className="text-[15px] leading-relaxed text-[#2a2f3a]">
        Bel <a href="tel:0235173100" className={contact}>(023) 517 31 00</a> of mail naar{" "}
        <a href="mailto:info@langefa.nl" className={contact}>info@langefa.nl</a>, dan kijken wij met u mee.
      </p>
    </Panel>
  )
}
