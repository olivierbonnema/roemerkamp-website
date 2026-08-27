// Client-side direct-to-OneDrive upload. The browser asks our API for a Graph
// upload session (auth + validation server-side), then PUTs the file to
// Microsoft in chunks — the bytes never pass through Vercel, so the ±4.5MB
// request cap does not apply. Chunk size must be a multiple of 320 KiB per the
// Graph spec; 16 × 320 KiB = 5 MiB.

const CHUNK_SIZE = 16 * 320 * 1024

export interface DirectUploadResult {
  ok: boolean
  // The name as the user selected it (used to reconcile local UI state)…
  originalName: string
  // …and as the server sanitized/stored it (used for berichten/bookkeeping).
  fileName: string
  error?: string
}

export async function uploadFileDirect(
  aanvraagId: string,
  idToken: string,
  file: File,
  onProgress?: (uploadedBytes: number, totalBytes: number) => void
): Promise<DirectUploadResult> {
  // 1. Ask our server for a pre-authenticated, single-file upload session.
  // Wrapped in try/catch: a network failure here must yield a per-file failure
  // result, NOT an exception — the caller may already have submitted the
  // aanvraag, and an exception would read as "submission failed, try again",
  // inviting a duplicate submission.
  let uploadUrl: string
  let fileName: string
  try {
    const sessionRes = await fetch(`/api/aanvragen/${aanvraagId}/upload-session`, {
      method: "POST",
      headers: { Authorization: `Bearer ${idToken}`, "Content-Type": "application/json" },
      body: JSON.stringify({ fileName: file.name, fileSize: file.size }),
    })
    if (!sessionRes.ok) {
      const data = await sessionRes.json().catch(() => ({}))
      return { ok: false, originalName: file.name, fileName: file.name, error: data.error || "Upload voorbereiden mislukt." }
    }
    const session = await sessionRes.json()
    uploadUrl = session.uploadUrl
    fileName = session.fileName || file.name
  } catch {
    return { ok: false, originalName: file.name, fileName: file.name, error: "Upload voorbereiden mislukt. Controleer uw verbinding." }
  }

  // 2. PUT the chunks straight to Microsoft. Each failed chunk gets one retry.
  let offset = 0
  while (offset < file.size) {
    const end = Math.min(offset + CHUNK_SIZE, file.size)
    const chunk = file.slice(offset, end)
    let res: Response | null = null
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        res = await fetch(uploadUrl, {
          method: "PUT",
          headers: {
            "Content-Range": `bytes ${offset}-${end - 1}/${file.size}`,
          },
          body: chunk,
        })
        if (res.ok || res.status === 202) break
      } catch {
        res = null
      }
    }
    if (!res || (!res.ok && res.status !== 202)) {
      return { ok: false, originalName: file.name, fileName, error: `Upload van "${file.name}" is mislukt. Controleer uw verbinding en probeer het opnieuw.` }
    }
    offset = end
    onProgress?.(offset, file.size)
  }
  return { ok: true, originalName: file.name, fileName }
}

// Upload a list of files sequentially; reports overall progress across the
// combined byte total. getToken is called per file so a long upload (large
// dossiers can take longer than a Firebase token's ~1h lifetime) keeps working.
export async function uploadFilesDirect(
  aanvraagId: string,
  getToken: () => Promise<string | null | undefined>,
  files: File[],
  onProgress?: (info: { fileIndex: number; fileCount: number; fileName: string; pct: number }) => void
): Promise<DirectUploadResult[]> {
  const totalBytes = files.reduce((s, f) => s + f.size, 0) || 1
  let doneBytes = 0
  const results: DirectUploadResult[] = []
  for (let i = 0; i < files.length; i++) {
    const f = files[i]
    let token: string | null | undefined
    try { token = await getToken() } catch { token = null }
    if (!token) {
      results.push({ ok: false, originalName: f.name, fileName: f.name, error: "Niet ingelogd. Ververs de pagina en probeer het opnieuw." })
      doneBytes += f.size
      continue
    }
    const result = await uploadFileDirect(aanvraagId, token, f, (uploaded) => {
      const pct = Math.round(((doneBytes + uploaded) / totalBytes) * 100)
      onProgress?.({ fileIndex: i + 1, fileCount: files.length, fileName: f.name, pct: Math.min(pct, 100) })
    })
    doneBytes += f.size
    results.push(result)
  }
  return results
}
