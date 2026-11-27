// the overview of loans on the dashboard of Beheer: reading amounts, percentages and durations as people write
// them, checking what the form sends, the three rates, the phases, the
// passeerdatum, the totals, and a row made from an aanvraag.
//
// Run from the repo root:  npx tsx test/leningen/leningen.test.ts
//
// Fictitious names and amounts only.
import {
  EMPTY_LENING, dagenTot, faseTotals, fmtBedrag, fmtBedragKort, fmtDagenTot, fmtDatum, fmtDuur, fmtPct, isIsoDatum, leningFase,
  leningFromAanvraag, leningFromStored, leningTotals, parseBedrag, parseDuur, parsePct, passeerIsSchatting,
  renteLeningnemer, renteNetto, sanitizeLening, schatPasseerdatum, sortLeningen,
} from "../../lib/leningen"

let fails = 0
const ok = (label: string, cond: boolean, extra = "") => {
  console.log(`${cond ? "PASS" : "FAIL"}  ${label}${extra ? ": " + extra : ""}`); if (!cond) fails++
}
const eq = (label: string, got: unknown, want: unknown) => ok(label, JSON.stringify(got) === JSON.stringify(want), `got ${JSON.stringify(got)}, want ${JSON.stringify(want)}`)

/* ---------- amounts ---------- */
const bedragen: [unknown, number | null][] = [
  ["450000", 450000], ["450.000", 450000], ["€ 450.000,-", 450000], ["€450.000", 450000], ["450.000,00", 450000],
  ["300k", 300000], ["300 K", 300000], ["1,1 mln", 1100000], ["2.1 mln", 2100000], ["1 mio", 1000000], ["1,5 miljoen", 1500000], ["2m", 2000000],
  ["1.100.000", 1100000], ["1,100,000", 1100000], ["1234,56", 1235], ["0", 0], [215000, 215000], [215000.4, 215000],
  ["", null], ["abc", null], ["12 appels", null], ["-5", null], [-5, null], [NaN, null], [null, null], [undefined, null], ["1.2.3", null], ["k", null],
]
for (const [input, want] of bedragen) eq(`amount ${JSON.stringify(input)}`, parseBedrag(input), want)

/* ---------- percentages ---------- */
const pcts: [unknown, number | null][] = [["6,5", 6.5], ["6.75%", 6.75], ["7", 7], [" 7 % ", 7], [6.7, 6.7], ["", null], ["zes", null], ["-1", null], [null, null]]
for (const [input, want] of pcts) eq(`percentage ${JSON.stringify(input)}`, parsePct(input), want)

/* ---------- durations ---------- */
const duren: [unknown, number | null][] = [["24", 24], ["24 maanden", 24], ["36 mnd", 36], ["2 jaar", 24], ["1,5 jaar", 18], ["12 m", 12], [48, 48], ["", null], ["lang", null], [0, null], ["0", null]]
for (const [input, want] of duren) eq(`duration ${JSON.stringify(input)}`, parseDuur(input), want)

