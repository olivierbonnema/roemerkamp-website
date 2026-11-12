// A small in-memory stand-in for the part of Microsoft Graph the portal uses
// (the shared SharePoint library): the token, folders, upload sessions,
// listings, move/rename and delete. Installed as global fetch by the tests.
/* eslint-disable @typescript-eslint/no-explicit-any */

interface Item { id: string; name: string; parentId: string | null; folder: boolean; size: number }

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } })

export class FakeDrive {
  items = new Map<string, Item>()
  sessions = new Map<string, { folderId: string; name: string }>()
  calls: string[] = []
  // { "PATCH": 1 } makes the next PATCH answer 500.
  failures: Record<string, number> = {}
  // Each piece of an upload takes this long, so a test can act "while it uploads".
  uploadDelayMs = 0
  private seq = 0

  constructor() { this.reset() }

  reset() {
    this.items.clear(); this.sessions.clear(); this.calls = []; this.failures = {}; this.seq = 0; this.uploadDelayMs = 0
    this.items.set("root", { id: "root", name: "", parentId: null, folder: true, size: 0 })
    const oh = this.add("OH leningen", "root", true)
    this.add("Portaal Aanvragen", oh.id, true)
  }

  add(name: string, parentId: string, folder: boolean, size = 0): Item {
    const item = { id: `item${++this.seq}`, name, parentId, folder, size }
    this.items.set(item.id, item)
    return item
  }

  children(parentId: string) { return [...this.items.values()].filter((i) => i.parentId === parentId) }
  child(parentId: string, name: string) { return this.children(parentId).find((i) => i.name.toLowerCase() === name.toLowerCase()) }
  byPath(path: string): Item | undefined {
    let cur: Item | undefined = this.items.get("root")
    for (const part of path.split("/").filter(Boolean)) { cur = cur && this.child(cur.id, part) }
    return cur
  }
  pathOf(item: Item): string {
    const parts: string[] = []
    let cur: Item | undefined = item
    while (cur && cur.parentId) { parts.unshift(cur.name); cur = this.items.get(cur.parentId) }
    return parts.join("/")
  }
  webUrl(item: Item) { return `https://sharepoint.test/${this.pathOf(item).split("/").map(encodeURIComponent).join("/")}` }
  describe(item: Item) {
    return { id: item.id, name: item.name, size: item.size, webUrl: this.webUrl(item), ...(item.folder ? { folder: {} } : { file: { mimeType: "application/pdf" } }) }
  }
  freeName(parentId: string, name: string) {
    if (!this.child(parentId, name)) return name
    const dot = name.lastIndexOf(".")
    const base = dot > 0 ? name.slice(0, dot) : name
    const ext = dot > 0 ? name.slice(dot) : ""
    for (let i = 1; ; i++) { const n = `${base} ${i}${ext}`; if (!this.child(parentId, n)) return n }
  }

  // The names of the folders directly under "Portaal Aanvragen".
  aanvraagFolders() { return this.children(this.byPath("OH leningen/Portaal Aanvragen")!.id).filter((i) => i.folder).map((i) => i.name).sort() }
  filesIn(folderId: string) { return this.children(folderId).filter((i) => !i.folder).map((i) => i.name).sort() }

