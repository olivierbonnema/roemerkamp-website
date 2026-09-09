# Naamketen: aanvraagformulier → registerbevraging

De registers (CCBR en CIR) matchen op de **exacte achternaam**. Gaat de splitsing
mis, dan komt er "geen registratie" terug voor iemand die er wél in staat — een
stille valse geruststelling in een compliance-rapport. Deze test bewaakt die weg.

Twee regels die hier worden afgedwongen:

1. **Het ingevulde achternaam-veld wint.** Het portaal bewaart voor- en
   achternaam apart; die achternaam wordt niet teruggeraden uit de samengevoegde
   naam. Alleen leidende tussenvoegsels gaan eraf (`splitSurnameField`).
2. **Alleen zonder dat veld wordt er geraden** (`splitDutchName`) — dat is het
   geval bij een losse check in het admin-panel, waar één naamveld wordt getypt.

Het onderscheid is niet academisch: `splitDutchName` gaat ervan uit dat er
voornamen vóór de achternaam staan en houdt bij twijfel alleen het laatste woord
over. Op een dubbele achternaam als "Jansen Steenbergen" levert dat "Steenbergen"
op, en dus een bevraging op de verkeerde naam.

## Draaien

`reputation-scan` initialiseert Firebase bij het laden. Deze test raakt Firebase
niet, maar die initialisatie moet wel slagen — dus wijs naar een wegwerpsleutel:

    openssl genrsa -out /tmp/dummy-key.pem 2048
    FIREBASE_TEST_KEY=/tmp/dummy-key.pem npx tsx test/registers/naam.test.ts

Gebruik hier nooit een echte sleutel: er wordt niets mee verbonden.
