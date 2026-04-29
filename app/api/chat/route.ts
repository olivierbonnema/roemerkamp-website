import Anthropic from "@anthropic-ai/sdk"
import { NextRequest, NextResponse } from "next/server"

// ============================================================
// STAP 1 — API KEY
// Voeg toe aan .env.local (nooit in de code zelf):
//   ANTHROPIC_API_KEY=sk-ant-api03-...
// ============================================================

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

// ============================================================
// STAP 2 — BEDRIJFSINFORMATIE
// Vervang de placeholder-tekst hieronder met echte informatie
// over producten, diensten, voorwaarden, contactgegevens, etc.
// Hoe meer context je geeft, hoe beter de assistent antwoord.
// ============================================================
const SYSTEM_PROMPT = `Je bent een behulpzame assistent voor Lange & Partners. Beantwoord uitsluitend vragen op basis van de informatie hieronder. Als een vraag niet door de onderstaande informatie gedekt wordt, zeg dan dat je die informatie niet hebt en verwijs de gebruiker naar info@langefa.nl of (023) 517 31 00. Verzin nooit informatie.

Antwoord altijd in het Nederlands, tenzij de gebruiker in een andere taal schrijft.

--- BEDRIJFSINFORMATIE ---

[PLAK HIER JE BEDRIJFSINFORMATIE]

Voorbeeldonderwerpen om op te nemen:
- Wat doet Lange & Partners?
- Welke producten/diensten worden aangeboden?
- Hoe werkt een financieringsaanvraag?
- Wat zijn de voorwaarden voor een lening?
- Hoe kan een investeerder meedoen?
- Wat zijn de rentetarieven?
- Hoe lang duurt een aanvraag?
- Wat zijn de contactgegevens?

[EINDE BEDRIJFSINFORMATIE]
-------------------------`

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json()

    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: "Ongeldig berichtformaat" }, { status: 400 })
    }

    // Stream de response terug naar de frontend
    const stream = client.messages.stream({
      model: "claude-sonnet-4-6",
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages,
    })

    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            if (
              chunk.type === "content_block_delta" &&
              chunk.delta.type === "text_delta"
            ) {
              controller.enqueue(new TextEncoder().encode(chunk.delta.text))
            }
          }
        } finally {
          controller.close()
        }
      },
    })

    return new Response(readable, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache",
      },
    })
  } catch (err) {
    console.error("Chat API error:", err)
    return NextResponse.json(
      { error: "Er is een fout opgetreden. Probeer het later opnieuw." },
      { status: 500 }
    )
  }
}
