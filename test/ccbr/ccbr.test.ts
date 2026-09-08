// End-to-end test van lib/ccbr.ts tegen een nagebootste Rechtspraak-server.
// Bootst na: TLS met een eigen (niet-publiek vertrouwde) CA, de ADFS die een
// ondertekende SAML-assertie teruggeeft, en de twee SOAP-operaties.
import { createServer } from "node:https"
import { readFileSync } from "node:fs"
import { fileURLToPath } from "node:url"
import { dirname } from "node:path"

// Standaard naast deze test; CERT_DIR overschrijft dat.
const DIR = process.env.CERT_DIR || dirname(fileURLToPath(new URL(import.meta.url)))
const key = readFileSync(`${DIR}/key.pem`)
const cert = readFileSync(`${DIR}/cert.pem`)

// Een assertie met eigenaardige opmaak: als de code deze niet byte-voor-byte
// doorgeeft, breekt in het echt de handtekening.
const ASSERTION = `<trust:RequestedSecurityToken><saml:Assertion   ID="_abc"  IssueInstant="2026-09-08T10:00:00Z"
   xmlns:saml="urn:oasis:names:tc:SAML:1.0:assertion"><saml:Conditions/><ds:Signature xmlns:ds="http://www.w3.org/2000/09/xmldsig#"><ds:SignatureValue>Zm9vYmFy</ds:SignatureValue></ds:Signature></saml:Assertion></trust:RequestedSecurityToken>`
const BARE = ASSERTION.slice(ASSERTION.indexOf("<saml:Assertion"), ASSERTION.indexOf("</trust:"))

const seen: string[] = []
let tokenCalls = 0
let faultMode = false

