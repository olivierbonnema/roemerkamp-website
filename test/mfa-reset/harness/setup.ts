// Imported first by the tests of this folder: fixed settings. The routes read
// ADMIN_DOMAIN when they are loaded, so it has to be set before they are.
process.env.ADMIN_DOMAIN = "beheer.test"
// One admin who is named by address instead of by domain (lib/admin.ts).
process.env.NEXT_PUBLIC_ADMIN_EMAILS = "Extra.Beheerder@elders.test"
