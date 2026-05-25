import { oidcUserManager } from '@/features/auth/oidcUserManager'

export type SessionContinuityEventName =
  | 'silent-renewal-success'
  | 'silent-renewal-fail'
  | 'forced-redirect'
  | 'idle-warning-shown'
  | 'idle-warning-accepted'
  | 'idle-warning-dismissed'
  | 'auth-classifier-fallback'
  | 'auth-classifier-conflict'
  | 'form-snapshot-skipped'

export interface SessionContinuityEvent {
  event_name: SessionContinuityEventName
  event_version: 1
  timestamp: string
  user_id: string
  session_id: string
  payload?: Record<string, unknown>
}

export interface SessionContinuityIdentity {
  access_token?: string
  expired?: boolean
  profile?: {
    sub?: string
    sid?: string
    session_id?: string
    [key: string]: unknown
  }
}

const TELEMETRY_ENDPOINT = '/internal/telemetry/session-continuity'
const MAX_BUFFERED_EVENTS = 50
const MAX_BATCH_SIZE = 10
const MAX_SEND_ATTEMPTS = 4

let bufferedEvents: SessionContinuityEvent[] = []
let flushPromise: Promise<void> | null = null

export function buildSessionContinuityEvent(
  user: SessionContinuityIdentity | null | undefined,
  eventName: SessionContinuityEventName,
  payload?: Record<string, unknown>,
): SessionContinuityEvent | null {
  const userId = readStringClaim(user, 'nebula_user_id') ?? user?.profile?.sub
  const sessionId =
    user?.profile?.sid ??
    user?.profile?.session_id ??
    readStringClaim(user, 'session_id')

  if (!userId || !sessionId) {
    return null
  }

  return {
    event_name: eventName,
    event_version: 1,
    timestamp: new Date().toISOString(),
    user_id: userId,
    session_id: sessionId,
    payload,
  }
}

export function emitSessionContinuityEvent(
  event: SessionContinuityEvent,
): void {
  bufferedEvents = [...bufferedEvents, event].slice(-MAX_BUFFERED_EVENTS)
  void flushSessionContinuityEvents().catch(() => undefined)
}

export async function flushSessionContinuityEvents(): Promise<void> {
  if (flushPromise) {
    return flushPromise
  }

  flushPromise = flushBufferedEvents().finally(() => {
    flushPromise = null
  })

  return flushPromise
}

export function resetSessionTelemetryForTests(): void {
  bufferedEvents = []
  flushPromise = null
}

async function flushBufferedEvents(): Promise<void> {
  while (bufferedEvents.length > 0) {
    const batch = bufferedEvents.slice(0, MAX_BATCH_SIZE)
    await postTelemetryBatch(batch)
    bufferedEvents = bufferedEvents.slice(batch.length)
  }
}

async function postTelemetryBatch(
  events: SessionContinuityEvent[],
): Promise<void> {
  let lastError: unknown

  for (let attempt = 0; attempt < MAX_SEND_ATTEMPTS; attempt += 1) {
    try {
      const user = await oidcUserManager.getUser()
      if (!user?.access_token || user.expired) {
        return
      }

      const response = await fetch(TELEMETRY_ENDPOINT, {
        method: 'POST',
        credentials: 'include',
        headers: {
          Authorization: `Bearer ${user.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ events }),
      })

      if (response.ok || response.status === 202) {
        return
      }

      lastError = new Error(`Telemetry endpoint returned ${response.status}`)
    } catch (error) {
      lastError = error
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error('Telemetry endpoint failed')
}

function readStringClaim(
  user: SessionContinuityIdentity | null | undefined,
  key: string,
): string | null {
  const value = user?.profile?.[key]
  return typeof value === 'string' && value.trim().length > 0
    ? value
    : null
}
