import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { emitAuthEvent } from '@/features/auth/authEvents'
import { oidcUserManager } from '@/features/auth/oidcUserManager'
import { useSessionTeardown } from '@/features/auth/useSessionTeardown'
import { renewSessionForExpiredToken } from './sessionRenewal'
import {
  buildSessionContinuityEvent,
  emitSessionContinuityEvent,
  type SessionContinuityEventName,
} from './sessionTelemetry'

export const IDLE_THRESHOLD_MS = 1_500_000
export const GRACE_PERIOD_MS = 300_000
export const ROLLING_ACTIVITY_WINDOW_MS = 14_400_000
export const ABSOLUTE_SESSION_HARD_CAP_MS = 28_800_000

export interface IdleWarningState {
  modalOpen: boolean
  remainingMs: number
  warningState: boolean
}

export interface IdleWarningController extends IdleWarningState {
  staySignedIn(): Promise<void>
  signOut(): Promise<void>
}

export function useIdleWarning(): IdleWarningController {
  const teardown = useSessionTeardown()
  const now = performance.now()
  const sessionStartedAt = useRef(now)
  const rollingWindowStartedAt = useRef(now)
  const lastActivityAt = useRef(now)
  const graceDeadlineAt = useRef<number | null>(null)
  const forcedRedirectStarted = useRef(false)

  const [modalOpen, setModalOpen] = useState(false)
  const [remainingMs, setRemainingMs] = useState(GRACE_PERIOD_MS)

  const emitIdleTelemetry = useCallback(
    async (
      eventName: SessionContinuityEventName,
      payload: Record<string, unknown>,
    ) => {
      const user = await oidcUserManager.getUser().catch(() => null)
      const event = buildSessionContinuityEvent(user, eventName, payload)
      if (event) {
        emitSessionContinuityEvent(event)
      }
    },
    [],
  )

  const beginForcedReauth = useCallback(
    (cause: 'idle_timeout' | 'rolling_window_exceeded' | 'hard_cap_reached' | 'silent_renewal_failed') => {
      if (forcedRedirectStarted.current || isPublicAuthRoute()) {
        return
      }

      forcedRedirectStarted.current = true
      setModalOpen(false)
      emitAuthEvent('forced_reauth', {
        cause,
        method: 'GET',
        endpointRoute: window.location.pathname,
        returnTo: `${window.location.pathname}${window.location.search}`,
      })
    },
    [],
  )

  const openIdleModal = useCallback(() => {
    if (modalOpen || forcedRedirectStarted.current || isPublicAuthRoute()) {
      return
    }

    graceDeadlineAt.current = performance.now() + GRACE_PERIOD_MS
    setRemainingMs(GRACE_PERIOD_MS)
    setModalOpen(true)
    void emitIdleTelemetry('idle-warning-shown', {
      route_at_warning: window.location.pathname,
    })
  }, [emitIdleTelemetry, modalOpen])

  const resetIdleTimer = useCallback(() => {
    if (modalOpen || isPublicAuthRoute()) {
      return
    }

    lastActivityAt.current = performance.now()
  }, [modalOpen])

  useEffect(() => {
    const events = ['mousedown', 'keydown', 'touchstart', 'input']
    for (const event of events) {
      window.addEventListener(event, resetIdleTimer, { passive: true })
    }

    return () => {
      for (const event of events) {
        window.removeEventListener(event, resetIdleTimer)
      }
    }
  }, [resetIdleTimer])

  useEffect(() => {
    const interval = window.setInterval(() => {
      const current = performance.now()
      if (isPublicAuthRoute()) {
        lastActivityAt.current = current
        return
      }

      const hardCapElapsed = current - sessionStartedAt.current
      const rollingWindowElapsed = current - rollingWindowStartedAt.current

      if (hardCapElapsed >= ABSOLUTE_SESSION_HARD_CAP_MS) {
        beginForcedReauth('hard_cap_reached')
        return
      }

      if (rollingWindowElapsed >= ROLLING_ACTIVITY_WINDOW_MS) {
        beginForcedReauth('rolling_window_exceeded')
        return
      }

      if (modalOpen && graceDeadlineAt.current !== null) {
        const nextRemaining = Math.max(0, graceDeadlineAt.current - current)
        setRemainingMs(nextRemaining)
        if (nextRemaining <= 0) {
          void emitIdleTelemetry('idle-warning-dismissed', {
            dismissal_action: 'grace_period_expired',
          })
          beginForcedReauth('idle_timeout')
        }
        return
      }

      if (current - lastActivityAt.current >= IDLE_THRESHOLD_MS) {
        openIdleModal()
      }
    }, 1_000)

    return () => window.clearInterval(interval)
  }, [beginForcedReauth, emitIdleTelemetry, modalOpen, openIdleModal])

  const staySignedIn = useCallback(async () => {
    try {
      await renewSessionForExpiredToken()
      await emitIdleTelemetry('idle-warning-accepted', {
        time_remaining_ms: Math.round(remainingMs),
      })
      graceDeadlineAt.current = null
      lastActivityAt.current = performance.now()
      rollingWindowStartedAt.current = performance.now()
      setRemainingMs(GRACE_PERIOD_MS)
      setModalOpen(false)
    } catch {
      beginForcedReauth('silent_renewal_failed')
    }
  }, [beginForcedReauth, emitIdleTelemetry, remainingMs])

  const signOut = useCallback(async () => {
    await emitIdleTelemetry('idle-warning-dismissed', {
      dismissal_action: 'user_signed_out',
    })
    graceDeadlineAt.current = null
    setModalOpen(false)
    await teardown('signed_out')
  }, [emitIdleTelemetry, teardown])

  return useMemo(
    () => ({
      modalOpen,
      remainingMs,
      warningState: modalOpen && remainingMs <= 30_000,
      staySignedIn,
      signOut,
    }),
    [modalOpen, remainingMs, signOut, staySignedIn],
  )
}

function isPublicAuthRoute(): boolean {
  const path = window.location.pathname
  return path === '/login' || path === '/auth/callback' || path === '/unauthorized'
}