/* ---------- what the form sends ---------- */
let r = sanitizeLening({ project: "  Voorbeeld Vastgoed B.V.  ", hoofdsom: "300k", brutoRente: "7,5", duurMaanden: "36 mnd", zekerheid: "1e", ltv: "<50%", passeerDatum: "2026-12-24", gefund: true, quote: true }, { requireProject: true })
eq("a full row is accepted and cleaned", r, { ok: true, fields: { project: "Voorbeeld Vastgoed B.V.", zekerheid: "1e", ltv: "<50%", gefund: true, quote: true, hoofdsom: 300000, brutoRente: 7.5, passeerDatum: "2026-12-24", duurMaanden: 36 } })
r = sanitizeLening({ hoofdsom: "300k" }, { requireProject: true })
ok("a new row needs a project", !r.ok && r.error === "Vul een naam in bij project.")
r = sanitizeLening({ project: "   " }, { requireProject: false })
ok("a project cannot be emptied", !r.ok)
r = sanitizeLening({ betaald: true }, { requireProject: false })
eq("one tick alone is a valid change", r, { ok: true, fields: { betaald: true } })
r = sanitizeLening({ betaald: "ja" }, { requireProject: false })
ok("a tick must be true or false", !r.ok)
r = sanitizeLening({ hoofdsom: "veel" }, { requireProject: false })
ok("an amount that is no amount is refused", !r.ok && r.error === "De hoofdsom is geen geldig bedrag.")
r = sanitizeLening({ hoofdsom: "2000000000" }, { requireProject: false })
ok("an absurd amount is refused", !r.ok)
r = sanitizeLening({ hoofdsom: "" }, { requireProject: false })
eq("an emptied amount is zero", r, { ok: true, fields: { hoofdsom: 0 } })
r = sanitizeLening({ brutoRente: "", duurMaanden: "", passeerDatum: "" }, { requireProject: false })
eq("emptied numbers and an emptied date become empty", r, { ok: true, fields: { brutoRente: null, passeerDatum: "", duurMaanden: null } })
r = sanitizeLening({ brutoRente: "150" }, { requireProject: false })
ok("a rate above 100 is refused", !r.ok && r.error === "De bruto rente is geen geldig percentage.")
for (const bad of ["half dec", "01-12", "2026-13-01", "2026-02-30", "1999-12-31", 20261201, "2026-12-1"]) {
  r = sanitizeLening({ passeerDatum: bad }, { requireProject: false })
  ok(`a passeerdatum that is no date (${JSON.stringify(bad)}) is refused`, !r.ok && r.error === "De passeerdatum is geen geldige datum.")
}
r = sanitizeLening({ nettoRente: "6,5", investeerders: "Investeerder Een", passeerdatum: "half dec" }, { requireProject: false })
eq("the fields of the first version are no longer taken from the form", r, { ok: true, fields: {} })
r = sanitizeLening({ duurMaanden: "lang" }, { requireProject: false })
ok("a duration that is no number is refused", !r.ok)
r = sanitizeLening({ ltv: "x".repeat(41) }, { requireProject: false })
ok("a text that is too long is refused", !r.ok && r.error === "De tekst bij ltv is te lang.")
r = sanitizeLening({ project: 5 }, { requireProject: false })
ok("a text must be text", !r.ok)
r = sanitizeLening({ status: "archief", volgorde: 3, aanvraagId: "X", id: "Y", createdBy: "iemand" }, { requireProject: false })
eq("fields that are not of the form are left out", r, { ok: true, fields: {} })
for (const bad of [null, undefined, "tekst", 5, []]) ok(`not an object (${JSON.stringify(bad)}) is refused`, !sanitizeLening(bad, { requireProject: false }).ok)

/* ---------- totals ---------- */
/* ---------- the three rates ---------- */
eq("the borrower pays the bruto rente plus 0,07% per month", [renteLeningnemer(7.5), renteLeningnemer(8), renteLeningnemer(7.46), renteLeningnemer(null)], [8.34, 8.84, 8.3, null])
eq("the investor gets the bruto rente minus 0,08% per month", [renteNetto(7.5), renteNetto(8), renteNetto(7.46), renteNetto(null)], [6.54, 7.04, 6.5, null])

/* ---------- the three phases ---------- */
eq("the furthest step decides the phase", [
  leningFase({ termsheet: false, quote: false }), leningFase({ termsheet: false, quote: true }),
  leningFase({ termsheet: true, quote: false }), leningFase({ termsheet: true, quote: true }),
], ["ontvangen", "quote", "termsheet", "termsheet"])

eq("the amounts per phase of an empty list", faseTotals([]), { termsheet: { aantal: 0, hoofdsom: 0 }, quote: { aantal: 0, hoofdsom: 0 }, ontvangen: { aantal: 0, hoofdsom: 0 } })
const bord = [
  { hoofdsom: 300000, termsheet: false, quote: false }, { hoofdsom: 120000, termsheet: false, quote: false },
  { hoofdsom: 1000000, termsheet: false, quote: true }, { hoofdsom: 450000, termsheet: true, quote: true },
  { hoofdsom: 215000, termsheet: true, quote: false }, { hoofdsom: 0, termsheet: false, quote: true },
]
eq("aanvragen ingediend, uitstaande quotes and termsheet uitgebracht", faseTotals(bord),
  { termsheet: { aantal: 2, hoofdsom: 665000 }, quote: { aantal: 2, hoofdsom: 1000000 }, ontvangen: { aantal: 2, hoofdsom: 420000 } })
ok("the three amounts add up to the total hoofdsom", Object.values(faseTotals(bord)).reduce((sum, f) => sum + f.hoofdsom, 0) === leningTotals(bord.map((b) => ({ ...b, gefund: false }))).hoofdsom)

