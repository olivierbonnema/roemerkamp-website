import Link from "next/link"

export function ContactInfoSection() {
  return (
    <section className="py-16 bg-white">
      <div className="max-w-screen-2xl mx-auto px-4">
        <div className="max-w-xl">
          <p className="text-gray-700 text-sm mb-2">T (023) 517 31 06</p>
          <p className="text-gray-700 text-sm mb-6">
            <a href="mailto:welkom@roemerkamp.nl" className="hover:text-[#311e86]">welkom@roemerkamp.nl</a>
          </p>

          <Link
            href="/routebeschrijving"
            className="inline-block px-6 py-3 border border-[#311e86] text-[#311e86] text-sm font-medium rounded-full hover:bg-gray-50 transition-colors"
          >
            Download routebeschrijving
          </Link>
        </div>
      </div>
    </section>
  )
}
