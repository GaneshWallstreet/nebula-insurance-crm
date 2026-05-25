export type AuthProblemClass =
  | 'auth_token_expired'
  | 'auth_token_invalid'
  | 'auth_session_revoked'
  | 'authz_forbidden'
  | 'auth_unknown'

export interface ProblemDetails {
  type?: string
  title?: string
  status?: number
  detail?: string
  code?: string
  traceId?: string
  errors?: Record<string, string[]>
  lobErrors?: Array<{
    code: string
    path: string
    message: string
    severity: string
  }>
  [key: string]: unknown
}

export interface AuthClassification {
  kind: AuthProblemClass
  source: 'problem_details' | 'www_authenticate' | 'status' | 'fallback'
  conflict: boolean
  endpointRoute: string
  wwwAuthenticateClass?: AuthProblemClass
}

const PROBLEM_TYPE_MAP: Record<string, AuthProblemClass> = {
  'https://nebula.local/problems/auth/token-expired': 'auth_token_expired',
  'https://nebula.local/problems/auth/invalid-token': 'auth_token_invalid',
  'https://nebula.local/problems/auth/session-revoked': 'auth_session_revoked',
  'https://nebula.local/problems/authz/forbidden': 'authz_forbidden',
}

const PROBLEM_CODE_MAP: Record<string, AuthProblemClass> = {
  token_expired: 'auth_token_expired',
  invalid_token: 'auth_token_invalid',
  session_revoked: 'auth_session_revoked',
  forbidden: 'authz_forbidden',
}

export function classifyAuthResponse(
  response: Response,
  problem: ProblemDetails | null,
  endpointRoute: string,
): AuthClassification {
  const problemClass = classifyProblemDetails(problem)
  const wwwAuthenticateClass = classifyWwwAuthenticate(
    response.headers.get('WWW-Authenticate'),
  )

  if (problemClass) {
    return {
      kind: problemClass,
      source: 'problem_details',
      conflict:
        Boolean(wwwAuthenticateClass) &&
        wwwAuthenticateClass !== problemClass,
      endpointRoute,
      wwwAuthenticateClass: wwwAuthenticateClass ?? undefined,
    }
  }

  if (wwwAuthenticateClass) {
    return {
      kind: wwwAuthenticateClass,
      source: 'www_authenticate',
      conflict: false,
      endpointRoute,
      wwwAuthenticateClass: wwwAuthenticateClass ?? undefined,
    }
  }

  if (response.status === 403) {
    return {
      kind: 'authz_forbidden',
      source: 'status',
      conflict: false,
      endpointRoute,
    }
  }

  if (response.status === 401) {
    return {
      kind: 'auth_unknown',
      source: 'status',
      conflict: false,
      endpointRoute,
    }
  }

  return {
    kind: 'auth_unknown',
    source: 'fallback',
    conflict: false,
    endpointRoute,
  }
}

function classifyProblemDetails(
  problem: ProblemDetails | null,
): AuthProblemClass | null {
  const type = normalize(problem?.type)
  if (type && PROBLEM_TYPE_MAP[type]) {
    return PROBLEM_TYPE_MAP[type]
  }

  const code = normalize(problem?.code)
  if (code && PROBLEM_CODE_MAP[code]) {
    return PROBLEM_CODE_MAP[code]
  }

  return null
}

function classifyWwwAuthenticate(
  header: string | null,
): AuthProblemClass | null {
  if (!header) {
    return null
  }

  const value = header.toLowerCase()
  if (value.includes('session-revoked') || value.includes('session_revoked')) {
    return 'auth_session_revoked'
  }

  if (value.includes('token-expired') || value.includes('token_expired')) {
    return 'auth_token_expired'
  }

  if (value.includes('expired') && value.includes('invalid_token')) {
    return 'auth_token_expired'
  }

  if (value.includes('invalid-token') || value.includes('invalid_token')) {
    return 'auth_token_invalid'
  }

  return null
}

function normalize(value: unknown): string | null {
  return typeof value === 'string' ? value.trim().toLowerCase() : null
}