/* ---------- the passeerdatum ---------- */
ok("a real date is a date", isIsoDatum("2026-12-01") && isIsoDatum("2028-02-29"))
ok("what is no date is not", ![ "2026-02-30", "2026-13-01", "01-12-2026", "", null, 5, "2027-02-29" ].some(isIsoDatum))
const made = "2026-11-26T16:00:00.000Z"
const schattingen: [string, string][] = [
  ["01-12", "2026-12-01"], ["7-12", "2026-12-07"], ["30 nov", "2026-11-30"], ["30nov", "2026-11-30"], ["1/12", "2026-12-01"],
  ["half dec", "2026-12-15"], ["dec", "2026-12-31"], ["december", "2026-12-31"], ["kerst?", "2026-12-24"], ["Kerst", "2026-12-24"],
  ["jan", "2027-01-31"], ["jan?", "2027-01-31"], ["half jan", "2027-01-15"], ["feb", "2027-02-28"], ["15 maart", "2027-03-15"], ["mrt", "2027-03-31"],
  ["", ""], ["binnenkort", ""], ["31-02", ""], ["32-12", ""], ["5-13", ""], ["?", ""],
]
for (const [tekst, want] of schattingen) eq(`the text of the board ${JSON.stringify(tekst)}`, schatPasseerdatum(tekst, made), want)
eq("a day shortly before the row was made stays in that year", schatPasseerdatum("20 nov", made), "2026-11-20")
eq("without a date of making, today decides the year", schatPasseerdatum("half dec", null).slice(4), "-12-15")
eq("which texts are a guess", ["half dec", "dec", "kerst?", "jan?", "jan", "01-12", "7-12", "30 nov", ""].map(passeerIsSchatting), [true, true, true, true, true, false, false, false, false])
eq("a date in words", [fmtDatum("2026-12-01"), fmtDatum("2027-01-31"), fmtDatum(""), fmtDatum("half dec")], ["1 dec 2026", "31 jan 2027", "", ""])
eq("days until", [dagenTot("2026-12-01", "2026-11-26"), dagenTot("2026-11-26", "2026-11-26"), dagenTot("2026-11-20", "2026-11-26"), dagenTot("2027-01-31", "2026-11-26"), dagenTot("", "2026-11-26")], [5, 0, -6, 66, null])
eq("days until, in words", [fmtDagenTot(5), fmtDagenTot(1), fmtDagenTot(0), fmtDagenTot(-1), fmtDagenTot(-6), fmtDagenTot(null)], ["over 5 dagen", "morgen", "vandaag", "gisteren", "6 dagen geleden", ""])

eq("totals of an empty list", leningTotals([]), { aantal: 0, hoofdsom: 0, gefund: 0, nogTeFunden: 0 })
eq("totals", leningTotals([{ hoofdsom: 300000, gefund: false }, { hoofdsom: 1000000, gefund: true }, { hoofdsom: 450000, gefund: true }, { hoofdsom: 0, gefund: false }]),
  { aantal: 4, hoofdsom: 1750000, gefund: 1450000, nogTeFunden: 300000 })

/* ---------- order ---------- */
eq("the nearest passeerdatum first, rows without a date last and oldest first",
  sortLeningen([
    { id: "geen-2", passeerDatum: "", createdAt: "2026-11-03" }, { id: "jan", passeerDatum: "2027-01-31", createdAt: "2026-11-01" },
    { id: "geen-1", passeerDatum: "", createdAt: "2026-11-02" }, { id: "nov", passeerDatum: "2026-11-30", createdAt: "2026-11-05" },
    { id: "dec-b", passeerDatum: "2026-12-01", createdAt: "2026-11-04" }, { id: "dec-a", passeerDatum: "2026-12-01", createdAt: "2026-11-02" },
  ]).map((x) => x.id), ["nov", "dec-a", "dec-b", "jan", "geen-1", "geen-2"])

/* ---------- a row from an aanvraag ---------- */
eq("from an aanvraag without quote-mail: what the adviser filled in",
  leningFromAanvraag({ naam: "Jan Voorbeeld", bedrijfsnaam: "", leningBedrag: "450000", looptijd: "24 maanden" }),
  { ...EMPTY_LENING, project: "Jan Voorbeeld", hoofdsom: 450000, duurMaanden: 24 })
eq("the company name goes before the person",
  leningFromAanvraag({ naam: "Jan Voorbeeld", bedrijfsnaam: "Voorbeeld Vastgoed B.V.", leningBedrag: "450000", looptijd: "24" }).project, "Voorbeeld Vastgoed B.V.")
eq("with a saved quote-mail: the offer goes first",
  leningFromAanvraag({
    naam: "Jan Voorbeeld", leningBedrag: "450000", looptijd: "24 maanden",
    quote: { data: { loanAmount: 400000, looptijdMaanden: 36, rentePct: 8.5, objects: [{ waarde: 800000, hypotheekRank: "1e" }, { waarde: 200000, hypotheekRank: "2e" }, { waarde: 0, hypotheekRank: "1e" }] } },
  }),
  { ...EMPTY_LENING, project: "Jan Voorbeeld", hoofdsom: 400000, brutoRente: 8.5, duurMaanden: 36, zekerheid: "1e en 2e", ltv: "40%" })
