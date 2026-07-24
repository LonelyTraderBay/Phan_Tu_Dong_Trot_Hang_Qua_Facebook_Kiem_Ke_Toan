# PDPA org delete/anonymize request

Use this runbook when an org owner submits `POST /v1/orgs/me/delete-request`.

## Triage

1. Verify the requester is an `owner` membership for the org.
2. Locate the audit log entry:
   - `action = organization.delete_requested`
   - `entity_type = organization`
   - `entity_id = <org_id>`
   - `meta_json.status = pending`
3. Confirm there are no active billing, dispute, fraud, or legal holds.
4. Send the owner a confirmation note with the target completion date.

## Execution

1. Create a tracked ops ticket with the audit log id and org id.
2. Export the latest org bundle via `POST /v1/orgs/me/export` if a final copy is required.
3. Suspend the org to stop new processing while deletion/anonymization is in progress.
4. Delete or anonymize org-scoped personal data:
   - `messages.payload_json`, `messages.body_text`, provider message ids
   - `contacts.display_name`, `contacts.phone_e164`, scoped social ids
   - order customer name, phone, address fields
   - channel tokens and provider metadata
5. Preserve audit records needed for compliance, but remove personal data from `meta_json` when not legally required.
6. Record a follow-up audit entry with `action = organization.delete_completed` and the ops ticket id.

## Closure

1. Notify the requester that the request is complete.
2. Store the completion timestamp and operator id in the ops ticket.
3. If execution cannot proceed, record `organization.delete_rejected` with the hold reason and notify the requester.
