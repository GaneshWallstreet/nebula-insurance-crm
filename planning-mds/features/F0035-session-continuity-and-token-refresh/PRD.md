---
template: feature
version: 1.0
applies_to: product-manager
---

# F0035: Session Continuity & Token Refresh

**Feature ID:** F0035
**Feature Name:** Session Continuity & Token Refresh
**Priority:** High
**Phase:** Release Enablement / Platform Operations
**Status:** Planned

## Feature Statement

**As an** authenticated Nebula user
**I want** my active work session to remain valid while I am using the application
**So that** I am not unexpectedly sent to the login page during normal CRM workflows

## Business Objective

- **Goal:** Remove disruptive mid-workflow login redirects caused by normal access-token expiration.
- **Metric:** Number of user-visible forced login redirects during active usage.
- **Baseline:** Current OIDC access tokens can expire during active usage, and the next protected API call redirects the user to login.
- **Target:** Active users can continue working through normal token expiration without losing page context or being forced through login unless the identity-provider session is no longer valid.

## Problem Statement

- **Current State:** The application can suddenly navigate to `/login?reason=session_expired` while the user is working. Clicking Sign In often returns the user to the application because the upstream identity-provider session is still valid, which makes the interruption feel unnecessary.
- **Desired State:** Nebula distinguishes recoverable token expiration from true session expiration, renews the session when possible, and only sends the user to login when re-authentication is actually required.
- **Impact:** Unexpected login redirects interrupt underwriting, policy, renewal, document, and account workflows; they reduce trust in the application even when no data is lost.

## Scope & Boundaries

**In Scope:**
- Transparent session continuation during active application usage.
- Preserving the user's current route and workflow context when re-authentication is required.
- Clear session-expired messaging only when the user really must sign in again.
- Consistent handling of protected API calls that encounter expired or missing access tokens.
- Validation that high-API-count pages such as Policy 360, document panels, dashboard modules, and dynamic attribute panels do not amplify token-expiry interruptions.

**Out of Scope:**
- Replacing authentik as the identity provider.
- Changing role, broker-scope, or resource authorization rules.
- Building cross-application single logout.
- Adding broad user-account administration.
- Weakening token lifetime, audience, or issuer validation to hide the symptom.

## Personas & Jobs

| Persona | Job To Be Done | Why It Matters |
|---------|----------------|----------------|
| Distribution User | When I am reviewing submissions and broker activity, I want the app to keep my session alive while I work, so I can finish follow-up without restarting context. | Submission and broker workflows often involve repeated reads and edits across several pages. |
| Underwriter | When I am reviewing policy or renewal detail, I want background data refreshes to handle token expiry without redirecting me, so I can keep my underwriting train of thought. | Detail pages now aggregate multiple protected data panels. |
| Admin | When session behavior changes, I want security boundaries preserved and observable, so operational reliability does not come at the expense of access control. | Session continuity must preserve authentication and audit expectations. |

## Success Criteria

- Active users are not redirected to login solely because a short-lived access token expires.
- If re-authentication is required, the user returns to the same route they were using before login.
- API 401 handling distinguishes recoverable token expiration from unrecoverable authentication failure.
- Session continuity behavior is covered by focused frontend tests and at least one end-to-end or smoke validation path.
- Security-sensitive cases still fail closed: invalid audience, invalid issuer, revoked upstream session, and unauthorized resource access do not become silent success cases.

## Product Requirements

1. **Recoverable Expiration**
   - Given an authenticated user is actively using Nebula
   - When the access token expires but the identity-provider session is still valid
   - Then Nebula should renew the usable session without navigating the user away from the current page.

2. **True Session Expiration**
   - Given an authenticated user's identity-provider session is no longer valid
   - When Nebula can no longer obtain valid authentication
   - Then Nebula should redirect to login with a clear session-expired reason.

3. **Return To Current Work**
   - Given a user is redirected to login because re-authentication is required
   - When sign-in succeeds
   - Then the user should return to the route that initiated re-authentication, not only a role-based default landing page.

4. **No Authorization Masking**
   - Given a user lacks access to a resource
   - When the API returns authorization failure
   - Then Nebula should not treat that as session renewal or login recovery.

5. **Workflow Stability**
   - Given a page issues multiple protected API requests
   - When token expiration occurs during those requests
   - Then the user should see at most one coherent session-continuity outcome, not a cascade of competing redirects or stale UI states.

## UX Notes

- No new primary screen is expected.
- Existing login/session-expired messaging may need refinement.
- Existing protected pages should preserve route context through any required login cycle.
- Any visible session prompt must be concise and avoid blaming the user.

## Dependencies

- F0009 Authentication + Role-Based Login
- F0005 IdP Migration
- F0018 Policy Lifecycle & Policy 360
- F0020 Document Management & ACORD Intake
- F0034 Product Schema Registry and Dynamic LOB Attributes

## Risks & Assumptions

- **Risk:** Session renewal could accidentally retry requests too aggressively and create duplicate mutations.
  - **Mitigation:** Planning must separate idempotent reads from user-initiated writes and define retry boundaries.
- **Risk:** A UX-only fix could hide real authentication failures.
  - **Mitigation:** Security cases must remain explicit acceptance criteria.
- **Assumption:** authentik remains the identity provider for this feature.
- **Assumption:** The current mid-workflow login behavior is most visible after recent feature growth because more pages now make multiple protected API calls.

## Open Questions

- Should inactive sessions expire without warning, or should there be an idle warning before redirect?
- What route/context should be restored after login when the original action was a mutation rather than a read?
- Should session-continuity telemetry be part of the MVP slice or a follow-up?
- What is the accepted active-session duration from a product/security standpoint?

## Related User Stories

To be defined during refinement.
