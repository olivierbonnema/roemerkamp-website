// Beheer > Leningen: reading amounts, percentages and durations as people write
// them, checking what the form sends, the totals, and a row made from an aanvraag.
//
// Run from the repo root:  npx tsx test/leningen/leningen.test.ts
//
// Fictitious names and amounts only.
import {
  EMPTY_LENING, fmtBedrag, fmtBedragKort, fmtDuur, fmtPct, leningFromAanvraag, leningFromStored, leningTotals,
  parseBedrag, parseDuur, parsePct, sanitizeLening, sortLeningen,
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
let r = sanitizeLening({ project: "  Voorbeeld Vastgoed B.V.  ", hoofdsom: "300k", nettoRente: "6,5", duurMaanden: "36 mnd", zekerheid: "1e", ltv: "<50%", passeerdatum: "kerst?", gefund: true }, { requireProject: true })
eq("a full row is accepted and cleaned", r, { ok: true, fields: { project: "Voorbeeld Vastgoed B.V.", zekerheid: "1e", ltv: "<50%", passeerdatum: "kerst?", gefund: true, hoofdsom: 300000, nettoRente: 6.5, duurMaanden: 36 } })
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
r = sanitizeLening({ brutoRente: "", nettoRente: null, duurMaanden: "" }, { requireProject: false })
eq("emptied numbers become empty", r, { ok: true, fields: { brutoRente: null, nettoRente: null, duurMaanden: null } })
r = sanitizeLening({ nettoRente: "150" }, { requireProject: false })
ok("a rate above 100 is refused", !r.ok && r.error === "De netto rente is geen geldig percentage.")
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
eq("totals of an empty list", leningTotals([]), { aantal: 0, hoofdsom: 0, gefund: 0, nogTeFunden: 0 })
eq("totals", leningTotals([{ hoofdsom: 300000, gefund: false }, { hoofdsom: 1000000, gefund: true }, { hoofdsom: 450000, gefund: true }, { hoofdsom: 0, gefund: false }]),
  { aantal: 4, hoofdsom: 1750000, gefund: 1450000, nogTeFunden: 300000 })

/* ---------- order ---------- */
eq("sorted by place, then oldest first",
  sortLeningen([{ id: "c", volgorde: 2, createdAt: "2026-11-02" }, { id: "b", volgorde: 1, createdAt: "2026-11-03" }, { id: "a", volgorde: 1, createdAt: "2026-11-01" }]).map((x) => x.id), ["a", "b", "c"])

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
eq("a stored row with missing fields is read safely",
  leningFromStored("L1", { project: "Voorbeeld", hoofdsom: "veel", gefund: "ja", status: "onbekend" }, iso),
  { id: "L1", ...EMPTY_LENING, project: "Voorbeeld", status: "actief", volgorde: 0, aanvraagId: "", createdAt: null, updatedAt: null, archivedAt: null })

/* ---------- writing ---------- */
eq("amount in full", fmtBedrag(1100000), "€ 1.100.000")
eq("no amount is empty", fmtBedrag(0), "")
eq("short amounts", [fmtBedragKort(300000), fmtBedragKort(1100000), fmtBedragKort(2100000), fmtBedragKort(0), fmtBedragKort(950)], ["€ 300k", "€ 1,1 mln", "€ 2,1 mln", "€ 0", "€ 950"])
eq("percentages", [fmtPct(6.5), fmtPct(7), fmtPct(6.75), fmtPct(null)], ["6,5%", "7%", "6,75%", ""])
eq("durations", [fmtDuur(36), fmtDuur(null)], ["36 mnd", ""])

console.log(fails === 0 ? "\nALL PASS" : `\n${fails} FAILED`)
process.exit(fails === 0 ? 0 : 1)
