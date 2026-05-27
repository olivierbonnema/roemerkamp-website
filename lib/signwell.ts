const SIGNWELL_API = "https://www.signwell.com/api/v1"

function apiKey() {
  const key = process.env.SIGNWELL_API_KEY
  if (!key) throw new Error("SIGNWELL_API_KEY not configured")
  return key
}

function headers() {
  return {
    "X-Api-Key": apiKey(),
    "Content-Type": "application/json",
  }
}

export interface SignWellRecipient {
  id: number
  name: string
  email: string
}

export interface CreateDocumentParams {
  name: string
  fileBase64: string
  fileName: string
  recipients: SignWellRecipient[]
  testMode?: boolean
  subject?: string
  message?: string
}

export async function createSigningRequest(params: CreateDocumentParams) {
  const res = await fetch(`${SIGNWELL_API}/documents`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({
      test_mode: params.testMode ?? false,
      draft: false,
      with_signature_page: false,
      text_tags: true,
      name: params.name,
      subject: params.subject || `Ter ondertekening: ${params.name}`,
      message: params.message || "Hierbij ontvangt u een document ter ondertekening. Klik op de knop hieronder om het document te bekijken en te ondertekenen.",
      files: [
        {
          name: params.fileName,
          file_base64: params.fileBase64,
        },
      ],
      recipients: params.recipients.map((r) => ({
        id: r.id,
        name: r.name,
        email: r.email,
      })),
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`SignWell API error (${res.status}): ${err}`)
  }

  return await res.json()
}

export async function getDocument(documentId: string) {
  const res = await fetch(`${SIGNWELL_API}/documents/${documentId}`, {
    headers: headers(),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`SignWell API error (${res.status}): ${err}`)
  }

  return await res.json()
}

export async function getCompletedPdf(documentId: string): Promise<Buffer> {
  const res = await fetch(`${SIGNWELL_API}/documents/${documentId}/completed_pdf`, {
    headers: { "X-Api-Key": apiKey() },
  })

  if (!res.ok) {
    throw new Error(`SignWell download failed (${res.status})`)
  }

  const arrayBuffer = await res.arrayBuffer()
  return Buffer.from(arrayBuffer)
}
