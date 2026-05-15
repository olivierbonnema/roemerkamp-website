import { AdminLayout } from "@/components/admin/admin-layout"

export const metadata = {
  title: "Beheer",
  robots: { index: false, follow: false },
}

export default function AdminRootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <AdminLayout>{children}</AdminLayout>
}
