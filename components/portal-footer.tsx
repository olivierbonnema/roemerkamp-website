import Link from "next/link"
import Image from "next/image"

export function PortalFooter() {
  const year = new Date().getFullYear()

  return (
    <footer className="border-t border-gray-100 bg-white mt-auto">
      <div className="max-w-screen-2xl mx-auto px-4 py-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Image
            src="/images/lange-logo.svg"
            alt="Lange & Partners"
            width={120}
            height={30}
            className="h-[28px] w-auto opacity-60"
          />
        </div>
        <div className="flex items-center gap-6">
          <span className="text-xs text-gray-400 font-sans">
            © {year} Lange & Partners Non-bancair
          </span>
          <Link
            href="/"
            className="text-xs text-gray-400 hover:text-[#311e86] font-sans transition-colors"
          >
            ← Terug naar website
          </Link>
        </div>
      </div>
    </footer>
  )
}
