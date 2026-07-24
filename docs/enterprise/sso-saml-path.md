# Enterprise SSO/SAML Path

**Status:** AMBER - path documented; real SSO is not implemented  
**Current product behavior:** local/Supabase auth only  
**Public status API:** `GET /v1/auth/sso/status`

## Current placeholder

Enterprise buyers can check SSO availability through:

```http
GET /v1/auth/sso/status
```

Current response:

```json
{
  "available": false,
  "etaDays": 90
}
```

This is an honest commitment placeholder, not an SSO launch.

## Target scope

1. Add org-level SSO settings:
   - `sso_enabled`
   - IdP entity ID / issuer
   - SSO URL
   - certificate fingerprint or JWKS reference
   - domain allow-list
   - break-glass owner login flag
2. Support one enterprise IdP first, preferably SAML 2.0 or OIDC based on the signed customer requirement.
3. Route login by email domain or explicit org slug.
4. Map IdP subject/email to existing memberships.
5. Preserve tenant isolation through existing `X-Org-Id`, membership, and permission guards.
6. Log SSO admin changes and login failures.

## Implementation checkpoints

- [ ] Data model/migration for org SSO settings.
- [ ] Admin API to configure and disable SSO.
- [ ] Metadata/certificate validation.
- [ ] Assertion/callback handler with replay protection.
- [ ] Just-in-time membership policy decided and tested.
- [ ] Unit/integration tests for disabled, invalid assertion, valid assertion, and break-glass login.
- [ ] Runbook for IdP certificate rotation.
- [ ] Customer onboarding checklist.

## Rollout guardrails

- Default `available: false` until real integration passes tests.
- Do not enable SSO for an org without break-glass owner access.
- Do not store private keys in browser-accessible config.
- Do not claim SSO as available before an enterprise IdP smoke test succeeds.

## Evidence needed to turn GREEN

- Signed implementation scope or customer acceptance of the 90-day SSO commitment.
- Working staging IdP flow.
- Production rollout checklist.
- Tests and security review for assertion validation and tenant mapping.