  fetch = async (input: any, init: any = {}): Promise<Response> => {
    const url = String(typeof input === "string" ? input : input.url)
    const method = String(init.method || "GET").toUpperCase()
    const u = new URL(url)
    this.calls.push(`${method} ${u.host}${decodeURIComponent(u.pathname)}`)
    if (this.failures[method]) { this.failures[method]--; return json({ error: { code: "generalException" } }, 500) }

    if (u.host === "login.microsoftonline.com") return json({ access_token: "ms-token" })

    if (u.host === "upload.test") {
      if (this.uploadDelayMs) await new Promise((resolve) => setTimeout(resolve, this.uploadDelayMs))
      const session = this.sessions.get(u.pathname)
      if (!session) return json({ error: "no session" }, 404)
      const range = /bytes (\d+)-(\d+)\/(\d+)/.exec(String(init.headers?.["Content-Range"] || ""))
      if (!range) return json({ error: "no range" }, 400)
      const end = Number(range[2]), total = Number(range[3])
      if (end + 1 < total) return json({ nextExpectedRanges: [`${end + 1}-`] }, 202)
      const item = this.add(this.freeName(session.folderId, session.name), session.folderId, false, total)
      this.sessions.delete(u.pathname)
      return json(this.describe(item), 201)
    }

    if (u.host !== "graph.microsoft.com") return json({ error: `unexpected host ${u.host}` }, 500)
    const path = decodeURIComponent(u.pathname).replace(/^\/v1\.0\/drives\/[^/]+/, "")
    const body = init.body && typeof init.body === "string" ? JSON.parse(init.body) : {}
    let m: RegExpExecArray | null

    // /root:/{path}:/children  (create a folder under a path)
    if ((m = /^\/root:\/(.+):\/children$/.exec(path)) && method === "POST") {
      const parent = this.byPath(m[1])
      if (!parent) return json({ error: { code: "itemNotFound" } }, 404)
      return this.createFolder(parent.id, body)
    }
    // /root:/{path}  (look an item up by its path)
    if ((m = /^\/root:\/(.+)$/.exec(path)) && method === "GET") {
      const item = this.byPath(m[1])
      return item ? json(this.describe(item)) : json({ error: { code: "itemNotFound" } }, 404)
    }
    // /items/{id}:/{name}:/createUploadSession
    if ((m = /^\/items\/([^/:]+):\/(.+):\/createUploadSession$/.exec(path)) && method === "POST") {
      if (!this.items.get(m[1])?.folder) return json({ error: { code: "itemNotFound" } }, 404)
      const key = `/session/${++this.seq}`
      this.sessions.set(key, { folderId: m[1], name: m[2] })
      return json({ uploadUrl: `https://upload.test${key}` })
    }
    // /items/{id}:/{name}:/content  (small upload through our own server)
    if ((m = /^\/items\/([^/:]+):\/(.+):\/content$/.exec(path)) && method === "PUT") {
      if (!this.items.get(m[1])?.folder) return json({ error: { code: "itemNotFound" } }, 404)
      const existing = this.child(m[1], m[2])
      const size = init.body?.length ?? 1
      if (existing) { existing.size = size; return json(this.describe(existing)) }
      return json(this.describe(this.add(m[2], m[1], false, size)), 201)
    }
    // /items/{id}/children
    if ((m = /^\/items\/([^/:]+)\/children$/.exec(path))) {
      if (!this.items.get(m[1])?.folder) return json({ error: { code: "itemNotFound" } }, 404)
      if (method === "GET") return json({ value: this.children(m[1]).map((i) => this.describe(i)) })
      if (method === "POST") return this.createFolder(m[1], body)
    }
    // /items/{id}
    if ((m = /^\/items\/([^/:]+)$/.exec(path))) {
      const item = this.items.get(m[1])
      if (!item) return json({ error: { code: "itemNotFound" } }, 404)
      if (method === "GET") return json(this.describe(item))
      if (method === "DELETE") { this.items.delete(item.id); return new Response(null, { status: 204 }) }
      if (method === "PATCH") {
        const parentId = body.parentReference?.id ?? item.parentId
        const name = body.name ?? item.name
        const clash = this.child(parentId, name)
        if (clash && clash.id !== item.id) return json({ error: { code: "nameAlreadyExists" } }, 409)
        item.parentId = parentId
        item.name = name
        return json(this.describe(item))
      }
    }
    return json({ error: `fake graph: no handler for ${method} ${path}` }, 500)
  }

  private createFolder(parentId: string, body: any): Response {
    const name = String(body.name || "")
    const behavior = body["@microsoft.graph.conflictBehavior"] || "fail"
    if (this.child(parentId, name) && behavior === "fail") return json({ error: { code: "nameAlreadyExists" } }, 409)
    return json(this.describe(this.add(this.freeName(parentId, name), parentId, true)), 201)
  }
}

export const fakeDrive = new FakeDrive()
