import { redirect } from "next/navigation"

// The overview of loans moved to the dashboard (2026-11-27). This address was
// live for a day, so a bookmark or an open tab still lands in the right place.
export default function LeningenPage() {
  redirect("/admin")
}
