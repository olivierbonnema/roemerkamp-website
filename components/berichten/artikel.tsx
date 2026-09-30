import Image from "next/image"
import Link from "next/link"
import type { ReactNode } from "react"
import { SectionHeading } from "@/components/section-heading"

// Building blocks for long-form articles under /berichten.
//
// The three original blogs were built as one narrow column of heading + text +
// bullet list, repeated five times. That is the shape every generated article
// has, and it is why they read as generated. These blocks follow the homepage
// and the product pages instead: full-width sections, text beside a large
// photograph, a dark band for the worked example, numbered steps — the same
// rhythm a visitor has just seen on the page they came from.

/* ── Hero: identical to the product pages, so the site feels like one site ── */

export function ArtikelHero({
  categorie,
  titel,
  intro,
  auteur,
  datumIso,
  datumTekst,
}: {
  categorie: string
  titel: ReactNode
  intro: string
  auteur: string
  datumIso: string
  datumTekst: string
}) {
  return (
    <section className="bg-[#1e3a5f] py-16 md:py-20">
      <div className="max-w-screen-2xl mx-auto px-4">
        <div className="max-w-3xl">
          <div className="flex items-center gap-2 text-white/60 text-sm mb-6">
            <Link href="/berichten" className="hover:text-white/80 transition-colors">Berichten</Link>
            <span>/</span>
            <span className="text-white/80">{categorie}</span>
          </div>
          <div className="w-16 h-1.5 bg-[#f75d20] mb-4" />
          <h1 className="text-[30px] md:text-[42px] font-serif font-normal text-white mb-5 leading-tight">{titel}</h1>
          <p className="text-white/80 leading-relaxed text-lg">{intro}</p>
          <div className="flex items-center gap-3 mt-6 text-white/60 text-sm">
            <span>{auteur}</span>
            <span>&middot;</span>
            <time dateTime={datumIso}>{datumTekst}</time>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ── Prose ── */

export function P({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <p className={`text-gray-700 leading-relaxed ${className}`}>{children}</p>
}

/* ── A plain section: heading with the orange bar, text limited to a readable width ── */

export function Sectie({
  kop,
  grijs = false,
  children,
}: {
  kop: string
  grijs?: boolean
  children: ReactNode
}) {
  return (
    <section className={`py-16 ${grijs ? "bg-gray-50" : "bg-white"}`}>
      <div className="max-w-screen-2xl mx-auto px-4">
        <SectionHeading>{kop}</SectionHeading>
        <div className="mt-6 max-w-3xl space-y-4">{children}</div>
      </div>
    </section>
  )
}

/* ── Text beside a photograph, as on the homepage ── */

export function TekstMetFoto({
  kop,
  foto,
  alt,
  fotoPositie = "center",
  fotoLinks = false,
  children,
}: {
  kop: string
  foto: string
  alt: string
  fotoPositie?: string
  fotoLinks?: boolean
  children: ReactNode
}) {
  return (
    <section className="py-16 bg-white">
      <div className="max-w-screen-2xl mx-auto px-4">
        <div className="grid md:grid-cols-2 gap-12 items-start">
          <div className={fotoLinks ? "md:order-2" : ""}>
            <SectionHeading>{kop}</SectionHeading>
            <div className="mt-6 space-y-4">{children}</div>
          </div>
          <div className={`relative h-[320px] md:h-[480px] ${fotoLinks ? "md:order-1" : ""}`}>
            <Image src={foto} alt={alt} fill sizes="(max-width: 768px) 100vw, 50vw" className="object-cover" style={{ objectPosition: fotoPositie }} />
          </div>
        </div>
      </div>
    </section>
  )
}

/* ── Worked example on the dark band, with a ruled table ── */

export function Rekenvoorbeeld({
  kop,
  toelichting,
  children,
}: {
  kop: string
  toelichting?: string
  children: ReactNode
}) {
  return (
    <section className="bg-[#1e3a5f] py-16">
      <div className="max-w-screen-2xl mx-auto px-4">
        <div className="grid md:grid-cols-[1fr_2fr] gap-12 items-start">
          <div>
            <div className="w-16 h-1.5 bg-[#f75d20] mb-4" />
            <h2 className="text-xl md:text-2xl font-serif font-semibold text-white">{kop}</h2>
            {toelichting && <p className="text-white/70 leading-relaxed mt-4">{toelichting}</p>}
          </div>
          <div className="space-y-6">{children}</div>
        </div>
      </div>
    </section>
  )
}

export function Tabel({
  kolommen,
  rijen,
  donker = false,
  uitgelichtRij,
}: {
  kolommen: string[]
  rijen: ReactNode[][]
  donker?: boolean
  /** Index of the row that carries the conclusion; rendered in the accent colour. */
  uitgelichtRij?: number
}) {
  const lijn = donker ? "border-white/20" : "border-gray-200"
  const kop = donker ? "text-white/60" : "text-gray-500"
  const tekst = donker ? "text-white" : "text-gray-800"
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className={`border-b ${lijn}`}>
            {kolommen.map((k, i) => (
              <th key={k} className={`py-2 pr-4 text-[11px] font-medium uppercase tracking-wide ${kop} ${i === 0 ? "text-left" : "text-right"}`}>
                {k}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rijen.map((rij, r) => {
            const accent = r === uitgelichtRij
            return (
              <tr key={r} className={`border-b ${lijn} ${accent ? "font-semibold" : ""}`}>
                {rij.map((cel, c) => (
                  <td
                    key={c}
                    className={`py-2.5 pr-4 ${c === 0 ? "text-left" : "text-right tabular-nums"} ${accent ? "text-[#f75d20]" : tekst}`}
                  >
                    {cel}
                  </td>
                ))}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

export function DonkerTekst({ children }: { children: ReactNode }) {
  return <p className="text-white/80 leading-relaxed">{children}</p>
}

/* ── Numbered steps, as on the product pages ── */

export function Stappen({ stappen }: { stappen: { titel: string; tekst: ReactNode }[] }) {
  return (
    <div className="grid md:grid-cols-2 gap-x-12 gap-y-10 mt-10 max-w-5xl">
      {stappen.map((s, i) => (
        <div key={s.titel} className="flex gap-5">
          <span className="flex-shrink-0 w-10 h-10 rounded-full bg-[#1e3a5f] text-white font-serif flex items-center justify-center text-lg">
            {i + 1}
          </span>
          <div>
            <h3 className="font-semibold text-[#1e3a5f] mb-2">{s.titel}</h3>
            <div className="text-gray-700 leading-relaxed space-y-3">{s.tekst}</div>
          </div>
        </div>
      ))}
    </div>
  )
}

/* ── A short aside from practice ── */

export function UitDePraktijk({ children }: { children: ReactNode }) {
  return (
    <div className="border-l-4 border-[#f75d20] bg-gray-50 pl-6 pr-6 py-5 my-2">
      <span className="block text-[11px] font-medium uppercase tracking-wide text-[#f75d20] mb-2">Uit de praktijk</span>
      <div className="text-gray-700 leading-relaxed space-y-3">{children}</div>
    </div>
  )
}

/* ── FAQ, same shape as the product pages ── */

export function Faq({ items }: { items: { vraag: string; antwoord: string }[] }) {
  return (
    <section className="py-16 bg-gray-50">
      <div className="max-w-screen-2xl mx-auto px-4">
        <SectionHeading>Veelgestelde vragen</SectionHeading>
        <div className="mt-8 max-w-3xl space-y-8">
          {items.map((item) => (
            <div key={item.vraag}>
              <h3 className="font-semibold text-[#1e3a5f] mb-2">{item.vraag}</h3>
              <P>{item.antwoord}</P>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ── One next step, not a generic "contact us" box ── */

export function Vervolg({
  kop,
  tekst,
  knop,
  tweede,
}: {
  kop: string
  tekst: string
  knop: { href: string; label: string }
  tweede?: { href: string; label: string }
}) {
  return (
    <section className="py-20 bg-white">
      <div className="max-w-screen-2xl mx-auto px-4">
        <div className="bg-[#1e3a5f] px-8 py-12 md:px-14 md:py-14">
          <div className="max-w-3xl">
            <div className="w-16 h-1.5 bg-[#f75d20] mb-4" />
            <h2 className="text-2xl md:text-3xl font-serif text-white mb-4">{kop}</h2>
            <p className="text-white/80 leading-relaxed text-lg mb-8">{tekst}</p>
            <div className="flex gap-3 flex-wrap">
              <Link
                href={knop.href}
                className="inline-block bg-[#f75d20] text-white px-6 py-3 text-sm font-medium rounded-full hover:bg-[#e04d10] transition-colors"
              >
                {knop.label}
              </Link>
              {tweede && (
                <Link
                  href={tweede.href}
                  className="inline-block border border-white/40 text-white px-6 py-3 text-sm font-medium rounded-full hover:border-white hover:bg-white/10 transition-colors"
                >
                  {tweede.label}
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
