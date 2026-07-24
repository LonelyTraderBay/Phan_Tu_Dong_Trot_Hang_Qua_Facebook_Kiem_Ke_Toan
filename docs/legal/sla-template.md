# SLA Template - Enterprise Support

**Status:** AMBER - template only; requires legal/commercial approval before customer use.

## 1. Service availability target

Omni Commerce will target 99.5% monthly availability for production web and API services, excluding scheduled maintenance, customer-caused outages, third-party platform outages, force majeure, and beta/preview features.

## 2. Support tiers

| Priority | Example | Initial response target | Update cadence |
|----------|---------|-------------------------|----------------|
| P1 Critical | Production unavailable or data-loss risk | 1 business hour | Every 4 business hours |
| P2 High | Major workflow degraded without workaround | 4 business hours | Daily business day |
| P3 Normal | Minor defect with workaround | 2 business days | As needed |
| P4 Question | How-to or documentation request | 5 business days | As needed |

## 3. Incident communications

- Public status: `/status`.
- Customer-specific updates: agreed support channel or email.
- Post-incident summary: for P1 incidents after resolution when requested by customer.

## 4. Exclusions

- Third-party network, Meta/Zalo/carrier, Supabase, LLM, payment, or hosting provider incidents outside Omni Commerce control.
- Customer configuration errors, expired tokens, deleted channels, or unavailable customer systems.
- Planned maintenance announced in advance.
- Features marked pilot, beta, preview, or non-production.

## 5. Service credits placeholder

Service credits, if any, must be negotiated in the order form or master agreement. This template does not grant credits by itself.

## 6. Approval checklist

- [ ] Legal approved.
- [ ] Commercial owner approved.
- [ ] Support owner approved.
- [ ] Availability measurement source named.
- [ ] Customer contract references final SLA version.
