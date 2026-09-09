// Kleine XML-leeshulpjes voor de SOAP-koppelingen met de Rechtspraak.
//
// Bewust geen XML-bibliotheek: bij CCBR moet het ondertekende SAML-token
// byte-voor-byte worden doorgegeven, en beide diensten hebben een klein, vast
// schema. Dit is toegesneden op dat gebruik, niet op willekeurige XML.

/** Ontsnapt tekst voor gebruik in een XML-element of -attribuut. */
export function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&apos;")
}

/**
 * Inhoud van het eerste element met deze lokale naam, ongeacht het
 * namespace-voorvoegsel. Een zelfsluitend element (`<X/>`, `<X i:nil="true"/>`)
 * levert bewust een lege string: er ís geen inhoud.
 */
export function tag(xml: string, local: string): string {
  const m = xml.match(new RegExp(`<(?:[\\w.-]+:)?${local}\\b[^>]*>([\\s\\S]*?)</(?:[\\w.-]+:)?${local}>`))
  return m ? m[1].trim() : ""
}

/** Alle blokken met deze lokale naam, inclusief de omhullende tags. */
export function blocks(xml: string, local: string): string[] {
  const re = new RegExp(`<(?:[\\w.-]+:)?${local}\\b[^>]*>[\\s\\S]*?</(?:[\\w.-]+:)?${local}>`, "g")
  return xml.match(re) || []
}

/** Namen van de directe kindelementen — om te zien wat we níet herkennen. */
export function childNames(xml: string): string[] {
  return [...new Set([...xml.matchAll(/<(?:[\w.-]+:)?([A-Za-z][\w.-]*)\b/g)].map((m) => m[1]))]
}

/** De leesbare reden uit een SOAP-fault (1.1 of 1.2). */
export function faultReason(xml: string): string {
  const reason = tag(tag(xml, "Reason"), "Text") || tag(xml, "faultstring")
  const code = tag(tag(xml, "Subcode"), "Value") || tag(tag(xml, "Code"), "Value") || tag(xml, "faultcode")
  // WSE zet de .NET-stacktrace in dezelfde string; alleen de eerste regel is nuttig.
  const kort = reason.split("\n")[0].trim()
  return [kort, code && `code: ${code}`].filter(Boolean).join(" | ")
}
