import { adminDb } from "@/lib/firebase-admin"
import { FieldValue } from "firebase-admin/firestore"

export type ActivityAction =
  | "document_created"
  | "document_updated"
  | "document_deleted"
  | "document_downloaded"
  | "status_changed"
  | "user_created"
  | "user_deleted"
  | "settings_updated"
  | "blogpost_created"
  | "blogpost_updated"
  | "blogpost_published"
  | "blogpost_deleted"
  | "correction_submitted"
  | "analysis_triggered"
  | "reputation_scan_triggered"
  | "aanvraag_deleted"
  | "message_sent"
  | "document_accessed"
  | "document_esign_sent"
  | "partner_invited"
  | "login"
  | "aanvraag_submitted"
  | "document_uploaded"

export interface LogEntry {
  action: ActivityAction
  userId: string
  userEmail: string
  targetId?: string
  targetType?: "termsheet" | "pitch" | "aanvraag" | "user" | "settings" | "esign"
  details?: Record<string, string | boolean>
}

export async function logActivity(entry: LogEntry) {
  try {
    await adminDb.collection("activity_log").add({
      ...entry,
      createdAt: FieldValue.serverTimestamp(),
    })
  } catch (err) {
    console.error("Failed to log activity:", err)
  }
}
