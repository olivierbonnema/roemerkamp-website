// Stand-in for "next/server" in the route tests: the handlers only use
// NextResponse.json, the request's headers/body, and after().
export type NextRequest = Request

export const NextResponse = {
  json(body: unknown, init?: { status?: number }) {
    return new Response(JSON.stringify(body), { status: init?.status ?? 200, headers: { "Content-Type": "application/json" } })
  },
}

// Work a route schedules for after its response. The tests run it by hand.
export const afterQueue: (() => unknown)[] = []
export function after(fn: () => unknown) { afterQueue.push(fn) }
export async function runAfter() {
  while (afterQueue.length) await afterQueue.shift()!()
}
