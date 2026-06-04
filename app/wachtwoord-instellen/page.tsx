import { Suspense } from "react"
import { WachtwoordInstellenForm } from "@/components/auth/wachtwoord-instellen-form"

export const metadata = {
  title: "Wachtwoord instellen",
  robots: { index: false, follow: false },
}

export default function WachtwoordInstellenPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#f5f5f7] flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-[#1E3A5F] border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <WachtwoordInstellenForm />
    </Suspense>
  )
}
