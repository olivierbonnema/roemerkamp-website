// Stand-in for "firebase-admin/firestore" in the route tests: the two
// FieldValue helpers the routes use.
import { FieldDelete } from "../fake-firestore"

export const FieldValue = {
  delete: () => new FieldDelete(),
  serverTimestamp: () => new Date(),
}
