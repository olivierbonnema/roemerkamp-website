interface KeyFact {
  label: string
  value: string
}

/**
 * Paneel met kerngegevens (bedrag, looptijd, LTV, rente, enzovoort).
 * Compact gehouden, zodat kerngegevens en inhoudsopgave samen in beeld passen
 * naast een scrollend artikel.
 */
export function KeyFacts({ title = 'Kerngegevens', items }: { title?: string; items: KeyFact[] }) {
  return (
    <div className="border border-gray-200 border-t-[5px] border-t-[#f75d20] px-5 py-4 bg-white">
      <h3 className="text-base font-semibold text-[#1e3a5f] mb-1">{title}</h3>
      <dl className="grid grid-cols-[104px_minmax(0,1fr)]">
        {items.map((f, i) => {
          const border = i === items.length - 1 ? '' : 'border-b border-gray-100'
          return (
            <div key={f.label} className="contents">
              <dt className={`py-1.5 pr-3 text-sm leading-snug text-[#5b6472] ${border}`}>{f.label}</dt>
              <dd className={`py-1.5 text-sm leading-snug font-medium text-[#1e3a5f] ${border}`}>{f.value}</dd>
            </div>
          )
        })}
      </dl>
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
    <nav className="border border-gray-200 px-5 py-4 bg-white" aria-label="Op deze pagina">
      <h3 className="text-base font-semibold text-[#1e3a5f] mb-1">Op deze pagina</h3>
      <ol className="list-none m-0 p-0">
        {items.map((item, i) => (
          <li
            key={item.id}
            className={`py-1.5 text-sm leading-snug ${i === items.length - 1 ? '' : 'border-b border-gray-100'}`}
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
