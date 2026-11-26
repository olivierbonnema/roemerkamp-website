import Image from 'next/image'
import { ContactForm } from '@/components/contact-form'

interface ContactSectionProps {
  title?: string
  text: string
  image?: { src: string; alt: string; position?: string }
  /** From tablet up: the width and the side margin of the home page instead of 1200 px. On a phone the margin stays 20 px, because tables run to the screen edge with -mx-5. */
  wide?: boolean
}

/** Afsluitend contactblok: tekst en foto links, formulier rechts. */
export function ContactSection({ title = 'Spreek met een specialist', text, image, wide = false }: ContactSectionProps) {
  return (
    <section id="contact" className="bg-gray-50 border-t border-gray-200 scroll-mt-6">
      <div className={`mx-auto py-14 md:py-16 ${wide ? "max-w-screen-2xl px-5 md:px-4" : "max-w-[1200px] px-5 md:px-10"}`}>
        <div className="grid md:grid-cols-2 gap-10 md:gap-16 items-start">
          <div>
            <div className="w-14 h-[5px] bg-[#f75d20] mb-4" />
            <h2 className="font-serif font-semibold text-[#311e86] text-[22px] md:text-[26px] leading-snug mb-4">{title}</h2>
            <p className="text-base leading-[1.65] text-[#2a2f3a]">{text}</p>
            {image && (
              <div className="relative h-64 md:h-72 mt-6">
                <Image
                  src={image.src}
                  alt={image.alt}
                  fill
                  sizes="(min-width: 768px) 50vw, 100vw"
                  className="object-cover"
                  style={{ objectPosition: image.position ?? 'center' }}
                />
              </div>
            )}
          </div>
          <div className="bg-white border border-gray-200 p-6 md:p-7">
            <ContactForm />
          </div>
        </div>
      </div>
    </section>
  )
}
