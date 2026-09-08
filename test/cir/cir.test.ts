// Tests voor de CIR-koppeling tegen een nagebootste dienst.
//
// Het transport naar de abonnee-ingang is nog niet bevestigd, maar alles
// eromheen wel: welke zoekcombinaties geldig zijn, de datumomzetting naar
// dd-mm-jjjj, het uitlezen van het antwoord, en het onderscheid tussen een
// lopende en een beëindigde insolventie. Dat laatste is het gevoeligste:
// een beëindigd faillissement ten onrechte als lopend melden blokkeert een
// geldige aanvrager, andersom laat het een ongeldige door.
import { createServer } from "node:http"

async function main() {
  const seen: unknown[] = []
  let mode: "leeg" | "lopend" | "beeindigd" | "fout" = "leeg"

  const server = createServer((req, res) => {
    let body = ""
    req.on("data", (c) => (body += c))
    req.on("end", () => {
      seen.push(JSON.parse(body || "{}"))
      if (!req.headers.authorization?.startsWith("Basic ")) {
        res.writeHead(401); return res.end("geen inloggegevens")
      }
      if (mode === "fout") {
        res.writeHead(500, { "Content-Type": "text/html" })
        return res.end("<html><body>The exception message is 'Zoekcombinatie ongeldig'. </body></html>")
      }
      res.writeHead(200, { "Content-Type": "application/json" })
      if (mode === "leeg") return res.end(JSON.stringify({ resultaten: [] }))
      const status = mode === "lopend" ? "Uitgesproken" : "Beëindigd door opheffing"
      return res.end(JSON.stringify({
        resultaten: [{
          persoon: { voorletters: "B.", voorvoegsel: "van der", achternaam: "Meer", geboortedatum: "1975-04-12T00:00:00" },
          publicatiesoort: "Faillissement", status, rechtbank: "Rechtbank Amsterdam",
          landelijkUniekZaaknummer: "F.13/25/123", curators: [{ voorletters: "P.", achternaam: "Jansen" }],
          publicatiegeschiedenis: [{ publicatiesoort: "Uitspraak" }],
        }],
      }))
    })
  })

  await new Promise<void>((r) => server.listen(0, "127.0.0.1", r))
  const port = (server.address() as { port: number }).port
  process.env.RECHTSPRAAK_CIR_URL = `http://127.0.0.1:${port}/zoek`
  process.env.RECHTSPRAAK_CIR_USER = "u"
  process.env.RECHTSPRAAK_CIR_PASSWORD = "p"

  const { checkInsolventieDetailed, cirPromptBlock } = await import("../../lib/cir")

  let fails = 0
  const ok = (label: string, cond: boolean, extra = "") => {
    console.log(`${cond ? "PASS" : "FAIL"}  ${label}${extra ? " — " + extra : ""}`); if (!cond) fails++
  }

  // Geldige combinaties
  const a = await checkInsolventieDetailed({ achternaam: "Meer", voorvoegsel: "van der", geboortedatum: "12-04-1975" })
  ok("combinatie achternaam + geboortedatum", !!a.result, a.error || "")
  ok("datum omgezet naar dd-mm-jjjj", (seen[0] as Record<string, string>).geboortedatum === "12-04-1975", JSON.stringify(seen[0]))
  ok("ISO-datum wordt ook geaccepteerd",
    !!(await checkInsolventieDetailed({ achternaam: "Meer", geboortedatum: "1975-04-12" })).result &&
    (seen[seen.length - 1] as Record<string, string>).geboortedatum === "12-04-1975")
  ok("combinatie achternaam + postcode + huisnummer",
    !!(await checkInsolventieDetailed({ achternaam: "Meer", postcode: "1011 ab", huisnummer: "12" })).result)
  ok("postcode wordt genormaliseerd", (seen[seen.length - 1] as Record<string, string>).postcode === "1011AB", JSON.stringify(seen[seen.length - 1]))
  ok("combinatie geboortedatum + postcode + huisnummer",
    !!(await checkInsolventieDetailed({ geboortedatum: "12-04-1975", postcode: "1011AB", huisnummer: "12" })).result)

  // Ongeldige combinaties worden geweigerd VOORDAT er iets wordt verstuurd
  const voor = seen.length
  const alleen = await checkInsolventieDetailed({ achternaam: "Meer" })
  ok("alleen achternaam wordt geweigerd", !alleen.result && !!alleen.error && seen.length === voor)
  const leeg = await checkInsolventieDetailed({})
  ok("leeg verzoek wordt geweigerd", !leeg.result && seen.length === voor)
  const raar = await checkInsolventieDetailed({ achternaam: "Meer", geboortedatum: "24 juli" })
  ok("onleesbare datum wordt geweigerd", !raar.result && /niet te lezen/.test(raar.error || ""))

  // Antwoord lezen
  mode = "lopend"
  const lop = await checkInsolventieDetailed({ achternaam: "Meer", geboortedatum: "12-04-1975" })
  const p0 = lop.result?.publicaties[0]
  ok("treffer gelezen", lop.result?.publicaties.length === 1)
  ok("soort en rechtbank gelezen", p0?.soort === "Faillissement" && p0?.rechtbank === "Rechtbank Amsterdam")
  ok("naam samengesteld", p0?.naam === "B. van der Meer", p0?.naam)
  ok("curator gelezen", p0?.curatorOfBewindvoerder === "P. Jansen", p0?.curatorOfBewindvoerder)
  ok("lopend faillissement herkend", p0?.actief === true && lop.result?.actieveInsolventie === true)

  mode = "beeindigd"
  const be = await checkInsolventieDetailed({ achternaam: "Meer", geboortedatum: "12-04-1975" })
  ok("beëindigd faillissement herkend", be.result?.publicaties[0].actief === false)
  ok("beëindigd telt NIET als lopend", be.result?.actieveInsolventie === false)

  mode = "fout"
  const f = await checkInsolventieDetailed({ achternaam: "Meer", geboortedatum: "12-04-1975" })
  ok("foutpagina levert een leesbare reden", /Zoekcombinatie ongeldig/.test(f.error || ""), f.error || "")

  // Prompt
  ok("prompt zonder resultaat houdt de handmatige stap", cirPromptBlock(null).includes("NOT PERFORMED"))
  ok("prompt met treffer meldt het als feit", cirPromptBlock(lop.result!).includes("ENTRY FOUND"))
  ok("prompt zonder treffer noemt de zesmaandsgrens",
    cirPromptBlock({ ...lop.result!, publicaties: [] }).includes("six months"))

  server.close()
  console.log(fails === 0 ? "\nAlle tests geslaagd." : `\n${fails} test(s) gefaald.`)
  process.exit(fails === 0 ? 0 : 1)
}
main()
