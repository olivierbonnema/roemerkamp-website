import Link from 'next/link'
import Image from 'next/image'

interface Crumb {
  label: string
  href: string
}

interface Cta {
  href: string
  label: string
}

interface PageHeroProps {
  title: string
  intro: string
  breadcrumbs: Crumb[]
  image?: { src: string; alt: string; position?: string }
  primary?: Cta
  secondary?: Cta
}

/**
 * Donkerblauwe paginakop voor product- en informatiepagina's.
 * De foto loopt op desktop door tot de rechterrand van het scherm, met een
 * donkerblauwe fade aan de linkerkant (zelfde opbouw als de homepage-hero).
 */
export function PageHero({ title, intro, breadcrumbs, image, primary, secondary }: PageHeroProps) {
  return (
    <section className="relative overflow-hidden bg-[#1e3a5f] text-white">
      <div className="relative z-10 max-w-[1200px] mx-auto px-5 md:px-10">
        <div className="max-w-[600px] py-10 md:py-14">
          <nav aria-label="Kruimelpad" className="text-[13px] text-[#c5cedb] mb-6">
            <Link href="/" className="hover:text-white transition-colors">Home</Link>
            {breadcrumbs.map((c, i) => (
              <span key={c.href}>
                <span aria-hidden="true" className="mx-2">/</span>
                {i === breadcrumbs.length - 1 ? (
                  <span className="text-[#c5cedb]">{c.label}</span>
                ) : (
                  <Link href={c.href} className="hover:text-white transition-colors">{c.label}</Link>
                )}
              </span>
            ))}
          </nav>
          <div className="w-14 h-[5px] bg-[#f75d20] mb-4" />
          <h1 className="font-serif font-normal text-white text-[30px] md:text-[42px] leading-[1.15]">
            {title}
          </h1>
          <p className="text-[17px] md:text-lg leading-relaxed text-[#e6eaf0] mt-4 md:mt-5">
            {intro}
          </p>
          {(primary || secondary) && (
            <div className="mt-7 flex gap-3 flex-wrap">
              {primary && (
                <Link
                  href={primary.href}
                  className="inline-block bg-[#cc4410] hover:bg-[#b83a0a] text-white px-6 py-3 text-sm font-medium rounded-full transition-colors"
                >
                  {primary.label}
                </Link>
              )}
              {secondary && (
                <Link
                  href={secondary.href}
                  className="inline-block border border-white/40 hover:border-white text-white px-6 py-3 text-sm font-medium rounded-full transition-colors"
                >
                  {secondary.label}
                </Link>
              )}
            </div>
          )}
        </div>
      </div>

      {image && (
        <>
          {/* Desktop: foto tot de rechterrand, met fade links */}
          <div className="absolute inset-y-0 right-0 left-[60%] hidden md:block">
            <div className="absolute inset-y-0 left-0 w-48 bg-gradient-to-r from-[#1e3a5f] to-transparent z-10" />
            <Image
              src={image.src}
              alt={image.alt}
              fill
              sizes="40vw"
              className="object-cover"
              style={{ objectPosition: image.position ?? 'center' }}
              priority
            />
          </div>
          {/* Mobiel: foto onder de tekst */}
          <div className="relative h-56 md:hidden">
            <Image
              src={image.src}
              alt={image.alt}
              fill
              sizes="100vw"
              className="object-cover"
              style={{ objectPosition: image.position ?? 'center' }}
            />
          </div>
        </>
      )}
    </section>
  )
}
