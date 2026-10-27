import Link from 'next/link'

interface KeyFact {
  label: string
  value: string
}

/** Paneel met kerngegevens (bedrag, looptijd, LTV, rente, enzovoort). */
export function KeyFacts({ title = 'Kerngegevens', items }: { title?: string; items: KeyFact[] }) {
  return (
    <div className="border border-gray-200 border-t-[5px] border-t-[#f75d20] p-6 bg-white">
      <h3 className="text-lg font-semibold text-[#1e3a5f] mb-3">{title}</h3>
      <dl className="grid grid-cols-[110px_minmax(0,1fr)] md:grid-cols-[120px_minmax(0,1fr)]">
        {items.map((f, i) => {
          const last = i === items.length - 1
          const border = last ? '' : 'border-b border-gray-100'
          return (
            <div key={f.label} className="contents">
              <dt className={`py-2 pr-3 text-[15px] leading-snug text-[#5b6472] ${border}`}>{f.label}</dt>
              <dd className={`py-2 text-[15px] leading-snug font-medium text-[#1e3a5f] ${border}`}>{f.value}</dd>
            </div>
          )
        })}
      </dl>
    </div>
  )
}

/** Paneel met telefoonnummer, openingstijden en de twee knoppen. */
export function ContactPanel() {
  return (
    <div className="bg-gray-50 p-6">
      <h3 className="text-lg font-semibold text-[#1e3a5f] mb-1">Direct contact</h3>
      <a href="tel:+31235173100" className="inline-block text-[22px] font-semibold text-[#1e3a5f] hover:text-[#311e86] transition-colors">
        023 517 31 00
      </a>
      <p className="text-sm leading-relaxed text-[#5b6472] mt-1 mb-4">
        Maandag tot en met vrijdag, 9.00 tot 17.00 uur. Wilhelminastraat 50, Haarlem.
      </p>
      <div className="flex flex-col gap-2.5">
        <Link
          href="/financieringsaanvraag"
          className="block text-center bg-[#cc4410] hover:bg-[#b83a0a] text-white px-6 py-3 text-sm font-medium rounded-full transition-colors"
        >
          Aanvraag indienen
        </Link>
        <Link
          href="/contact"
          className="block text-center border border-[#1e3a5f] text-[#1e3a5f] hover:border-[#311e86] hover:text-[#311e86] bg-white px-6 py-3 text-sm font-medium rounded-full transition-colors"
        >
          Stel een vraag
        </Link>
      </div>
    </div>
  )
}

interface TocItem {
  id: string
  label: string
}

/** Inhoudsopgave met ankerlinks naar de secties op de pagina. */
export function OnThisPage({ items }: { items: TocItem[] }) {
  return (
    <nav className="border border-gray-200 p-6 bg-white" aria-label="Op deze pagina">
      <h3 className="text-base font-semibold text-[#1e3a5f] mb-2">Op deze pagina</h3>
      <ol className="list-none m-0 p-0">
        {items.map((item, i) => (
          <li
            key={item.id}
            className={`py-1.5 text-[15px] leading-snug ${i === items.length - 1 ? '' : 'border-b border-gray-100'}`}
          >
            <a href={`#${item.id}`} className="text-[#1e3a5f] hover:text-[#311e86] hover:underline">
              {item.label}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  )
}
