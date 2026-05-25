import { describe, expect, it } from 'vitest'
import { classifyAuthResponse } from '../authErrorClassifier'

function response(status: number, headers?: Record<string, string>): Response {
  return new Response(null, { status, headers })
}

describe('classifyAuthResponse', () => {
  it('uses ProblemDetails as the authoritative token-expired source', () => {
    const result = classifyAuthResponse(
      response(401, { 'WWW-Authenticate': 'Bearer error="invalid_token"' }),
      {
        type: 'https://nebula.local/problems/auth/token-expired',
        code: 'token_expired',
      },
      '/tasks',
    )

    expect(result).toMatchObject({
      kind: 'auth_token_expired',
      source: 'problem_details',
      endpointRoute: '/tasks',
    })
  })

  it('marks conflicts when WWW-Authenticate disagrees with ProblemDetails', () => {
    const result = classifyAuthResponse(
      response(401, {
        'WWW-Authenticate': 'Bearer error="invalid_token", error_description="session-revoked"',
      }),
      {
        type: 'https://nebula.local/problems/auth/token-expired',
      },
      '/tasks',
    )

    expect(result.conflict).toBe(true)
    expect(result.kind).toBe('auth_token_expired')
    expect(result.wwwAuthenticateClass).toBe('auth_session_revoked')
  })

  it('falls back to status-only unknown for malformed 401 responses', () => {
    expect(classifyAuthResponse(response(401), null, '/tasks')).toMatchObject({
      kind: 'auth_unknown',
      source: 'status',
    })
  })

  it('classifies 403 responses as authorization denial when no finer code exists', () => {
    expect(classifyAuthResponse(response(403), null, '/policies')).toMatchObject({
      kind: 'authz_forbidden',
      source: 'status',
    })
  })
})