const server = createServer({ key, cert }, (req, res) => {
  let body = ""
  req.on("data", (c) => (body += c))
  req.on("end", () => {
    const ct = String(req.headers["content-type"] || "")
    res.setHeader("Content-Type", "application/soap+xml; charset=utf-8")

    if (req.url === "/sts") {
      tokenCalls++
      if (!body.includes("<o:Username>testuser</o:Username>")) { res.writeHead(500); return res.end("geen gebruikersnaam") }
      if (!body.includes("/Bearer")) { res.writeHead(500); return res.end("geen bearer keytype") }
      res.writeHead(200)
      return res.end(`<s:Envelope xmlns:s="http://www.w3.org/2003/05/soap-envelope"><s:Body><trust:RequestSecurityTokenResponse xmlns:trust="http://docs.oasis-open.org/ws-sx/ws-trust/200512">${ASSERTION}</trust:RequestSecurityTokenResponse></s:Body></s:Envelope>`)
    }

    // Servicecall: de assertie moet ongewijzigd in de Security-header zitten.
    if (!body.includes(BARE)) { res.writeHead(401); return res.end("assertie ontbreekt of is gewijzigd") }

    // WCF eist een tijdstempel, en bij Layout/Strict moet die VOOR het token staan.
    const sec = body.slice(body.indexOf("<o:Security"))
    if (!sec.includes("<u:Timestamp")) {
      res.writeHead(500)
      return res.end(`<s:Envelope xmlns:s="http://www.w3.org/2003/05/soap-envelope"><s:Body><s:Fault><s:Code><s:Value>s:Sender</s:Value><s:Subcode><s:Value>wsse:InvalidSecurity</s:Value></s:Subcode></s:Code><s:Reason><s:Text xml:lang="en">An error occurred when verifying security for the message.</s:Text></s:Reason></s:Fault></s:Body></s:Envelope>`)
    }
    if (sec.indexOf("<u:Timestamp") > sec.indexOf("<saml:Assertion")) {
      res.writeHead(500); return res.end("tijdstempel staat na het token")
    }

    if (ct.includes("ZoekRegisterkaarten") && faultMode) {
      res.writeHead(200)
      return res.end(`<s:Envelope xmlns:s="http://www.w3.org/2003/05/soap-envelope"><s:Body><ZoekRegisterkaartenResult xmlns:b="x"><b:Foutmelding><b:Code>CCBR-0012</b:Code><b:Omschrijving>Te veel bevragingen</b:Omschrijving></b:Foutmelding></ZoekRegisterkaartenResult></s:Body></s:Envelope>`)
    }

    if (ct.includes("ZoekRegisterkaarten")) {
      const datum = body.match(/<b:Datum>(.*?)<\/b:Datum>/)?.[1] || ""
      if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/.test(datum)) {
        res.writeHead(500); return res.end(`ongeldige xsd:dateTime: ${datum}`)
      }
      const achternaam = body.match(/<achternaam>(.*?)<\/achternaam>/)?.[1] || ""
      seen.push(achternaam + "|" + body.match(/<voorvoegsel>(.*?)<\/voorvoegsel>/)?.[1] + "|" + datum)
      if (achternaam === "Beeindigd") {
        res.writeHead(200)
        return res.end(`<s:Envelope xmlns:s="http://www.w3.org/2003/05/soap-envelope"><s:Body><ZoekRegisterkaartenResponse xmlns="ccbr.rechtspraak.nl/v1"><ZoekRegisterkaartenResult xmlns:b="ccbr.rechtspraak.nl/v1/CcbrDataservice/berichten"><b:Registerkaarten><b:ZoekRegisterkaart><b:Geregistreerde><b:Geboorte><b:Datum>1975-04-12T00:00:00</b:Datum></b:Geboorte><b:SamengesteldeNaam><b:Geslachtsnaam>Beeindigd</b:Geslachtsnaam><b:Voornamen>Test</b:Voornamen></b:SamengesteldeNaam></b:Geregistreerde><b:HonderdProcentMatch>true</b:HonderdProcentMatch><b:Registerkaartidentificatie><b:RegisterkaartAanduiding>KAART-3</b:RegisterkaartAanduiding></b:Registerkaartidentificatie><b:SoortRegister>curatele</b:SoortRegister></b:ZoekRegisterkaart></b:Registerkaarten></ZoekRegisterkaartenResult></ZoekRegisterkaartenResponse></s:Body></s:Envelope>`)
      }
      res.writeHead(200)
      return res.end(`<s:Envelope xmlns:s="http://www.w3.org/2003/05/soap-envelope"><s:Body><ZoekRegisterkaartenResponse xmlns="ccbr.rechtspraak.nl/v1"><ZoekRegisterkaartenResult xmlns:b="ccbr.rechtspraak.nl/v1/CcbrDataservice/berichten"><b:Foutmelding i:nil="true" xmlns:i="http://www.w3.org/2001/XMLSchema-instance"/><b:Registerkaarten>
        <b:ZoekRegisterkaart><b:Geregistreerde><b:Geboorte><b:Datum>1975-04-12T00:00:00</b:Datum></b:Geboorte><b:SamengesteldeNaam><b:Geslachtsnaam>Meer</b:Geslachtsnaam><b:Voornamen>Bas</b:Voornamen><b:Voorvoegsel>van der</b:Voorvoegsel></b:SamengesteldeNaam></b:Geregistreerde><b:HonderdProcentMatch>true</b:HonderdProcentMatch><b:Registerkaartidentificatie><b:RegisterkaartAanduiding>KAART-1</b:RegisterkaartAanduiding></b:Registerkaartidentificatie><b:SoortRegister>curatele</b:SoortRegister></b:ZoekRegisterkaart>
        <b:ZoekRegisterkaart><b:Geregistreerde><b:Geboorte><b:Jaar>1975</b:Jaar></b:Geboorte><b:SamengesteldeNaam><b:Geslachtsnaam>Meer</b:Geslachtsnaam><b:Voornamen>Bart</b:Voornamen><b:Voorvoegsel>van der</b:Voorvoegsel></b:SamengesteldeNaam></b:Geregistreerde><b:HonderdProcentMatch>false</b:HonderdProcentMatch><b:Registerkaartidentificatie><b:RegisterkaartAanduiding>KAART-2</b:RegisterkaartAanduiding></b:Registerkaartidentificatie><b:SoortRegister>bewind</b:SoortRegister></b:ZoekRegisterkaart>
      </b:Registerkaarten><b:VerificatieCode>XYZ</b:VerificatieCode></ZoekRegisterkaartenResult></ZoekRegisterkaartenResponse></s:Body></s:Envelope>`)
    }

    if (ct.includes("RaadpleegRegisterkaart")) {
      const kaartId = body.match(/<registerkaartAanduiding>(.*?)</)?.[1] || ""
      seen.push("raadpleeg:" + kaartId)
      if (kaartId === "KAART-3") {
        res.writeHead(200)
        return res.end(`<s:Envelope xmlns:s="http://www.w3.org/2003/05/soap-envelope"><s:Body><RaadpleegRegisterkaartResponse xmlns="ccbr.rechtspraak.nl/v1"><RaadpleegRegisterkaartResult xmlns:b="ccbr.rechtspraak.nl/v1/CcbrDataservice/berichten"><b:Registerkaart><b:BeperktBewind>false</b:BeperktBewind><b:DatumPublicatie>2018-03-05T00:00:00</b:DatumPublicatie><b:Geldigheid><b:DatumBegin>2018-03-01T00:00:00</b:DatumBegin><b:DatumEinde>2021-06-30T00:00:00</b:DatumEinde></b:Geldigheid><b:Grond>verkwisting</b:Grond><b:SoortRegister>curatele</b:SoortRegister></b:Registerkaart></RaadpleegRegisterkaartResult></RaadpleegRegisterkaartResponse></s:Body></s:Envelope>`)
      }
      res.writeHead(200)
      // Schema-conform: volgorde volgens de xs:sequence van Registerkaart, met de
      // omringende velden die een echte kaart bevat. Gevalideerd met xmllint tegen
      // hun eigen xsd — anders test de nabootsing alleen mijn eigen aannames.
      return res.end(`<s:Envelope xmlns:s="http://www.w3.org/2003/05/soap-envelope"><s:Body><RaadpleegRegisterkaartResponse xmlns="ccbr.rechtspraak.nl/v1"><RaadpleegRegisterkaartResult xmlns:b="ccbr.rechtspraak.nl/v1/CcbrDataservice/berichten" xmlns:i="http://www.w3.org/2001/XMLSchema-instance"><b:Registerkaart><b:BeperktBewind>false</b:BeperktBewind><b:CentraalCurateleNummer>123456</b:CentraalCurateleNummer><b:CuratorenNatuurlijkPersoon><b:CuratorNatuurlijkPersoon><b:SamengesteldeNaam><b:Geslachtsnaam>Jansen</b:Geslachtsnaam><b:Voornamen>P.</b:Voornamen></b:SamengesteldeNaam></b:CuratorNatuurlijkPersoon></b:CuratorenNatuurlijkPersoon><b:DatumPublicatie>2019-02-05T00:00:00</b:DatumPublicatie><b:Geldigheid><b:DatumBegin>2019-02-01T00:00:00</b:DatumBegin><b:DatumEinde i:nil="true"/></b:Geldigheid><b:Geregistreerde><b:Geboorte><b:Datum>1975-04-12T00:00:00</b:Datum></b:Geboorte><b:SamengesteldeNaam><b:Geslachtsnaam>Meer</b:Geslachtsnaam><b:Voornamen>Bas</b:Voornamen><b:Voorvoegsel>van der</b:Voorvoegsel></b:SamengesteldeNaam></b:Geregistreerde><b:Grond>lichamelijke of geestelijke toestand</b:Grond><b:Registerkaartidentificatie><b:RegisterkaartAanduiding>KAART-1</b:RegisterkaartAanduiding></b:Registerkaartidentificatie><b:SoortRegister>curatele</b:SoortRegister></b:Registerkaart></RaadpleegRegisterkaartResult></RaadpleegRegisterkaartResponse></s:Body></s:Envelope>`)
    }
    res.writeHead(500); res.end("onbekende actie")
  })
})

