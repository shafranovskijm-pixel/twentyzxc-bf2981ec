# CRM document persistence

Migration: `supabase/migrations/20260928090000_crm_document_api.sql`.
Integration assertions: `supabase/tests/crm_document_api.sql`.

This migration is prepared locally. Its presence in Git does not mean it has been
applied to Lovable/Supabase. It performs no email or storage operation.

The target is the Lovable-connected `twentyzxc-bf2981ec` repository, audited at
base `f537cbbfcafaa7594057e4eeef4c4d14f32e8237`. The earlier `24zxc` checkout is
not deployment evidence. The connected schema includes `contracts.appendix_ref`,
`service_start`, `service_end`, `service_no_deadline`, `clients.no_deadline`,
`contract_files.metadata` and the September `ensure_contract_client` trigger.
The local SQL runner loads those relevant source migrations, including that real
trigger, before the API migration.

## RPC contract

`crm_suggest_document_number(p_doc_type text, p_doc_date date)` is an admin-only,
read-only candidate lookup. It returns `{number, type, date, reserved:false}` and
does not write a ledger or reserve a number. It follows the editor's global
per-type/year sequence over `generated_documents`, with `contracts` additionally
included for contracts. Trimmed legacy `NNN-YYYY` numbers are accepted; malformed
numbers and other years are ignored. The save RPC still rejects a candidate taken
by another writer; reread and retry that failed operation with a fresh candidate.

`crm_save_document(p_request_id uuid, p_document_id uuid, p_expected_revision integer, p_payload jsonb, p_input jsonb)`

For creation, document ID and expected revision are null. For revision, both are
required. The caller must be authenticated and currently have the `admin` role.
The security-definer RPC uses a fixed search path and schema-qualified relations;
definer privileges are necessary because clients cannot write the audit tables.

`p_payload` contains exactly these fields:

```text
doc_type, doc_number, doc_date, client_id, client_name, client_inn,
contract_id, total_amount, services, html_content, metadata
```

`doc_type` is `contract`, `invoice`, or `act`. Number is explicit. Services and
metadata are native JSON, not JSON-encoded strings. Amount is the final payable
amount; the domain layer computes the discount and supplies the consistent HTML.
SQL additionally rejects negative/excess amounts, non-cent prices, missing client
identity, unexpected fields, and mismatched client name/INN.
Input type, client UUID, date, number, services and contract reference must match
the resolved payload, and `metadata.documentInput` must equal the command. SQL
recomputes per-row half-up totals and invoice amount/percent discounts, and checks
the final amount and metadata discount. Contract and act discounts are not enabled
in this initial API domain.

Return shape:

```json
{"documentId":"uuid","revision":1,"contractId":"uuid-or-null","replayed":false}
```

Creation of a contract atomically creates its CRM row and links the generated
document. Its input `contract_id` must be null. Contract revision synchronizes CRM
date and amount. An invoice can stand alone. An act requires an explicit contract.
The card's `contract_type` uses the existing exact UI labels: `standard` maps to
`Сайт`, `frdo` to `ФРДО`, and `nmo` to `НМО`. Revisions retain that template; a
separate manual card type change triggers `CRM_LINKED_CONTRACT_CHANGED` instead
of silently overwriting it.
Every linked contract is locked and checked for archival and matching client name.
The current contracts schema has no client UUID: duplicate client names make a
linked operation ambiguous and are rejected rather than resolved by guesswork.
Creation uses the current client card; revision preserves the original document's
party snapshot, including when the current CRM card has since been renamed.

The optional contract input `servicePeriod` has `start`/`end` ISO date strings and
a required boolean `noDeadline`. Its explicit values update `service_start`,
`service_end` and `service_no_deadline`. There is no date extraction from free text.
An absent period preserves existing values on revision; new contracts get the
schema's empty period. Payment date `paid_until` and appendix reference are untouched.
Changing textual `deadline` when a period already exists requires an explicit
`servicePeriod`, avoiding stale CRM dates. An end before start, a non-boolean flag
or an end combined with `noDeadline=true` is rejected.

