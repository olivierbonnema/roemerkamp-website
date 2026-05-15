export function numberToWords(n: number): string {
  if (!n || n === 0) return "nul"
  n = Math.round(n)

  const ones = [
    "", "een", "twee", "drie", "vier", "vijf", "zes", "zeven", "acht", "negen",
    "tien", "elf", "twaalf", "dertien", "veertien", "vijftien", "zestien",
    "zeventien", "achttien", "negentien",
  ]
  const tens = [
    "", "", "twintig", "dertig", "veertig", "vijftig", "zestig", "zeventig",
    "tachtig", "negentig",
  ]

  function twoDigits(n: number): string {
    if (n < 20) return ones[n]
    const t = Math.floor(n / 10)
    const u = n % 10
    if (u === 0) return tens[t]
    const unitWord = ones[u]
    const connector = unitWord.endsWith("e") ? "ën" : "en"
    return unitWord + connector + tens[t]
  }

  function threeDigits(n: number): string {
    if (n < 100) return twoDigits(n)
    const h = Math.floor(n / 100)
    const rest = n % 100
    const prefix = h === 1 ? "" : ones[h]
    return prefix + "honderd" + (rest > 0 ? twoDigits(rest) : "")
  }

  function below1M(n: number): string {
    if (n < 1000) return threeDigits(n)
    const thousands = Math.floor(n / 1000)
    const rest = n % 1000
    const prefix = thousands === 1 ? "" : threeDigits(thousands)
    return prefix + "duizend" + (rest > 0 ? " " + threeDigits(rest) : "")
  }

  if (n >= 1000000) {
    const millions = Math.floor(n / 1000000)
    const rest = n % 1000000
    const mWord =
      millions === 1 ? "een miljoen" : below1M(millions) + " miljoen"
    return mWord + (rest > 0 ? " " + below1M(rest) : "")
  }
  return below1M(n)
}

export function fmtZegge(n: number): string {
  return `(zegge: ${numberToWords(n)} euro)`
}