eq("a quote-mail without amounts falls back on the aanvraag",
  leningFromAanvraag({ naam: "Jan Voorbeeld", leningBedrag: "450000", looptijd: "2 jaar", quote: { data: { loanAmount: 0, looptijdMaanden: 0, rentePct: 0, objects: [] } } }),
  { ...EMPTY_LENING, project: "Jan Voorbeeld", hoofdsom: 450000, duurMaanden: 24 })
eq("an aanvraag with nothing usable gives an empty row", leningFromAanvraag({ leningBedrag: "onbekend", looptijd: "", quote: null }), EMPTY_LENING)
eq("odd values do not break it", leningFromAanvraag({ naam: 5, leningBedrag: {}, looptijd: [], quote: { data: { objects: "x" } } } as never), EMPTY_LENING)

/* ---------- reading a stored row ---------- */
const iso = (v: unknown) => (v instanceof Date ? v.toISOString() : null)
const byKey = (o: object) => Object.fromEntries(Object.entries(o).sort(([a], [b]) => a.localeCompare(b)))
eq("a stored row with missing fields is read safely",
  byKey(leningFromStored("L1", { project: "Voorbeeld", hoofdsom: "veel", gefund: "ja", status: "onbekend" }, iso)),
  byKey({ id: "L1", ...EMPTY_LENING, project: "Voorbeeld", passeerTekst: "", status: "actief", aanvraagId: "", createdAt: null, updatedAt: null, archivedAt: null }))

// A row as the first version stored it (the 13 of the board): netto rente and
// the date as text. It is read with a bruto rente and a date, nothing is lost.
const oud = leningFromStored("L2", { project: "Voorbeeld", hoofdsom: 300000, nettoRente: 6.5, brutoRente: null, passeerdatum: "half dec", investeerders: "", volgorde: 4, createdAt: new Date(made) }, iso)
eq("a row of the first version: the bruto rente gives back the netto of the board", [oud.brutoRente, renteNetto(oud.brutoRente), renteLeningnemer(oud.brutoRente)], [7.46, 6.5, 8.3])
eq("a row of the first version: the date is the estimate, the text comes along", [oud.passeerDatum, oud.passeerTekst], ["2026-12-15", "half dec"])
const oudExact = leningFromStored("L3", { project: "Voorbeeld", nettoRente: 7, passeerdatum: "01-12", createdAt: new Date(made) }, iso)
eq("an exact text of the board is read as that day", [oudExact.passeerDatum, oudExact.passeerTekst, oudExact.brutoRente], ["2026-12-01", "01-12", 7.96])
const nieuw = leningFromStored("L4", { project: "Voorbeeld", brutoRente: 8, nettoRente: 6.5, passeerDatum: "2026-12-20", passeerdatum: "half dec", quote: true, createdAt: new Date(made) }, iso)
eq("a saved bruto rente and date go before what the board had", [nieuw.brutoRente, nieuw.passeerDatum, nieuw.passeerTekst, nieuw.quote], [8, "2026-12-20", "", true])
const leeg = leningFromStored("L5", { project: "Voorbeeld", passeerDatum: "", passeerdatum: "half dec", createdAt: new Date(made) }, iso)
eq("a date that was emptied on purpose stays empty", [leeg.passeerDatum, leeg.passeerTekst], ["", ""])
const onleesbaar = leningFromStored("L6", { project: "Voorbeeld", passeerdatum: "na de zomer", createdAt: new Date(made) }, iso)
eq("a text that is not understood gives no date and keeps the text", [onleesbaar.passeerDatum, onleesbaar.passeerTekst], ["", "na de zomer"])

/* ---------- writing ---------- */
eq("amount in full", fmtBedrag(1100000), "€ 1.100.000")
eq("no amount is empty", fmtBedrag(0), "")
eq("short amounts", [fmtBedragKort(300000), fmtBedragKort(1100000), fmtBedragKort(2100000), fmtBedragKort(0), fmtBedragKort(950)], ["€ 300k", "€ 1,1 mln", "€ 2,1 mln", "€ 0", "€ 950"])
eq("percentages with two decimals", [fmtPct(6.5), fmtPct(7), fmtPct(6.75), fmtPct(7.125), fmtPct(null)], ["6,50%", "7,00%", "6,75%", "7,125%", ""])
eq("durations", [fmtDuur(36), fmtDuur(null)], ["36 mnd", ""])

console.log(fails === 0 ? "\nALL PASS" : `\n${fails} FAILED`)
process.exit(fails === 0 ? 0 : 1)
