// The admin login must not appear in search results (SEO audit 21-10-2026).
// The page itself is a client component, so the metadata lives here.
export const metadata = {
  title: "Admin login",
  robots: { index: false, follow: false },
}

export default function AdminLoginLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
