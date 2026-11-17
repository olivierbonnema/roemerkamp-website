import { Suspense } from "react"
import { WachtwoordInstellenForm } from "@/components/auth/wachtwoord-instellen-form"
import { ui } from "@/components/portaal/portal-ui"

export const metadata = {
  title: "Wachtwoord instellen",
  robots: { index: false, follow: false },
}

export default function WachtwoordInstellenPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-white flex items-center justify-center">
          <div className={`${ui.spinner} w-8 h-8 border-2`} />
        </div>
      }
    >
      <WachtwoordInstellenForm />
    </Suspense>
  )
}
