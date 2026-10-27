import type { ReactNode } from 'react'

interface ArticleLayoutProps {
  children: ReactNode
  aside: ReactNode
}

/**
 * Tweekoloms opbouw voor informatieve pagina's: een leeskolom van maximaal
 * 720 px en een vaste zijkolom (kerngegevens, contact, inhoudsopgave) die op
 * desktop meescrolt. Op telefoon komt de zijkolom onder de tekst.
 */
export function ArticleLayout({ children, aside }: ArticleLayoutProps) {
  return (
    <div className="max-w-[1200px] mx-auto px-5 md:px-10 pt-10 md:pt-14 pb-16">
      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-x-14 items-start">
        <article className="artikel max-w-[720px] min-w-0">{children}</article>
        {/* De kopregel is sticky (circa 104 px hoog op desktop); de zijkolom blijft daaronder
            hangen. Past de zijkolom niet in het scherm, dan scrolt hij intern in plaats van
            afgesneden te worden. */}
        <aside
          className="lg:sticky lg:top-[120px] lg:max-h-[calc(100vh-136px)] lg:overflow-y-auto space-y-4"
          aria-label="Kerngegevens en inhoudsopgave"
        >
          {aside}
        </aside>
      </div>
    </div>
  )
}

interface ArticleSectionProps {
  id: string
  title: string
  children: ReactNode
}

/** Een sectie met kop, gescheiden door witruimte en een dunne lijn. */
export function ArticleSection({ id, title, children }: ArticleSectionProps) {
  return (
    <section id={id} className="scroll-mt-6 pt-10 mt-10 border-t border-gray-200 first-of-type:pt-0 first-of-type:mt-0 first-of-type:border-t-0">
      <h2 className="font-serif font-semibold text-[#311e86] text-[22px] md:text-[26px] leading-snug mb-4">
        {title}
      </h2>
      {children}
    </section>
  )
}

/** Inleidende alinea boven de eerste sectie. */
export function Lead({ children }: { children: ReactNode }) {
  return (
    <p className="lead text-lg md:text-[19px] leading-relaxed text-[#1e3a5f] mb-7">{children}</p>
  )
}

/** Kleine toelichting onder een tabel. */
export function Note({ children }: { children: ReactNode }) {
  return <p className="note text-sm leading-relaxed text-[#5b6472] mt-3">{children}</p>
}
