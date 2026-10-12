# Current issuer bank details

The current bank profile is a complete issuer INN, settlement account, BIK,
correspondent account and bank name. A three-digit prefix is never expanded
into a full account number.

`20261012010000_crm_current_bank_requisites.sql` adds the policy and its audit
requests. The migration itself activates no bank profile. Deploy it before
the new MCP and email functions, then pin the user-confirmed profile using
`crm_pin_company_bank_requisites` with a stable request UUID. The first pin
has `expectedRevision: null`; later changes use the current revision from
`crm_get_company_bank_policy`. Known obsolete full account numbers belong in
`profile.retired_accounts`. Settings and the complete policy change atomically.

The previous configured account is automatically retired. Ordinary settings
edits cannot overwrite the pinned account, bank, BIK, correspondent account
or issuer INN. The Requisites page provides a separate bank-profile action.

New documents use current settings and check the pinned profile. An API revision
preserves the original legal parties and terms, refreshes only the same issuer's
bank fields, and records `companyBankPolicyRevision`. The old revision remains
unchanged. To refresh bank details alone, revise with the document's existing
date. A successful request replay returns its original result rather than
rerendering historical text after a bank change.

Database triggers check future document saves, email preparation and the atomic
send claim against the frozen HTML and original document revision. An old
prepared email cannot bypass a later bank change. A blocked email requires
an updated document revision and a new reviewed email draft. Previously sent
messages and archived documents are not rewritten.

Legacy email checks actual PDF/DOCX text and links before SMTP. PDF limits are
40 pages and a total parsing deadline of 10 seconds. Scans with unreadable
pages, encrypted/corrupt documents, `.doc` and other opaque attachments stop
with `CRM_PAYMENT_REQUISITES_UNVERIFIED`; convert them to a readable PDF/DOCX.
The text check is not OCR and does not claim to inspect pixels embedded within
an otherwise readable page. Resend uses the latest saved HTML instead of an
older uploaded PDF; it does not overwrite an archived or signed original.

Other issuers retain their own banking details. The owner's INN occurring only
as the customer of a different issuer does not make that issuer use this profile.

Release gates are separate: Git, database migration, Edge functions, frontend
hosting, confirmed profile pin, real-domain card/download checks and an
authenticated invoice preview. Local tests alone do not activate the policy.

Validation: `npm run test:crm`, `npm run test:crm:sql`, TypeScript/Vite build,
and `deno test supabase/tests/crm_email_payment_check.test.ts`.
