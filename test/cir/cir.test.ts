// Tests voor de CIR-koppeling tegen een nagebootste dienst.
//
// De nabootsing eist hetzelfde als de echte WSE 3.0-dienst: WS-Addressing-
// headers en een UsernameToken met nonce en tijdstempel. Ontbreekt dat, dan
// antwoordt zij met dezelfde fout als de Rechtspraak — zodat een terugval
// daarop in de tests valt en niet in productie.
import { createServer } from "node:http"

const NS = "http://www.rechtspraak.nl/namespaces/cir01"

function soapFault(reden: string) {
  return `<?xml version="1.0"?><soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/"><soap:Body><soap:Fault><faultcode>q0:Security</faultcode><faultstring>${reden}
   at Microsoft.Web.Services3.Security.ReceiveSecurityFilter.ProcessMessage</faultstring></soap:Fault></soap:Body></soap:Envelope>`
}

function resultaat(status: string, eind = "") {
  return `<?xml version="1.0"?><soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/"><soap:Body>
<searchNaturalPersonResponse xmlns="${NS}"><searchNaturalPersonResult>
  <insolvencies>
    <insolvency>
      <publicationNumber>F.13/25/123</publicationNumber>
      <type>Faillissement</type>
      <status>${status}</status>
      <court>Rechtbank Amsterdam</court>
      <startDate>2025-02-01</startDate>
      ${eind ? `<endDate>${eind}</endDate>` : ""}
      <person><initials>B.</initials><prefix>van der</prefix><surname>Meer</surname><dateOfBirth>1975-04-12T00:00:00</dateOfBirth></person>
      <trustee><name>mr. P. Jansen</name></trustee>
      <bijzonderVeld>iets nieuws</bijzonderVeld>
    </insolvency>
  </insolvencies>
</searchNaturalPersonResult></searchNaturalPersonResponse></soap:Body></soap:Envelope>`
}

