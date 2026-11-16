// What Beheer needs to know about the two-factor set-up (2FA) of an account,
// read from its Firebase Auth record.
//
// Used by app/api/admin/list-users (the status in the account lists) and by
// app/api/admin/reset-mfa (clearing it). Nothing here writes anything.
//
// An account has 2FA when it has at least one "second factor" enrolled. Ours
// are always authenticator apps (TOTP), set up on /mfa-setup at the first login.

import type { UserRecord } from "firebase-admin/auth"

export interface MfaStatus {
  /** The account has at least one second factor. */
  mfaEnrolled: boolean
  /** Since when, as an ISO date: the oldest factor. Null when not set up or when the date is not known. */
  mfaEnrolledAt: string | null
}

type WithFactors = Pick<UserRecord, "multiFactor">

/** How many second factors the account has. The record has no `multiFactor` at all when there are none. */
export function factorCount(user: WithFactors): number {
  return user.multiFactor?.enrolledFactors?.length ?? 0
}

/**
 * The 2FA status of one account. Never throws: a date we cannot read gives
 * "set up, date unknown", so a strange record cannot take the account list down.
 */
export function mfaStatus(user: WithFactors): MfaStatus {
  const factors = user.multiFactor?.enrolledFactors ?? []
  if (factors.length === 0) return { mfaEnrolled: false, mfaEnrolledAt: null }
  const times = factors
    .map((f) => {
      const t = f?.enrollmentTime ? new Date(f.enrollmentTime).getTime() : NaN
      return Number.isFinite(t) ? t : null
    })
    .filter((t): t is number => t !== null)
  return { mfaEnrolled: true, mfaEnrolledAt: times.length ? new Date(Math.min(...times)).toISOString() : null }
}
