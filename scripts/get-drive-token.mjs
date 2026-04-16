/**
 * Run once to get a Google OAuth refresh token:
 *   node scripts/get-drive-token.mjs
 *
 * You will need your OAuth Client ID and Client Secret from Google Cloud Console.
 */

import { createServer } from "http"
import { parse } from "url"
import { readFileSync, writeFileSync } from "fs"

const CLIENT_ID     = process.env.OAUTH_CLIENT_ID
const CLIENT_SECRET = process.env.OAUTH_CLIENT_SECRET
const REDIRECT_URI  = "http://localhost:4000/callback"
const SCOPE         = "https://www.googleapis.com/auth/drive"

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error("\nMissing credentials. Run like this:")
  console.error("  OAUTH_CLIENT_ID=xxx OAUTH_CLIENT_SECRET=yyy node scripts/get-drive-token.mjs\n")
  process.exit(1)
}

const authUrl =
  `https://accounts.google.com/o/oauth2/v2/auth` +
  `?client_id=${CLIENT_ID}` +
  `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}` +
  `&response_type=code` +
  `&scope=${encodeURIComponent(SCOPE)}` +
  `&access_type=offline` +
  `&prompt=consent`

console.log("\n1. Open this URL in your browser:\n")
console.log(authUrl)
console.log("\n2. Log in with your Google account and allow access.")
console.log("3. You will be redirected back and the refresh token will be printed here.\n")

const server = createServer(async (req, res) => {
  const { query } = parse(req.url, true)
  const code = query.code

  if (!code) {
    res.end("No code received.")
    return
  }

  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      redirect_uri: REDIRECT_URI,
      grant_type: "authorization_code",
    }),
  })

  const tokens = await tokenRes.json()

  if (tokens.refresh_token) {
    console.log("\n✓ Success! Add these to your .env.local:\n")
    console.log(`GOOGLE_OAUTH_CLIENT_ID=${CLIENT_ID}`)
    console.log(`GOOGLE_OAUTH_CLIENT_SECRET=${CLIENT_SECRET}`)
    console.log(`GOOGLE_OAUTH_REFRESH_TOKEN=${tokens.refresh_token}`)
    console.log()
    res.end("Done! You can close this tab and go back to the terminal.")
  } else {
    console.error("\nFailed to get refresh token:", tokens)
    res.end("Something went wrong. Check the terminal.")
  }

  server.close()
})

server.listen(4000)