async function main() {
  await new Promise<void>((r) => server.listen(0, "localhost", r))
  const port = (server.address() as { port: number }).port
  process.env.RECHTSPRAAK_STS_URL = `https://localhost:${port}/sts`
  process.env.RECHTSPRAAK_CCBR_URL = `https://localhost:${port}/svc`
  process.env.RECHTSPRAAK_CCBR_CA_CERT = cert.toString()
  process.env.RECHTSPRAAK_CCBR_USER = "testuser"
  process.env.RECHTSPRAAK_CCBR_PASSWORD = "geheim"

  const { checkCuratele, ccbrPromptBlock } = await import(process.env.CCBR_MODULE || "../../lib/ccbr")

  let fails = 0
  const ok = (label: string, cond: boolean, extra = "") => { console.log(`${cond ? "PASS" : "FAIL"}  ${label}${extra ? " — " + extra : ""}`); if (!cond) fails++ }

  const r = await checkCuratele({ achternaam: "Meer", voorvoegsel: "van der", geboortedatum: "1975-04-12" })
  ok("bevraging gelukt", !!r)
  ok("zoekvraag correct opgebouwd", seen[0] === "Meer|van der|1975-04-12T00:00:00", seen[0])
  ok("twee treffers gelezen", r?.treffers.length === 2)
  ok("volledige match herkend", r?.treffers[0].volledigeMatch === true && r?.treffers[1].volledigeMatch === false)
  ok("soort register gelezen", r?.treffers[0].soortRegister === "curatele" && r?.treffers[1].soortRegister === "bewind")
  ok("geboortejaar-variant gelezen", r?.treffers[1].geboortedatum === "1975", r?.treffers[1].geboortedatum)
  ok("details alleen voor volledige match", seen.filter((s) => s.startsWith("raadpleeg:")).length === 1, seen.join(" / "))
  ok("lopende curatele herkend", r?.treffers[0].actief === true && r?.actieveRegistratie === true)
  ok("grond en begindatum gelezen", r?.treffers[0].grond === "lichamelijke of geestelijke toestand" && r?.treffers[0].datumBegin === "2019-02-01")
  ok("naam samengesteld", r?.treffers[0].naam === "Bas van der Meer", r?.treffers[0].naam)

  // Token moet hergebruikt worden: één ADFS-aanroep voor meerdere bevragingen.
  await checkCuratele({ achternaam: "Meer", geboortedatum: "1975-04-12" })
  ok("token wordt hergebruikt", tokenCalls === 1, `${tokenCalls} aanroepen`)

  ok("prompt meldt de treffer als feit", ccbrPromptBlock(r!).includes("ENTRY FOUND") && ccbrPromptBlock(r!).includes("VOLLEDIGE MATCH"))
  ok("prompt zonder resultaat houdt de handmatige stap", ccbrPromptBlock(null).includes("NOT PERFORMED"))
  ok("zonder geboortedatum geen bevraging", (await checkCuratele({ achternaam: "Meer" })) === null)
  const nl = await checkCuratele({ achternaam: "Meer", voorvoegsel: "van der", geboortedatum: "12-04-1975" })
  ok("Nederlands datumformaat wordt omgezet", !!nl && nl.treffers.length === 2, seen[seen.length - 1])
  ok("onleesbare geboortedatum wordt overgeslagen", (await checkCuratele({ achternaam: "Meer", geboortedatum: "onzin" })) === null)

  // Een afgelopen curatele mag GEEN stopsignaal geven: die persoon is weer handelingsbekwaam.
  const oud = await checkCuratele({ achternaam: "Beeindigd", geboortedatum: "12-04-1975" })
  ok("beëindigde curatele wordt als treffer gezien", oud?.treffers.length === 1)
  ok("beëindigde curatele telt NIET als lopend", oud?.actieveRegistratie === false && oud?.treffers[0].actief === false)
  ok("einddatum wordt gelezen", oud?.treffers[0].datumEinde === "2021-06-30", oud?.treffers[0].datumEinde)

  // Een fout uit het register zelf mag nooit doorslaan als exception.
  faultMode = true
  ok("foutmelding van het register degradeert naar null", (await checkCuratele({ achternaam: "Jansen", geboortedatum: "1980-01-01" })) === null)
  faultMode = false

  server.close()
  console.log(fails === 0 ? "\nAlle tests geslaagd." : `\n${fails} test(s) gefaald.`)
  process.exit(fails === 0 ? 0 : 1)
}
main()
