// A small in-memory stand-in for the Firestore Admin SDK, just enough for the
// route tests in this folder: collections, documents, where("==" | "in"),
// add/get/set/update/delete and runTransaction. Dates come back as Timestamp
// look-alikes (with toDate()), as the real SDK returns them.
/* eslint-disable @typescript-eslint/no-explicit-any */

type Data = Record<string, any>

class FakeTimestamp {
  constructor(private readonly date: Date) {}
  toDate() { return new Date(this.date.getTime()) }
}

function toStored(value: any): any {
  if (value instanceof Date) return new Date(value.getTime())
  if (Array.isArray(value)) return value.map(toStored)
  if (value && typeof value === "object") return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, toStored(v)]))
  return value
}

function toRead(value: any): any {
  if (value instanceof Date) return new FakeTimestamp(value)
  if (Array.isArray(value)) return value.map(toRead)
  if (value && typeof value === "object") return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, toRead(v)]))
  return value
}

export class FakeSnap {
  constructor(readonly ref: FakeDocRef, private readonly stored: Data | undefined) {}
  get exists() { return this.stored !== undefined }
  get id() { return this.ref.id }
  data(): Data | undefined { return this.stored === undefined ? undefined : toRead(this.stored) }
}

export class FakeDocRef {
  constructor(private readonly db: FakeDb, readonly collectionPath: string, readonly id: string) {}
  get path() { return `${this.collectionPath}/${this.id}` }
  private bucket() {
    let b = this.db.store.get(this.collectionPath)
    if (!b) { b = new Map(); this.db.store.set(this.collectionPath, b) }
    return b
  }
  async get() {
    this.db.failIfAsked("get", this.collectionPath)
    return new FakeSnap(this, this.bucket().get(this.id))
  }
  async set(data: Data) {
    this.db.failIfAsked("set", this.collectionPath)
    this.bucket().set(this.id, toStored(data))
    this.db.writes.push({ op: "set", path: this.path, data: toStored(data) })
  }
  async update(data: Data) {
    this.db.failIfAsked("update", this.collectionPath)
    const current = this.bucket().get(this.id)
    if (current === undefined) throw new Error(`NOT_FOUND: ${this.path}`)
    this.bucket().set(this.id, { ...current, ...toStored(data) })
    this.db.writes.push({ op: "update", path: this.path, data: toStored(data) })
  }
  async delete() {
    this.bucket().delete(this.id)
    this.db.writes.push({ op: "delete", path: this.path })
  }
  collection(name: string) { return new FakeCollection(this.db, `${this.path}/${name}`) }
}

class FakeCollection {
  constructor(private readonly db: FakeDb, private readonly path: string, private readonly filters: { field: string; op: string; value: any }[] = []) {}
  doc(id?: string) { return new FakeDocRef(this.db, this.path, id ?? `auto${++this.db.autoId}`) }
  async add(data: Data) {
    this.db.failIfAsked("add", this.path)
    const ref = this.doc()
    await ref.set(data)
    return ref
  }
  where(field: string, op: string, value: any) { return new FakeCollection(this.db, this.path, [...this.filters, { field, op, value }]) }
  async get() {
    this.db.failIfAsked("query", this.path)
    const bucket = this.db.store.get(this.path) ?? new Map<string, Data>()
    const docs = [...bucket.entries()]
      .filter(([, data]) => this.filters.every((f) => (f.op === "in" ? (f.value as any[]).includes(data[f.field]) : data[f.field] === f.value)))
      .map(([id, data]) => new FakeSnap(new FakeDocRef(this.db, this.path, id), data))
    return { docs, size: docs.length, empty: docs.length === 0 }
  }
}

class FakeTx {
  async get(ref: FakeDocRef) { return ref.get() }
  set(ref: FakeDocRef, data: Data) { void ref.set(data) }
  update(ref: FakeDocRef, data: Data) {
    // Like the real thing: updating a missing document fails the transaction.
    this.pending.push(ref.update(data))
  }
  pending: Promise<void>[] = []
}

export class FakeDb {
  store = new Map<string, Map<string, Data>>()
  writes: { op: string; path: string; data?: Data }[] = []
  autoId = 0
  // { "get:aanvraagConcepten": 1 } makes the next such call throw.
  failures: Record<string, number> = {}
  failIfAsked(op: string, collectionPath: string) {
    const key = `${op}:${collectionPath}`
    if (this.failures[key]) { this.failures[key]--; throw new Error(`simulated Firestore failure (${key})`) }
  }
  collection(path: string) { return new FakeCollection(this, path) }
  async runTransaction<T>(fn: (tx: FakeTx) => Promise<T>): Promise<T> {
    const tx = new FakeTx()
    const result = await fn(tx)
    await Promise.all(tx.pending)
    return result
  }
  // helpers for the tests
  read(collectionPath: string, id: string): Data | undefined { return this.store.get(collectionPath)?.get(id) }
  all(collectionPath: string): [string, Data][] { return [...(this.store.get(collectionPath) ?? new Map()).entries()] }
  reset() { this.store.clear(); this.writes = []; this.autoId = 0; this.failures = {} }
}

export const fakeDb = new FakeDb()
