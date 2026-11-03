import type { ReactNode } from 'react'
import Link from 'next/link'

/* ── Tabellen ── */

interface DataTableProps {
  head?: string[]
  rows: ReactNode[][]
  /** Eerste kolom als label (donkerblauw, medium). Standaard aan. */
  labelColumn?: boolean
  /** Laatste kolom rechts uitlijnen (voor bedragen). */
  alignLast?: 'left' | 'right'
  caption?: string
}

/** Tabel voor voorwaarden, vergelijkingen en rekenvoorbeelden. Scrolt op telefoon horizontaal. */
export function DataTable({ head, rows, labelColumn = true, alignLast = 'left', caption }: DataTableProps) {
  return (
    <div className="overflow-x-auto -mx-5 px-5 md:mx-0 md:px-0">
      <table className="w-full border-collapse text-[15px] md:text-base leading-relaxed">
        {caption && <caption className="sr-only">{caption}</caption>}
        {head && (
          <thead>
            <tr>
              {head.map((h, i) => (
                <th
                  key={i}
                  scope="col"
                  className="text-left align-top px-3.5 py-3 bg-gray-50 border-b border-gray-200 text-[13px] font-medium uppercase tracking-wide text-[#1e3a5f]"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
        )}
        <tbody>
          {rows.map((cells, r) => (
            <tr key={r}>
              {cells.map((cell, c) => {
                const isLabel = labelColumn && c === 0
                const isLast = c === cells.length - 1
                const align = isLast && alignLast === 'right' ? 'text-right' : 'text-left'
                const Tag = isLabel ? 'th' : 'td'
                return (
                  <Tag
                    key={c}
                    scope={isLabel ? 'row' : undefined}
                    className={`align-top px-3.5 py-3 border-b border-gray-200 ${align} ${
                      isLabel ? 'font-medium text-[#1e3a5f] w-[34%]' : 'text-[#2a2f3a]'
                    }`}
                  >
                    {cell}
                  </Tag>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/* ── Definitielijst (situaties) ── */

interface DefinitionItem {
  term: string
  text: string
}

export function DefinitionList({ items }: { items: DefinitionItem[] }) {
  return (
    <dl className="m-0">
      {items.map((item, i) => (
        <div key={item.term} className={`py-4 ${i === items.length - 1 ? '' : 'border-b border-gray-100'}`}>
          <dt className="font-semibold text-[#1e3a5f] text-base mb-1">{item.term}</dt>
          <dd className="m-0 text-base leading-[1.65] text-[#2a2f3a]">{item.text}</dd>
        </div>
      ))}
    </dl>
  )
}

/* ── Genummerde stappen ── */

interface Step {
  title: string
  text: string
}

export function Steps({ items }: { items: Step[] }) {
  return (
    <ol className="list-none m-0 p-0">
      {items.map((s, i) => (
        <li
          key={s.title}
          className={`grid grid-cols-[40px_minmax(0,1fr)] md:grid-cols-[56px_minmax(0,1fr)] gap-4 py-5 ${
            i === items.length - 1 ? '' : 'border-b border-gray-100'
          }`}
        >
          <span aria-hidden="true" className="text-[22px] font-medium text-[#311e86] leading-tight">
            {i + 1}
          </span>
          <div>
            <h3 className="text-lg font-semibold text-[#1e3a5f] mb-1.5">{s.title}</h3>
            <p className="m-0">{s.text}</p>
          </div>
        </li>
      ))}
    </ol>
  )
}

/* ── Veelgestelde vragen ── */

interface FaqItem {
  vraag: string
  antwoord: string
}

export function FaqList({ items }: { items: FaqItem[] }) {
  return (
    <div className="space-y-6">
      {items.map((item) => (
        <div key={item.vraag}>
          <h3 className="text-lg font-semibold text-[#1e3a5f] mb-1.5">{item.vraag}</h3>
          <p className="m-0">{item.antwoord}</p>
        </div>
      ))}
    </div>
  )
}

/* ── Verwante pagina's ── */

interface RelatedItem {
  href: string
  title: string
  text: string
}

export function RelatedList({ items }: { items: RelatedItem[] }) {
  return (
    <ul className="list-none m-0 p-0">
      {items.map((item, i) => (
        <li key={item.href} className={`py-3.5 ${i === items.length - 1 ? '' : 'border-b border-gray-100'}`}>
          <Link href={item.href} className="text-[17px] font-semibold text-[#1e3a5f] hover:text-[#311e86] hover:underline">
            {item.title}
          </Link>
          <p className="m-0 mt-0.5 text-[15px] md:text-base leading-relaxed text-[#2a2f3a]">{item.text}</p>
        </li>
      ))}
    </ul>
  )
}

/* ── Vetgedrukte inleiding van een alinea ── */

export function Strong({ children }: { children: ReactNode }) {
  return <strong className="font-semibold text-[#1e3a5f]">{children}</strong>
}
