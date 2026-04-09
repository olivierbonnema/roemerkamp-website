

function StepIndicator({ current }: { current: number }) {
  return (
    <div className="flex items-center mb-10 max-w-xl">
      {STEPS.map((s, i) => {
        const done = i < current
        const active = i === current
        return (
          <div key={s.id} className={`flex items-center ${i < STEPS.length - 1 ? "flex-1" : ""}`}>
            <div className="flex flex-col items-center min-w-[56px]">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[13px] font-medium font-sans transition-all duration-300 ${done ? "bg-[#311E86] text-white" : active ? "bg-[#1E3A5F] text-white" : "border-[1.5px] border-gray-300 text-gray-400"}`}>
                {done ? "\u2713" : i + 1}
              </div>
              <span className={`text-[11px] mt-1.5 whitespace-nowrap font-sans ${active ? "text-gray-900 font-semibold" : "text-gray-400"}`}>
                {s.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`flex-1 h-[1.5px] mx-1.5 mb-[18px] transition-colors duration-300 ${done ? "bg-[#311E86]" : "bg-gray-200"}`} />
            )}
          </div>
        )
      })}
    </div>
  )
}

function Field({ label, required, hint, children }: { label: string; required?: boolean; hint?: string; children: React.ReactNode }) {
  return (
    <div className="mb-5">
      <label className="block text-[13px] font-medium mb-2 text-gray-900 font-sans">
        {label}
        {required && <span className="text-[#F75D20] ml-1">*</span>}
      </label>
      {children}
      {hint && <p className="text-xs text-gray-400 mt-1.5 ml-2 font-sans">{hint}</p>}
    </div>
  )
}

function Input({ value, onChange, placeholder, type = "text" }: { value: string; onChange: (v: string) => void; placeholder: string; type?: string }) {
  return (
    <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
      className="w-full h-[46px] px-5 py-3 text-sm font-sans bg-transparent border border-gray-300 rounded-full text-gray-900 placeholder:text-gray-400 outline-none focus:border-[#1E3A5F] transition-colors" />
  )
}

function Select({ value, onChange, options, placeholder }: { value: string; onChange: (v: string) => void; options: string[]; placeholder: string }) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)}
      className={`w-full h-[46px] px-5 py-3 text-sm font-sans bg-white border border-gray-300 rounded-full outline-none focus:border-[#1E3A5F] transition-colors appearance-none cursor-pointer pr-10 ${value ? "text-gray-900" : "text-gray-400"}`}
      style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' fill='none'%3E%3Cpath d='M1 1.5l5 5 5-5' stroke='%236B6B6B' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`, backgroundRepeat: "no-repeat", backgroundPosition: "right 16px center" }}>
      <option value="">{placeholder}</option>
      {options.map((o) => (<option key={o} value={o}>{o}</option>))}
    </select>
  )
}

function Textarea({ value, onChange, placeholder, rows = 3 }: { value: string; onChange: (v: string) => void; placeholder: string; rows?: number }) {
  return (
    <textarea value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} rows={rows}
      className="w-full px-5 py-3 text-sm font-sans bg-transparent border border-gray-300 rounded-[20px] text-gray-900 placeholder:text-gray-400 outline-none focus:border-[#1E3A5F] transition-colors resize-y leading-relaxed" />
  )
}

function TwoCol({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{children}</div>
}

function DocUploadCard({ cat, files, onAdd, onRemove }: { cat: (typeof DOC_CATEGORIES)[0]; files: Record<string, string[]>; onAdd: (catId: string, names: string[]) => void; onRemove: (catId: string, idx: number) => void }) {
  const ref = useRef<HTMLInputElement>(null)
  const catFiles = files[cat.id] || []
  return (
    <div className="border border-gray-200 rounded-2xl p-4 px-5 mb-3 bg-white">
      <div className="flex justify-between items-start gap-3">
        <div className="flex-1">
          <div className="text-sm font-medium text-gray-900 font-sans">
            {cat.label}
            {cat.required && <span className="text-[11px] text-[#F75D20] ml-2 font-normal">verplicht</span>}
          </div>
          <div className="text-xs text-gray-400 mt-0.5 font-sans">{cat.desc}</div>
        </div>
        <button onClick={() => ref.current?.click()}
          className="px-4 py-2 text-xs font-medium font-sans border border-gray-300 rounded-full bg-transparent text-gray-900 cursor-pointer whitespace-nowrap hover:border-[#1E3A5F] hover:text-[#1E3A5F] transition-colors">
          + Uploaden
        </button>
        <input ref={ref} type="file" multiple hidden onChange={(e) => { const names = Array.from(e.t"use client"

import { useState, useRef } from "react"

/* ── Constants ── */
const STEPS = [
  { id: "aanvrager", label: "Aanvrager" },
  { id: "object", label: "Object" },
  { id: "financiering", label: "Financiering" },
  { id: "documenten", label: "Documenten" },
  { id: "overzicht", label: "Overzicht" },
]

const PROPERTY_TYPES = [
  "Woning — eengezins",
  "Woning — meergezins",
  "Woning — appartement",
  "Commercieel — kantoor",
  "Commercieel — retail",
  "Commercieel — industrieel",
  "Gemengd gebruik",
  "Grond / ontwikkellocatie",
]

const LOAN_PURPOSES = [
  "Aankoopfinanciering",
  "Herfinanciering",
  "Overbruggingsfinanciering",
  "Ontwikkelfinanciering",
  "Renovatiefinanciering",
]

const DOC_CATEGORIES = [
  { id: "id_doc", label: "Identiteitsbewijs", desc: "Paspoort of identiteitskaart", required: true },
  { id: "kvk", label: "KvK-uittreksel", desc: "Inschrijving Kamer van Koophandel (indien rechtspersoon)", required: false },
  { id: "inkomen", label: "Inkomensdocumentatie", desc: "Jaaropgaven, belastingaangiften, loonstroken", required: true },
  { id: "taxatie", label: "Taxatierapport", desc: "Taxatierapport of recente waardebepaling", required: true },
  { id: "koopovereenkomst", label: "Koopovereenkomst", desc: "Indien aankoopfinanciering", required: false },
  { id: "schulden", label: "Overzicht bestaande schulden", desc: "Hypotheekafschriften, leningovereenkomsten", required: false },
  { id: "entiteit", label: "Financi\u00eble stukken entiteit", desc: "Balans, winst-/verliesrekening (indien rechtspersoon)", required: false },
  { id: "overig", label: "Overige documenten", desc: "Verbouwingsplannen, huurovereenkomsten, etc.", required: false },
]arget.files || []).map((f) => f.name); onAdd(cat.id, names); e.target.value = "" }} />
      </div>
      {catFiles.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {catFiles.map((f, i) => (
            <div key={i} className="inline-flex items-center gap-1.5 px-3.5 py-1 text-xs rounded-full bg-[#FAF9F7] text-gray-900 font-sans">
              <span className="max-w-[180px] overflow-hidden text-ellipsis whitespace-nowrap">{f}</span>
              <span onClick={() => onRemove(cat.id, i)} className="cursor-pointer opacity-40 text-base leading-none ml-0.5 hover:opacity-70">\u00d7</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function ReviewRow({ label, value }: { label: string; value?: string }) {
  if (!value) return null
  return (
    <div className="flex justify-between py-2.5 border-b border-[#FAF9F7] text-sm font-sans">
      <span className="text-gray-400">{label}</span>
      <span className="text-gray-900 font-medium text-right max-w-[60%]">{value}</span>
    </div>
  )
}

function ReviewSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-8">
      <h3 className="text-lg font-semibold text-[#311E86] font-serif mb-4 pb-2 border-b-2 border-[#FAF9F7]">{title}</h3>
      {children}
    </div>
  )
}

/* ── Sub-components ── */

function StepIndicator({ current }: { current: number }) {
  return (
    <div className="flex items-center mb-10 max-w-xl">
      {STEPS.map((s, i) => {
        const done = i < current
        const active = i === current
        return (
          <div key={s.id} className={`flex items-center ${i < STEPS.length - 1 ? "flex-1" : ""}`}>
            <div className="flex flex-col items-center min-w-[56px]">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-[13px] font-medium font-sans transition-all duration-300 ${
                  done
                    ? "bg-[#311E86] text-white"
                    : active
                    ? "bg-[#1E3A5F] text-white"
                    : "border-[1.5px] border-gray-300 text-gray-400"
                }`}
              >
                {done ? "\u2713" : i + 1}
              </div>
              <span
                className={`text-[11px] mt-1.5 whitespace-nowrap font-sans ${
                  active ? "text-gray-900 font-semibold" : "text-gray-400"
                }`}
              >
                {s.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div
                className={`flex-1 h-[1.5px] mx-1.5 mb-[18px] transition-colors duration-300 ${
                  done ? "bg-[#311E86]" : "bg-gray-200"
                }`}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}

function Field({ label, required, hint, children }: { label: string; required?: boolean; hint?: string; children: React.ReactNode }) {
  return (
    <div className="mb-5">
      <label className="block text-[13px] font-medium mb-2 text-gray-900 font-sans">
        {label}
        {required && <span className="text-[#F75D20] ml-1">*</span>}
      </label>
      {children}
      {hint && <p className="text-xs text-gray-400 mt-1.5 ml-2 font-sans">{hint}</p>}
    </div>
  )
}

function Input({ value, onChange, placeholder, type = "text" }: { value: string; onChange: (v: string) => void; placeholder: string; type?: string }) {
  return (
    <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
      className="w-full h-[46px] px-5 py-3 text-sm font-sans bg-transparent border border-gray-300 rounded-full text-gray-900 placeholder:text-gray-400 outline-none focus:border-[#1E3A5F] transition-colors" />
  )
}

function Select({ value, onChange, options, placeholder }: { value: string; onChange: (v: string) => void; options: string[]; placeholder: string }) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)}
      className={`w-full h-[46px] px-5 py-3 text-sm font-sans bg-white border border-gray-300 rounded-full outline-none focus:border-[#1E3A5F] transition-colors appearance-none cursor-pointer pr-10 ${value ? "text-gray-900" : "text-gray-400"}`}
      style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' fill='none'%3E%3Cpath d='M1 1.5l5 5 5-5' stroke='%236B6B6B' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`, backgroundRepeat: "no-repeat", backgroundPosition: "right 16px center" }}>
      <option value="">{placeholder}</option>
      {options.map((o) => (<option key={o} value={o}>{o}</option>))}
    </select>
  )
}

function Textarea({ value, onChange, placeholder, rows = 3 }: { value: string; onChange: (v: string) => void; placeholder: string; rows?: number }) {
  return (
    <textarea value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} rows={rows}
      className="w-full px-5 py-3 text-sm font-sans bg-transparent border border-gray-300 rounded-[20px] text-gray-900 placeholder:text-gray-400 outline-none focus:border-[#1E3A5F] transition-colors resize-y leading-relaxed" />
  )
}

function TwoCol({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{children}</div>
}

export function FinancingForm() {
  const [step, setStep] = useState(0)
  const [submitted, setSubmitted] = useState(false)
  const [aanvragerType, setAanvragerType] = useState("")
  const [naam, setNaam] = useState("")
  const [bedrijfsnaam, setBedrijfsnaam] = useState("")
  const [kvkNummer, setKvkNummer] = useState("")
  const [email, setEmail] = useState("")
  const [telefoon, setTelefoon] = useState("")
  const [adres, setAdres] = useState("")
  const [objectType, setObjectType] = useState("")
  const [objectAdres, setObjectAdres] = useState("")
  const [objectPostcode, setObjectPostcode] = useState("")
  const [objectPlaats, setObjectPlaats] = useState("")
  const [objectWaarde, setObjectWaarde] = useState("")
  const [objectOppervlakte, setObjectOppervlakte] = useState("")
  const [bouwjaar, setBouwjaar] = useState("")
  const [huurinkomsten, setHuurinkomsten] = useState("")
  const [leningDoel, setLeningDoel] = useState("")
  const [leningBedrag, setLeningBedrag] = useState("")
  const [looptijd, setLooptijd] = useState("")
  const [eigenInbreng, setEigenInbreng] = useState("")
  const [bestaandeSchulden, setBestaandeSchulden] = useState("")
  const [toelichting, setToelichting] = useState("")
  const [files, setFiles] = useState<Record<string, string[]>>({})

  const addFiles = (catId: string, names: string[]) => { setFiles((prev) => ({ ...prev, [catId]: [...(prev[catId] || []), ...names] })) }
  const removeFile = (catId: string, idx: number) => { setFiles((prev) => ({ ...prev, [catId]: (prev[catId] || []).filter((_, i) => i !== idx) })) }
  const totalFiles = Object.values(files).flat().length
  const next = () => setStep((s) => Math.min(s + 1, STEPS.length - 1))
  const prev = () => setStep((s) => Math.max(s - 1, 0))
  const handleSubmit = () => { setSubmitted(true) }
  const fmt = (v: string) => v || "\u2014"

  if (submitted) {
    return (
      <div className="max-w-xl mx-auto text-center py-20">
        <div className="w-16 h-16 rounded-full bg-[#1E3A5F] flex items-center justify-center mx-auto mb-6 text-3xl text-white">\u2713</div>
        <div className="w-12 h-1 bg-[#F75D20] rounded-sm mb-4 mx-auto" />
        <h2 className="font-serif text-3xl font-normal text-[#1E3A5F] mb-4">Aanvraag ontvangen</h2>
        <p className="text-base text-gray-400 leading-relaxed mb-8 font-sans">Bedankt voor uw financieringsaanvraag. Uw documenten worden verwerkt en u ontvangt binnen twee werkdagen een eerste beoordeling van ons team.</p>
        <button onClick={() => { setSubmitted(false); setStep(0) }} className="px-8 py-3 text-sm font-medium font-sans border border-gray-300 rounded-full bg-transparent text-gray-900 cursor-pointer hover:border-[#1E3A5F] transition-colors">Nieuwe aanvraag</button>
      </div>
    )
  }

  const renderStep = () => {
    switch (step) {
      case 0:
        return (<div>
          <h2 className="font-serif text-[22px] font-semibold text-[#311E86] mb-2">Gegevens aanvrager</h2>
          <p className="font-sans text-sm text-gray-400 mb-7">Vul de gegevens in van de persoon of entiteit die de financiering aanvraagt.</p>
          <Field label="Type aanvrager" required><Select value={aanvragerType} onChange={setAanvragerType} options={["Particulier", "Rechtspersoon (BV/NV)", "Vennootschap (VOF/CV)", "Stichting"]} placeholder="Selecteer type aanvrager" /></Field>
          <TwoCol><Field label="Volledige naam" required><Input value={naam} onChange={setNaam} placeholder="Naam" /></Field><Field label="E-mailadres" required><Input value={email} onChange={setEmail} placeholder="E-mailadres" type="email" /></Field></TwoCol>
          {aanvragerType && aanvragerType !== "Particulier" && (<TwoCol><Field label="Bedrijfsnaam"><Input value={bedrijfsnaam} onChange={setBedrijfsnaam} placeholder="Bedrijfsnaam" /></Field><Field label="KvK-nummer"><Input value={kvkNummer} onChange={setKvkNummer} placeholder="KvK-nummer" /></Field></TwoCol>)}
          <TwoCol><Field label="Telefoonnummer" required><Input value={telefoon} onChange={setTelefoon} placeholder="Telefoonnummer" type="tel" /></Field><Field label="Adres"><Input value={adres} onChange={setAdres} placeholder="Straat, huisnr, postcode, plaats" /></Field></TwoCol>
        </div>)
      case 1:
        return (<div>
          <h2 className="font-serif text-[22px] font-semibold text-[#311E86] mb-2">Objectgegevens</h2>
          <p className="font-sans text-sm text-gray-400 mb-7">Gegevens over het vastgoed waarvoor financiering wordt aangevraagd.</p>
          <Field label="Type vastgoed" required><Select value={objectType} onChange={setObjectType} options={PROPERTY_TYPES} placeholder="Selecteer type vastgoed" /></Field>
          <Field label="Adres van het object" required><Input value={objectAdres} onChange={setObjectAdres} placeholder="Straatnaam en huisnummer" /></Field>
          <TwoCol><Field label="Postcode"><Input value={objectPostcode} onChange={setObjectPostcode} placeholder="1234 AB" /></Field><Field label="Plaats"><Input value={objectPlaats} onChange={setObjectPlaats} placeholder="Plaats" /></Field></TwoCol>
          <TwoCol><Field label="Geschatte marktwaarde" required hint="Op basis van taxatie of recente waardebepaling"><Input value={objectWaarde} onChange={setObjectWaarde} placeholder="\u20ac" /></Field><Field label="Oppervlakte (m\u00b2)"><Input value={objectOppervlakte} onChange={setObjectOppervlakte} placeholder="m\u00b2" /></Field></TwoCol>
          <TwoCol><Field label="Bouwjaar"><Input value={bouwjaar} onChange={setBouwjaar} placeholder="Bouwjaar" /></Field><Field label="Huurinkomsten (per maand)" hint="Indien van toepassing"><Input value={huurinkomsten} onChange={setHuurinkomsten} placeholder="\u20ac / maand" /></Field></TwoCol>
        </div>)
      case 2:
        return (<div>
          <h2 className="font-serif text-[22px] font-semibold text-[#311E86] mb-2">Financieringsdetails</h2>
          <p className="font-sans text-sm text-gray-400 mb-7">Geef aan wat voor financiering u zoekt en onder welke voorwaarden.</p>
          <Field label="Doel van de financiering" required><Select value={leningDoel} onChange={setLeningDoel} options={LOAN_PURPOSES} placeholder="Selecteer financieringsdoel" /></Field>
          <TwoCol><Field label="Gewenst leningbedrag" required><Input value={leningBedrag} onChange={setLeningBedrag} placeholder="\u20ac" /></Field><Field label="Gewenste looptijd" required><Select value={looptijd} onChange={setLooptijd} options={["6 maanden","12 maanden","18 maanden","24 maanden","36 maanden","48 maanden","60 maanden"]} placeholder="Selecteer looptijd" /></Field></TwoCol>
          <TwoCol><Field label="Eigen inbreng" hint="Bedrag dat u zelf inlegt"><Input value={eigenInbreng} onChange={setEigenInbreng} placeholder="\u20ac" /></Field><Field label="Bestaande schulden" hint="Totaal aan lopende verplichtingen"><Input value={bestaandeSchulden} onChange={setBestaandeSchulden} placeholder="\u20ac" /></Field></TwoCol>
          <Field label="Toelichting" hint="Aanvullende informatie over uw aanvraag"><Textarea value={toelichting} onChange={setToelichting} placeholder="Beschrijf eventueel de situatie, het plan of bijzondere omstandigheden..." rows={4} /></Field>
        </div>)
      case 3:
        return (<div>
          <h2 className="font-serif text-[22px] font-semibold text-[#311E86] mb-2">Documenten uploaden</h2>
          <p className="font-sans text-sm text-gray-400 mb-7">Upload de benodigde documenten. Verplichte documenten zijn gemarkeerd.</p>
          {DOC_CATEGORIES.map((cat) => (<DocUploadCard key={cat.id} cat={cat} files={files} onAdd={addFiles} onRemove={removeFile} />))}
          <div className="mt-4 px-5 py-3 rounded-xl bg-[#FAF9F7] text-[13px] text-gray-400 font-sans">{totalFiles} {totalFiles === 1 ? "bestand" : "bestanden"} geselecteerd voor upload</div>
        </div>)
      case 4:
        return (<div>
          <h2 className="font-serif text-[22px] font-semibold text-[#311E86] mb-2">Overzicht aanvraag</h2>
          <p className="font-sans text-sm text-gray-400 mb-7">Controleer de ingevulde gegevens voordat u de aanvraag indient.</p>
          <ReviewSection title="Aanvrager"><ReviewRow label="Type" value={fmt(aanvragerType)} /><ReviewRow label="Naam" value={fmt(naam)} />{bedrijfsnaam && <ReviewRow label="Bedrijfsnaam" value={bedrijfsnaam} />}{kvkNummer && <ReviewRow label="KvK-nummer" value={kvkNummer} />}<ReviewRow label="E-mail" value={fmt(email)} /><ReviewRow label="Telefoon" value={fmt(telefoon)} />{adres && <ReviewRow label="Adres" value={adres} />}</ReviewSection>
          <ReviewSection title="Object"><ReviewRow label="Type" value={fmt(objectType)} /><ReviewRow label="Adres" value={fmt(objectAdres)} /><ReviewRow label="Postcode / Plaats" value={`${objectPostcode} ${objectPlaats}`.trim() || "\u2014"} /><ReviewRow label="Marktwaarde" value={objectWaarde ? `\u20ac ${objectWaarde}` : "\u2014"} />{objectOppervlakte && <ReviewRow label="Oppervlakte" value={`${objectOppervlakte} m\u00b2`} />}{bouwjaar && <ReviewRow label="Bouwjaar" value={bouwjaar} />}{huurinkomsten && <ReviewRow label="Huurinkomsten" value={`\u20ac ${huurinkomsten} / maand`} />}</ReviewSection>
          <ReviewSection title="Financiering"><ReviewRow label="Doel" value={fmt(leningDoel)} /><ReviewRow label="Leningbedrag" value={leningBedrag ? `\u20ac ${leningBedrag}` : "\u2014"} /><ReviewRow label="Looptijd" value={fmt(looptijd)} />{eigenInbreng && <ReviewRow label="Eigen inbreng" value={`\u20ac ${eigenInbreng}`} />}{bestaandeSchulden && <ReviewRow label="Bestaande schulden" value={`\u20ac ${bestaandeSchulden}`} />}{toelichting && <ReviewRow label="Toelichting" value={toelichting} />}</ReviewSection>
          <ReviewSection title="Documenten">{Object.entries(files).filter(([, v]) => v.length > 0).map(([catId, catFiles]) => { const cat = DOC_CATEGORIES.find((c) => c.id === catId); return <ReviewRow key={catId} label={cat?.label || catId} value={`${catFiles.length} ${catFiles.length === 1 ? "bestand" : "bestanden"}`} /> })}{totalFiles === 0 && <p className="text-sm text-gray-400 font-sans italic">Geen documenten ge\u00fcpload</p>}</ReviewSection>
          <div className="px-5 py-4 rounded-xl bg-[#FAF9F7] text-[13px] text-gray-400 font-sans leading-relaxed mt-2">Door op \u201cAanvraag indienen\u201d te klikken, geeft u toestemming aan Lange Financieel Advies om uw gegevens te verwerken ten behoeve van de beoordeling van uw financieringsaanvraag. Uw documenten worden veilig opgeslagen in een beveiligde dataroom.</div>
        </div>)
      default: return null
    }
  }

  return (
    <div>
      <StepIndicator current={step} />
      {renderStep()}
      <div className="flex justify-between items-center mt-10 pt-6 border-t border-[#FAF9F7]">
        {step > 0 ? (<button onClick={prev} className="px-7 py-3 text-sm font-medium font-sans border border-gray-300 rounded-full bg-transparent text-gray-900 cursor-pointer hover:border-[#1E3A5F] transition-colors">\u2190 Vorige</button>) : (<div />)}
        {step < STEPS.length - 1 ? (<button onClick={next} className="px-8 py-3 text-sm font-medium font-sans border-none rounded-full bg-[#311E86] text-white cursor-pointer hover:bg-[#26175e] transition-colors">Volgende \u2192</button>) : (<button onClick={handleSubmit} className="px-8 py-3 text-sm font-medium font-sans border-none rounded-full bg-[#311E86] text-white cursor-pointer hover:bg-[#26175e] transition-colors">Aanvraag indienen</button>)}
      </div>
    </div>
  )
}

function DocUploadCard({ cat, files, onAdd, onRemove }: { cat: (typeof DOC_CATEGORIES)[0]; files: Record<string, string[]>; onAdd: (catId: string, names: string[]) => void; onRemove: (catId: string, idx: number) => void }) {
  const ref = useRef<HTMLInputElement>(null)
  const catFiles = files[cat.id] || []
  return (
    <div className="border border-gray-200 rounded-2xl p-4 px-5 mb-3 bg-white">
      <div className="flex justify-between items-start gap-3">
        <div className="flex-1">
          <div className="text-sm font-medium text-gray-900 font-sans">
            {cat.label}
            {cat.required && (<span className="text-[11px] text-[#F75D20] ml-2 font-normal">verplicht</span>)}
          </div>
          <div className="text-xs text-gray-400 mt-0.5 font-sans">{cat.desc}</div>
        </div>
        <button onClick={() => ref.current?.click()}
          className="px-4 py-2 text-xs font-medium font-sans border border-gray-300 rounded-full bg-transparent text-gray-900 cursor-pointer whitespace-nowrap hover:border-[#1E3A5F] hover:text-[#1E3A5F] transition-colors">
          + Uploaden
        </button>
        <input ref={ref} type="file" multiple hidden onChange={(e) => { const names = Array.from(e.target.files || []).map((f) => f.name); onAdd(cat.id, names); e.target.value = "" }} />
      </div>
      {catFiles.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {catFiles.map((f, i) => (
            <div key={i} className="inline-flex items-center gap-1.5 px-3.5 py-1 text-xs rounded-full bg-[#FAF9F7] text-gray-900 font-sans">
              <span className="max-w-[180px] overflow-hidden text-ellipsis whitespace-nowrap">{f}</span>
              <span onClick={() => onRemove(cat.id, i)} className="cursor-pointer opacity-40 text-base leading-none ml-0.5 hover:opacity-70">\u00d7</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function ReviewRow({ label, value }: { label: string; value?: string }) {
  if (!value) return null
  return (
    <div className="flex justify-between py-2.5 border-b border-[#FAF9F7] text-sm font-sans">
      <span className="text-gray-400">{label}</span>
      <span className="text-gray-900 font-medium text-right max-w-[60%]">{value}</span>
    </div>
  )
}

function ReviewSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-8">
      <h3 className="text-lg font-semibold text-[#311E86] font-serif mb-4 pb-2 border-b-2 border-[#FAF9F7]">{title}</h3>
      {children}
    </div>
  )
}

/* ── Main form component ── */

export function FinancingForm() {
  const [step, setStep] = useState(0)
  const [submitted, setSubmitted] = useState(false)
  const [aanvragerType, setAanvragerType] = useState("")
  const [naam, setNaam] = useState("")
  const [bedrijfsnaam, setBedrijfsnaam] = useState("")
  const [kvkNummer, setKvkNummer] = useState("")
  const [email, setEmail] = useState("")
  const [telefoon, setTelefoon] = useState("")
  const [adres, setAdres] = useState("")
  const [objectType, setObjectType] = useState("")
  const [objectAdres, setObjectAdres] = useState("")
  const [objectPostcode, setObjectPostcode] = useState("")
  const [objectPlaats, setObjectPlaats] = useState("")
  const [objectWaarde, setObjectWaarde] = useState("")
  const [objectOppervlakte, setObjectOppervlakte] = useState("")
  const [bouwjaar, setBouwjaar] = useState("")
  const [huurinkomsten, setHuurinkomsten] = useState("")
  const [leningDoel, setLeningDoel] = useState("")
  const [leningBedrag, setLeningBedrag] = useState("")
  const [looptijd, setLooptijd] = useState("")
  const [eigenInbreng, setEigenInbreng] = useState("")
  const [bestaandeSchulden, setBestaandeSchulden] = useState("")
  const [toelichting, setToelichting] = useState("")
  const [files, setFiles] = useState<Record<string, string[]>>({})

  const addFiles = (catId: string, names: string[]) => { setFiles((prev) => ({ ...prev, [catId]: [...(prev[catId] || []), ...names] })) }
  const removeFile = (catId: string, idx: number) => { setFiles((prev) => ({ ...prev, [catId]: (prev[catId] || []).filter((_, i) => i !== idx) })) }
  const totalFiles = Object.values(files).flat().length
  const next = () => setStep((s) => Math.min(s + 1, STEPS.length - 1))
  const prev = () => setStep((s) => Math.max(s - 1, 0))
  const handleSubmit = () => { setSubmitted(true) }
  const fmt = (v: string) => v || "\u2014"

  if (submitted) {
    return (
      <div className="max-w-xl mx-auto text-center py-20">
        <div className="w-16 h-16 rounded-full bg-[#1E3A5F] flex items-center justify-center mx-auto mb-6 text-3xl text-white">\u2713</div>
        <div className="w-12 h-1 bg-[#F75D20] rounded-sm mb-4 mx-auto" />
        <h2 className="font-serif text-3xl font-normal text-[#1E3A5F] mb-4">Aanvraag ontvangen</h2>
        <p className="text-base text-gray-400 leading-relaxed mb-8 font-sans">Bedankt voor uw financieringsaanvraag. Uw documenten worden verwerkt en u ontvangt binnen twee werkdagen een eerste beoordeling van ons team.</p>
        <button onClick={() => { setSubmitted(false); setStep(0) }} className="px-8 py-3 text-sm font-medium font-sans border border-gray-300 rounded-full bg-transparent text-gray-900 cursor-pointer hover:border-[#1E3A5F] transition-colors">Nieuwe aanvraag</button>
      </div>
    )
  }

  const renderStep = () => {
    switch (step) {
      case 0:
        return (
          <div>
            <h2 className="font-serif text-[22px] font-semibold text-[#311E86] mb-2">Gegevens aanvrager</h2>
            <p className="font-sans text-sm text-gray-400 mb-7">Vul de gegevens in van de persoon of entiteit die de financiering aanvraagt.</p>
            <Field label="Type aanvrager" required><Select value={aanvragerType} onChange={setAanvragerType} options={["Particulier", "Rechtspersoon (BV/NV)", "Vennootschap (VOF/CV)", "Stichting"]} placeholder="Selecteer type aanvrager" /></Field>
            <TwoCol><Field label="Volledige naam" required><Input value={naam} onChange={setNaam} placeholder="Naam" /></Field><Field label="E-mailadres" required><Input value={email} onChange={setEmail} placeholder="E-mailadres" type="email" /></Field></TwoCol>
            {aanvragerType && aanvragerType !== "Particulier" && (<TwoCol><Field label="Bedrijfsnaam"><Input value={bedrijfsnaam} onChange={setBedrijfsnaam} placeholder="Bedrijfsnaam" /></Field><Field label="KvK-nummer"><Input value={kvkNummer} onChange={setKvkNummer} placeholder="KvK-nummer" /></Field></TwoCol>)}
            <TwoCol><Field label="Telefoonnummer" required><Input value={telefoon} onChange={setTelefoon} placeholder="Telefoonnummer" type="tel" /></Field><Field label="Adres"><Input value={adres} onChange={setAdres} placeholder="Straat, huisnr, postcode, plaats" /></Field></TwoCol>
          </div>
        )
      case 1:
        return (
          <div>
            <h2 className="font-serif text-[22px] font-semibold text-[#311E86] mb-2">Objectgegevens</h2>
            <p className="font-sans text-sm text-gray-400 mb-7">Gegevens over het vastgoed waarvoor financiering wordt aangevraagd.</p>
            <Field label="Type vastgoed" required><Select value={objectType} onChange={setObjectType} options={PROPERTY_TYPES} placeholder="Selecteer type vastgoed" /></Field>
            <Field label="Adres van het object" required><Input value={objectAdres} onChange={setObjectAdres} placeholder="Straatnaam en huisnummer" /></Field>
            <TwoCol><Field label="Postcode"><Input value={objectPostcode} onChange={setObjectPostcode} placeholder="1234 AB" /></Field><Field label="Plaats"><Input value={objectPlaats} onChange={setObjectPlaats} placeholder="Plaats" /></Field></TwoCol>
            <TwoCol><Field label="Geschatte marktwaarde" required hint="Op basis van taxatie of recente waardebepaling"><Input value={objectWaarde} onChange={setObjectWaarde} placeholder="\u20ac" /></Field><Field label="Oppervlakte (m\u00b2)"><Input value={objectOppervlakte} onChange={setObjectOppervlakte} placeholder="m\u00b2" /></Field></TwoCol>
            <TwoCol><Field label="Bouwjaar"><Input value={bouwjaar} onChange={setBouwjaar} placeholder="Bouwjaar" /></Field><Field label="Huurinkomsten (per maand)" hint="Indien van toepassing"><Input value={huurinkomsten} onChange={setHuurinkomsten} placeholder="\u20ac / maand" /></Field></TwoCol>
          </div>
        )
      case 2:
        return (
          <div>
            <h2 className="font-serif text-[22px] font-semibold text-[#311E86] mb-2">Financieringsdetails</h2>
            <p className="font-sans text-sm text-gray-400 mb-7">Geef aan wat voor financiering u zoekt en onder welke voorwaarden.</p>
            <Field label="Doel van de financiering" required><Select value={leningDoel} onChange={setLeningDoel} options={LOAN_PURPOSES} placeholder="Selecteer financieringsdoel" /></Field>
            <TwoCol><Field label="Gewenst leningbedrag" required><Input value={leningBedrag} onChange={setLeningBedrag} placeholder="\u20ac" /></Field><Field label="Gewenste looptijd" required><Select value={looptijd} onChange={setLooptijd} options={["6 maanden", "12 maanden", "18 maanden", "24 maanden", "36 maanden", "48 maanden", "60 maanden"]} placeholder="Selecteer looptijd" /></Field></TwoCol>
            <TwoCol><Field label="Eigen inbreng" hint="Bedrag dat u zelf inlegt"><Input value={eigenInbreng} onChange={setEigenInbreng} placeholder="\u20ac" /></Field><Field label="Bestaande schulden" hint="Totaal aan lopende verplichtingen"><Input value={bestaandeSchulden} onChange={setBestaandeSchulden} placeholder="\u20ac" /></Field></TwoCol>
            <Field label="Toelichting" hint="Aanvullende informatie over uw aanvraag"><Textarea value={toelichting} onChange={setToelichting} placeholder="Beschrijf eventueel de situatie, het plan of bijzondere omstandigheden..." rows={4} /></Field>
          </div>
        )
      case 3:
        return (
          <div>
            <h2 className="font-serif text-[22px] font-semibold text-[#311E86] mb-2">Documenten uploaden</h2>
            <p className="font-sans text-sm text-gray-400 mb-7">Upload de benodigde documenten. Verplichte documenten zijn gemarkeerd. U kunt meerdere bestanden per categorie uploaden.</p>
            {DOC_CATEGORIES.map((cat) => (<DocUploadCard key={cat.id} cat={cat} files={files} onAdd={addFiles} onRemove={removeFile} />))}
            <div className="mt-4 px-5 py-3 rounded-xl bg-[#FAF9F7] text-[13px] text-gray-400 font-sans">{totalFiles} {totalFiles === 1 ? "bestand" : "bestanden"} geselecteerd voor upload</div>
          </div>
        )
      case 4:
        return (
          <div>
            <h2 className="font-serif text-[22px] font-semibold text-[#311E86] mb-2">Overzicht aanvraag</h2>
            <p className="font-sans text-sm text-gray-400 mb-7">Controleer de ingevulde gegevens voordat u de aanvraag indient.</p>
            <ReviewSection title="Aanvrager"><ReviewRow label="Type" value={fmt(aanvragerType)} /><ReviewRow label="Naam" value={fmt(naam)} />{bedrijfsnaam && <ReviewRow label="Bedrijfsnaam" value={bedrijfsnaam} />}{kvkNummer && <ReviewRow label="KvK-nummer" value={kvkNummer} />}<ReviewRow label="E-mail" value={fmt(email)} /><ReviewRow label="Telefoon" value={fmt(telefoon)} />{adres && <ReviewRow label="Adres" value={adres} />}</ReviewSection>
            <ReviewSection title="Object"><ReviewRow label="Type" value={fmt(objectType)} /><ReviewRow label="Adres" value={fmt(objectAdres)} /><ReviewRow label="Postcode / Plaats" value={`${objectPostcode} ${objectPlaats}`.trim() || "\u2014"} /><ReviewRow label="Marktwaarde" value={objectWaarde ? `\u20ac ${objectWaarde}` : "\u2014"} />{objectOppervlakte && <ReviewRow label="Oppervlakte" value={`${objectOppervlakte} m\u00b2`} />}{bouwjaar && <ReviewRow label="Bouwjaar" value={bouwjaar} />}{huurinkomsten && (<ReviewRow label="Huurinkomsten" value={`\u20ac ${huurinkomsten} / maand`} />)}</ReviewSection>
            <ReviewSection title="Financiering"><ReviewRow label="Doel" value={fmt(leningDoel)} /><ReviewRow label="Leningbedrag" value={leningBedrag ? `\u20ac ${leningBedrag}` : "\u2014"} /><ReviewRow label="Looptijd" value={fmt(looptijd)} />{eigenInbreng && <ReviewRow label="Eigen inbreng" value={`\u20ac ${eigenInbreng}`} />}{bestaandeSchulden && (<ReviewRow label="Bestaande schulden" value={`\u20ac ${bestaandeSchulden}`} />)}{toelichting && <ReviewRow label="Toelichting" value={toelichting} />}</ReviewSection>
            <ReviewSection title="Documenten">{Object.entries(files).filter(([, v]) => v.length > 0).map(([catId, catFiles]) => { const cat = DOC_CATEGORIES.find((c) => c.id === catId); return (<ReviewRow key={catId} label={cat?.label || catId} value={`${catFiles.length} ${catFiles.length === 1 ? "bestand" : "bestanden"}`} />) })}{totalFiles === 0 && (<p className="text-sm text-gray-400 font-sans italic">Geen documenten ge\u00fcpload</p>)}</ReviewSection>
            <div className="px-5 py-4 rounded-xl bg-[#FAF9F7] text-[13px] text-gray-400 font-sans leading-relaxed mt-2">Door op &ldquo;Aanvraag indienen&rdquo; te klikken, geeft u toestemming aan Lange Financieel Advies om uw gegevens te verwerken ten behoeve van de beoordeling van uw financieringsaanvraag. Uw documenten worden veilig opgeslagen in een beveiligde dataroom.</div>
          </div>
        )
      default:
        return null
    }
  }

  return (
    <div>
      <StepIndicator current={step} />
      {renderStep()}
      <div className="flex justify-between items-center mt-10 pt-6 border-t border-[#FAF9F7]">
        {step > 0 ? (<button onClick={prev} className="px-7 py-3 text-sm font-medium font-sans border border-gray-300 rounded-full bg-transparent text-gray-900 cursor-pointer hover:border-[#1E3A5F] transition-colors">\u2190 Vorige</button>) : (<div />)}
        {step < STEPS.length - 1 ? (<button onClick={next} className="px-8 py-3 text-sm font-medium font-sans border-none rounded-full bg-[#311E86] text-white cursor-pointer hover:bg-[#26175e] transition-colors">Volgende \u2192</button>) : (<button onClick={handleSubmit} className="px-8 py-3 text-sm font-medium font-sans border-none rounded-full bg-[#311E86] text-white cursor-pointer hover:bg-[#26175e] transition-colors">Aanvraag indienen</button>)}
      </div>
    </div>
  )
}
