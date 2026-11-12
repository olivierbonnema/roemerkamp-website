// Imported first by the route tests: fixed settings and the fake Graph.
import { fakeDrive } from "./fake-graph"

process.env.ADMIN_DOMAIN = "beheer.test"
process.env.NEXT_PUBLIC_ADMIN_EMAILS = ""
process.env.MICROSOFT_TENANT_ID = "tenant"
process.env.MICROSOFT_CLIENT_ID = "client"
process.env.MICROSOFT_CLIENT_SECRET = "not-a-real-secret"
process.env.SHAREPOINT_DRIVE_ID = "drive"
delete process.env.SHAREPOINT_FOLDER_PATH

globalThis.fetch = fakeDrive.fetch as typeof fetch
