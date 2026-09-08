# CCBR-koppeling: tests

## Waarom deze map bestaat

De CCBR-koppeling praat met een server die wij niet kunnen aanroepen zonder een
echte bevraging op een echt persoon te doen. Testen tegen een nabootsing is dan
de enige weg — maar een nabootsing die ik zelf schrijf op basis van hoe ik hun
schema lees, test alleen mijn eigen aannames. Lees ik het schema verkeerd, dan
zit die fout in de nabootsing én in de code, en merkt geen enkele test het.

Daarom worden de nagebootste berichten **gevalideerd tegen het officiële schema
van de Rechtspraak**. Dat haalt de aanname weg.

## De schema's

`xsd0/1/2.xsd` zijn opgehaald van
`https://ccbrservice.rechtspraak.nl/CcbrDataservice.svc?xsd=xsdN` (2026-09-08).
De `schemaLocation`-verwijzingen zijn omgezet naar de lokale bestanden.

## Valideren

    xmllint --noout --schema xsd0.xsd req.xml req2.xml resp1.xml resp2.xml

- `req.xml` / `req2.xml` — de verzoeken zoals `lib/ccbr.ts` ze opbouwt.
- `resp1.xml` / `resp2.xml` — de antwoorden die de nabootsing teruggeeft.

Dit vond bij de eerste ronde een echte afwijking: de velden in
`RaadpleegRegisterkaartResponse` stonden in de verkeerde volgorde. Het schema
schrijft een `xs:sequence` voor, dus een echt antwoord ziet er anders uit dan
mijn eerste nabootsing. Pas het bericht aan, niet het schema.

## De testsuite draaien

    CERT_DIR=<map met key.pem/cert.pem> CCBR_MODULE=$PWD/lib/ccbr.ts npx tsx test/ccbr/ccbr.test.ts

Maak het testcertificaat eenmalig aan:

    openssl req -x509 -newkey rsa:2048 -nodes -keyout key.pem -out cert.pem \
      -days 365 -subj "/CN=localhost" -addext "subjectAltName=DNS:localhost"

De suite zet een lokale HTTPS-server op met dat certificaat en doorloopt de hele
keten: TLS met een eigen CA, de tokenaanvraag, het ongewijzigd doorgeven van het
ondertekende token, de tijdstempel-eis, beide bevragingen, en het degraderen bij
storingen.