The Contracts tab can change date, amount or period without changing the generated
document revision. While holding the contract row lock, the API compares date and
amount with the previous document, and an explicitly supplied period with the
previous input period. `CRM_LINKED_CONTRACT_CHANGED` (SQLSTATE `40001`) refuses
to overwrite an independent change. Supplying the already-current value is safe.
Unrelated notes, payment fields and appendix references do not cause a conflict;
an omitted period remains untouched.

Revisions cannot change the document type, number, client UUID or contract UUID.
Current revision must have an API input snapshot. Existing legacy documents and
documents subsequently edited through the browser need an explicit future adoption
workflow; the RPC does not infer their editable input from old HTML. Archival is
checked using the actual `contracts.is_archived` field. No signature-status field
exists in this schema, so this migration cannot establish whether a document has
been signed externally. The API is a draft persistence interface, not signature
verification or permission to overwrite a signed document.

## History and retry semantics

`crm_document_revisions` has primary key `(document_id, revision)` and these read
fields: `snapshot`, `input`, `request_id`, `source`, `captured_at`, `captured_by`.
`snapshot` contains the complete generated-document row; resolved client/company
snapshots can be retained inside its metadata. `input` is the unchanged API command
object. API revisions have `source='api'`; browser revisions have `source='legacy'`
and null input. A browser change must not silently inherit obsolete API input.

Triggers capture all future generated-document inserts/updates. The first update
or deletion of a pre-migration document also captures its original row. Revision values supplied
by the browser are ignored and incremented under the row lock. Snapshot updates
and deletes are denied even to an admin; historical snapshots survive deletion of
the current CRM row. No historic duplicate is merged or deleted.
If the browser changes a document's party name or INN, its old API client UUID is
cleared, preventing searches by that UUID from returning a different party's row.

`crm_document_api_requests` retains the requester, canonical command, resolved
payload and result. Idempotency identity is `(actor, documentId, expectedRevision,
input)` for one request UUID. Rendering and current company settings are deliberately
excluded from the digest: replay returns the original success without replacing
the stored document. A changed command with that UUID is rejected. Canonical JSON
is compared as well as its built-in MD5 digest; no pgcrypto installation is needed.
The recorded result is the original result; replay returns `replayed=true`.

Pending ledger context is private and scoped to backend, transaction, target
document and revision. It supplies API input to the history trigger without a
caller-controlled session variable. Completion occurs exactly once in the same
transaction; errors roll back the document, contract, history and pending ledger.

Document-number locks protect concurrent API calls and generated-document browser
inserts. Existing duplicate `(doc_type, doc_number)` rows can receive unrelated
edits, but new collisions and renumbering into an occupied key are rejected. A
global unique index is intentionally absent until historic duplicates are reviewed.
Direct legacy `contracts` inserts and renumbers acquire the same lock and reject
new duplicate CRM contract numbers; unrelated edits to old duplicates remain valid.

## Local verification

Use an isolated local database and a database-owner connection after migrations:

```sh
psql "$LOCAL_TEST_DATABASE_URL" -v ON_ERROR_STOP=1 -f supabase/tests/crm_document_api.sql
```

The test opens one transaction, creates synthetic users and documents, tests actual
roles/RLS/RPC/triggers and rolls everything back. It temporarily disables only the
new document triggers to emulate historic duplicates, then immediately reenables
them. Never aim this fixture at production. Assertions cover successful contract,
invoice and act creation; retained versions; command retries after rendering drift;
changed-key conflicts; optimistic revision conflicts; immutable identities;
archival and client mismatches; legacy edit compatibility; ambiguous names; atomic
failure rollback; CRM card rename without party replacement; browser party edits;
legacy deletion evidence; exact command binding; amount/percent discounts and
half-up rounding; contract-number guards; admin/anonymous access; and append-only evidence.

The verification command for this checkout is `node scripts/test-crm-sql.mjs`.
It passed on 2026-09-28 after adapting to the connected repository's September
schema and adding explicit service-period assertions. The result is local SQL
evidence only, not deployment or end-to-end delivery evidence.

A PGlite run executes PostgreSQL/PLpgSQL semantics against a local minimal schema,
but does not test Supabase's deployed migrations, HTTP auth gateway, multi-session
lock contention or production data. These remain separate deployment checks.
