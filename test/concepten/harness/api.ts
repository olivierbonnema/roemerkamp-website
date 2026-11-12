// Sends a request for /api/... to the real route handler, the way the
// framework would. Used by the tests that drive the browser side
// (lib/concept-sync.ts and the form) against the real server code.
import { GET as listConcepts } from "../../../app/api/concepten/route"
import { GET as getConcept, PUT as putConcept, DELETE as removeConcept } from "../../../app/api/concepten/[draftId]/route"
import { POST as conceptSession } from "../../../app/api/concepten/[draftId]/upload-session/route"
import { POST as confirmDoc, DELETE as removeDoc } from "../../../app/api/concepten/[draftId]/documents/route"
import { GET as adminList } from "../../../app/api/admin/concepten/route"
import { POST as submit } from "../../../app/api/submit-aanvraag/route"
import { GET as listAanvragen } from "../../../app/api/aanvragen/route"
import { POST as aanvraagSession } from "../../../app/api/aanvragen/[id]/upload-session/route"
import { POST as uploadComplete } from "../../../app/api/aanvragen/[id]/upload-complete/route"

export const ORIGIN = "https://nonbancaireleningen.nl"

// What was asked, for the tests to count. { "PUT /api/concepten/x": 2 } makes
// the next two such calls answer 500 without reaching the handler.
export const apiCalls: string[] = []
export const apiFailures: Record<string, number> = {}

type Handler = (req: never, ctx: never) => Promise<Response>
const ROUTES: [string, RegExp, Handler, string?][] = [
  ["GET", /^\/api\/concepten$/, listConcepts as Handler],
  ["GET", /^\/api\/concepten\/([^/]+)$/, getConcept as Handler, "draftId"],
  ["PUT", /^\/api\/concepten\/([^/]+)$/, putConcept as Handler, "draftId"],
  ["DELETE", /^\/api\/concepten\/([^/]+)$/, removeConcept as Handler, "draftId"],
  ["POST", /^\/api\/concepten\/([^/]+)\/upload-session$/, conceptSession as Handler, "draftId"],
  ["POST", /^\/api\/concepten\/([^/]+)\/documents$/, confirmDoc as Handler, "draftId"],
  ["DELETE", /^\/api\/concepten\/([^/]+)\/documents$/, removeDoc as Handler, "draftId"],
  ["GET", /^\/api\/admin\/concepten$/, adminList as Handler],
  ["POST", /^\/api\/submit-aanvraag$/, submit as Handler],
  ["GET", /^\/api\/aanvragen$/, listAanvragen as Handler],
  ["POST", /^\/api\/aanvragen\/([^/]+)\/upload-session$/, aanvraagSession as Handler, "id"],
  ["POST", /^\/api\/aanvragen\/([^/]+)\/upload-complete$/, uploadComplete as Handler, "id"],
]

export async function callApi(method: string, pathAndQuery: string, headers: Record<string, string> = {}, body?: BodyInit | null): Promise<Response> {
  const verb = method.toUpperCase()
  const path = pathAndQuery.split("?")[0]
  apiCalls.push(`${verb} ${path}`)
  for (const key of [`${verb} ${path}`, `${verb} *`, "*"]) {
    if (apiFailures[key]) { apiFailures[key]--; return new Response(JSON.stringify({ error: "simulated outage" }), { status: 500 }) }
  }
  for (const [m, pattern, handler, param] of ROUTES) {
    const match = m === verb ? pattern.exec(path) : null
    if (!match) continue
    const req = new Request(`${ORIGIN}${pathAndQuery}`, {
      method: verb,
      headers: { origin: ORIGIN, ...headers },
      body: verb === "GET" || verb === "HEAD" ? undefined : body ?? undefined,
    })
    return handler(req as never, { params: Promise.resolve(param ? { [param]: decodeURIComponent(match[1]) } : {}) } as never)
  }
  return new Response(JSON.stringify({ error: `no route for ${verb} ${path}` }), { status: 404 })
}