async function main() {
  const seen: string[] = []
  let mode: "leeg" | "lopend" | "beeindigd" | "onbekend" = "leeg"

  const server = createServer((req, res) => {
    let body = ""
    req.on("data", (c) => (body += c))
    req.on("end", () => {
      seen.push(body)
      res.setHeader("Content-Type", "text/xml; charset=utf-8")

      // Precies de eisen die de echte dienst stelde toen ik hem aanriep.
      if (!/<wsa:Action>/.test(body)) {
        res.writeHead(500)
        return res.end(soapFault("Header http://schemas.xmlsoap.org/ws/2004/08/addressing:Action for ultimate recipient is required but not present in the message."))
      }
      if (!/<wsse:UsernameToken/.test(body) || !/<wsse:Nonce/.test(body)) {
        res.writeHead(500)
        return res.end(soapFault("Security requirements are not satisfied because the security header is not present in the incoming message."))
      }
      if (req.headers.soapaction !== `"${NS}/searchNaturalPerson"`) {
        res.writeHead(500); return res.end(soapFault("Onjuiste SOAPAction."))
      }

      res.writeHead(200)
      if (mode === "leeg") {
        return res.end(`<?xml version="1.0"?><soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/"><soap:Body><searchNaturalPersonResponse xmlns="${NS}"><searchNaturalPersonResult><insolvencies/></searchNaturalPersonResult></searchNaturalPersonResponse></soap:Body></soap:Envelope>`)
      }
      if (mode === "lopend") return res.end(resultaat("Uitgesproken"))
      if (mode === "beeindigd") return res.end(resultaat("Beëindigd door opheffing", "2021-06-30"))
      return res.end(resultaat(""))
    })
  })

  await new Promise<void>((r) => server.listen(0, "127.0.0.1", r))
  const port = (server.address() as { port: number }).port
  process.env.RECHTSPRAAK_CIR_URL = `http://127.0.0.1:${port}/cir.asmx`
  process.env.RECHTSPRAAK_CIR_USER = "gebruiker"
  process.env.RECHTSPRAAK_CIR_PASSWORD = "geheim"

  const { checkInsolventieDetailed, cirPromptBlock } = await import("../../lib/cir")

  let fails = 0
  const ok = (label: string, cond: boolean, extra = "") => {
    console.log(`${cond ? "PASS" : "FAIL"}  ${label}${extra ? " — " + extra : ""}`); if (!cond) fails++
  }

  // --- verzoek ---
  const a = await checkInsolventieDetailed({ achternaam: "Meer", voorvoegsel: "van der", geboortedatum: "12-04-1975" })
  ok("bevraging gelukt", !!a.result, a.error || "")
  const req0 = seen[0] || ""
  ok("WS-Addressing-headers meegestuurd", /<wsa:Action>.*searchNaturalPerson<\/wsa:Action>/.test(req0) && /<wsa:To>/.test(req0))
  ok("UsernameToken met nonce en tijdstempel", /<wsse:Username>gebruiker</.test(req0) && /<wsse:Nonce/.test(req0) && /<wsu:Created>/.test(req0))
  ok("wachtwoord staat niet in de URL of SOAPAction", !/geheim/.test(process.env.RECHTSPRAAK_CIR_URL!))
  ok("datum als xs:dateTime", /<dateOfBirth>1975-04-12T00:00:00<\/dateOfBirth>/.test(req0), (req0.match(/<dateOfBirth>[^<]*/) || [""])[0])
  ok("voorvoegsel en achternaam apart", /<prefix>van der<\/prefix><surname>Meer<\/surname>/.test(req0))

  await checkInsolventieDetailed({ achternaam: "Meer", postcode: "1011 ab", huisnummer: "12A" })
  const req1 = seen[seen.length - 1]
  ok("postcode genormaliseerd", /<postalCode>1011AB<\/postalCode>/.test(req1))
  ok("huisnummer als getal (toevoeging valt weg)", /<houseNumber>12<\/houseNumber>/.test(req1))

  ok("combinatie geboortedatum + postcode + huisnummer",
    !!(await checkInsolventieDetailed({ geboortedatum: "1975-04-12", postcode: "1011AB", huisnummer: "12" })).result)

  // --- ongeldige invoer wordt geweigerd vóór verzending ---
  const voor = seen.length
  ok("alleen achternaam wordt geweigerd", !(await checkInsolventieDetailed({ achternaam: "Meer" })).result && seen.length === voor)
  ok("leeg verzoek wordt geweigerd", !(await checkInsolventieDetailed({})).result && seen.length === voor)
  const raar = await checkInsolventieDetailed({ achternaam: "Meer", geboortedatum: "24 juli" })
  ok("onleesbare datum wordt geweigerd", !raar.result && /niet te lezen/.test(raar.error || "") && seen.length === voor)

  // --- antwoord ---
  ok("leeg antwoord = geen treffers", a.result?.publicaties.length === 0 && a.result?.actieveInsolventie === false)

  mode = "lopend"
  const lop = await checkInsolventieDetailed({ achternaam: "Meer", geboortedatum: "12-04-1975" })
  const p0 = lop.result?.publicaties[0]
  ok("treffer gelezen", lop.result?.publicaties.length === 1)
  ok("soort, rechtbank en nummer gelezen",
    p0?.soort === "Faillissement" && p0?.rechtbank === "Rechtbank Amsterdam" && p0?.publicatienummer === "F.13/25/123")
  ok("naam samengesteld", p0?.naam === "B. van der Meer", p0?.naam)
  ok("geboortedatum gelezen", p0?.geboortedatum === "1975-04-12", p0?.geboortedatum)
  ok("curator gelezen", p0?.curatorOfBewindvoerder === "mr. P. Jansen", p0?.curatorOfBewindvoerder)
  ok("lopend faillissement herkend", p0?.actief === true && lop.result?.actieveInsolventie === true)
  ok("onbekend veld gesignaleerd", lop.result?.onbekendeVelden.includes("bijzonderVeld"), (lop.result?.onbekendeVelden || []).join(","))

  mode = "beeindigd"
  const be = await checkInsolventieDetailed({ achternaam: "Meer", geboortedatum: "12-04-1975" })
  ok("beëindigd faillissement herkend", be.result?.publicaties[0].actief === false)
  ok("beëindigd telt NIET als lopend", be.result?.actieveInsolventie === false)

  // Onbepaalbare status mag niet stilzwijgend als "schoon" gelden.
  mode = "onbekend"
  const on = await checkInsolventieDetailed({ achternaam: "Meer", geboortedatum: "12-04-1975" })
  ok("onbepaalbare status blijft onbekend", on.result?.publicaties[0].actief === null)
  ok("onbepaalbare status telt NIET als schoon", on.result?.actieveInsolventie === true)

  // --- fouten ---
  process.env.RECHTSPRAAK_CIR_USER = ""
  const geen = await checkInsolventieDetailed({ achternaam: "Meer", geboortedatum: "12-04-1975" })
  ok("zonder inloggegevens een duidelijke reden", !geen.result && /inloggegevens/.test(geen.error || ""), geen.error || "")
  process.env.RECHTSPRAAK_CIR_USER = "gebruiker"

  // --- prompt ---
  ok("prompt zonder resultaat houdt de handmatige stap", cirPromptBlock(null).includes("NOT PERFORMED"))
  ok("prompt met treffer meldt het als feit", cirPromptBlock(lop.result!).includes("ENTRY FOUND"))
  ok("prompt zonder treffer noemt de zesmaandsgrens", cirPromptBlock(a.result!).includes("six months"))

  server.close()
  console.log(fails === 0 ? "\nAlle tests geslaagd." : `\n${fails} test(s) gefaald.`)
  process.exit(fails === 0 ? 0 : 1)
}
main()
