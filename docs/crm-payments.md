# CRM payment commands from ChatGPT

Issue #20 adds two MCP tools: `crm_get_payment_status` and
`crm_set_payment_status`. The implementation uses the existing authenticated
ChatGPT connection and the caller's CRM admin role. It requires the payment
migration and regenerated MCP function to be deployed together. Local tests do
not establish that the live connection has refreshed its tool catalogue; no
production payment is changed as part of development or tests.

## Selection and conversation flow

1. Find the client with `crm_search_clients`. Read its exact contracts and
   invoices with `crm_list_contracts` and `crm_list_documents`.
2. Select the exact `clientId` and `contractId` or `invoiceId`. If both document
   IDs are supplied, the invoice must belong to that contract. A client may have
   several unrelated contracts; a name such as “Тестовый клиент оплатил” is not permission
   to mark all of them paid. Clarify unresolved document choices.
3. Read `crm_get_payment_status`. Use its `paymentRevision` and `sourceRevision`
   in the write. For a contract with one invoice, the server resolves that
   invoice. For multiple invoices it returns an aggregate with
   `requiresInvoiceSelection: true`; a write requires the chosen invoice ID.
4. Save only the user-authorized payment change. A request UUID identifies this
   exact command. After a timeout, reuse that UUID **and the same parameters**.
5. Report success only after the tool returns `saved: true, verified: true`.
   Show the stored status, cumulative receipts, remaining amount and evidence
   source. The wrapper obtains this result by reading the saved state again.

The invoice amount comes from its saved `total_amount`, which already includes
the document discount. The discount is not reapplied; a discount deadline does
not change the saved invoice automatically. A contract without invoices uses
its recorded `amount + amount_extra`. Neither the user nor ChatGPT supplies a
replacement amount due to the payment tool.

| Requested status | API value | Cumulative paid amount |
| --- | --- | --- |
| Не оплачен | `unpaid` | Zero; may be omitted |
| Частично оплачен | `partial` | Required, strictly between zero and amount due |
| Оплачен | `paid` | Full amount due after discount; may be omitted |

`paidAmount` is always the **total amount received**, not an amount to add. If
current receipts are 5,000 ₽ and the user reports “ещё 3,000 ₽”, the resulting
cumulative amount is 8,000 ₽, after reading and resolving that exact invoice.
Payment amounts use rubles with no more than two decimal places. Overpayments
are rejected rather than silently clamped or allocated to another document.

`paidOn` is the actual payment date when known, otherwise `null`. The audit
timestamp is stored separately. Neither a tool invocation date nor a document
date substitutes for a missing payment date. `user_report` means the user stated
that payment occurred. `bank_document` records information supplied in a bank
document and requires its reference or description in `reason`. Neither source
means that this integration verified the bank account: `bankVerified` remains
`false`.

## State, history and legacy data

`crm_payment_states` holds the canonical amount and payment revision for each
specific contract without invoices, or each invoice. Separate contracts and
invoices have separate states. `crm_payment_commands` records the immutable
request, actor, previous snapshot, stored result and change timestamp. Snapshot
history returns the latest 50 operations, including old/new cumulative amounts,
source, comment and payment date. Older audit records remain in the ledger.

Old status strings do not prove any amount was received, including the old
default “не оплачено”. Until explicitly confirmed through the payment command,
`paidAmount`, `remainingAmount` and `paymentStatus` are `null`, `amountKnown` is
`false`, and the old label is reported separately as `legacyStatus`. It must not
be converted into fabricated receipts or a confirmed zero.

For a contract with multiple invoices, the aggregate sums all invoice amounts.
If any invoice's receipts are unknown, the aggregate payment status, receipts
and balance remain unknown. `knownPaidAmount` provides only the known subtotal;
it is not a fully confirmed contract balance. Individual invoice values remain
available in `linkedInvoices`.

The existing contract payment label is updated as a compatibility projection.
The command does not edit generated HTML/PDF, signatures, document numbers or
dates, service periods, `paid_until`, or `clients.payment_date`, and sends no
message. Managed payment fields cannot subsequently be overwritten by the old
generic contract editor. Amount or linkage changes that would invalidate the
payment ledger require explicit reconciliation; the payment tools do not
redistribute receipts or silently revise documents.

## API and consistency boundary

The read RPC accepts `p_client_id`, nullable `p_contract_id`, and nullable
`p_invoice_id`. The write RPC additionally accepts:

| Parameter | Meaning |
| --- | --- |
| `p_request_id` | UUID for one exact operation |
| `p_expected_revision` | `paymentRevision` from the read, zero for an uninitialized state |
| `p_expected_source_revision` | Exact `sourceRevision` fingerprint from the read |
| `p_status` | `unpaid`, `partial`, or `paid` |
| `p_paid_amount` | Cumulative ruble amount or null for the supported status-derived defaults |
| `p_paid_on` | Known ISO date or null |
| `p_confirmation_source` | `user_report` or `bank_document` |
| `p_reason` | Optional comment, required evidence reference for `bank_document` |

The fingerprint protects the selected identities, amounts, linked invoice set,
invoice revisions and relevant legacy source state. A new source or payment
revision is not silently substituted into a failed command. The server checks
the exact client/document relationship, including ambiguous legacy name links,
before writing. It authorizes the user's admin role again inside the SQL RPC,
serializes updates and saves state plus audit atomically. Direct table writes
to the payment ledger are not granted to authenticated users.

The first implementation briefly takes EXCLUSIVE transaction locks on contracts,
clients and generated documents, in the same order as existing client commands.
Ordinary reads remain available; other CRM writes wait until the transaction
finishes. This deliberately favors consistency with legacy editors over write
throughput. Multi-session contention and production lock latency have not been
measured by the local PGlite tests.

The MCP wrapper uses the user's JWT and publishable/anonymous key, never a
service-role key. It validates dates, UUIDs, cumulative amounts and evidence;
database error details are mapped to safe messages. After a successful SQL
write it calls the read RPC and compares identities, amounts, status, source,
date and revisions before claiming `verified: true`.

A replay returns the original stored operation without applying it again. If a
later operation already changed the current state, the wrapper reports
`CRM_PAYMENT_VERIFICATION_CONFLICT` rather than presenting the old snapshot as
the current status. If the verification read fails, it reports
`CRM_PAYMENT_VERIFICATION_FAILED`: the write may have committed. Read the state
and retry the same request only; do not create a second receipt. This handling
does not roll back a completed write or silently retry against a new revision.

## Verification and deployment

`src/test/crm-documents-payment.test.ts` exercises the user-JWT/admin boundary,
exact RPC arguments, cumulative amounts, discount-derived full payment, unknown
legacy values, evidence sources, null dates, retries, stale results, malformed
responses and sanitized failures. The PostgreSQL payment assertions run through
the repository SQL test harness in an isolated PGlite database, without
production client data. This is local transaction evidence, not a test of
deployed Supabase infrastructure or a completed live ChatGPT call.

Before live use, deploy the payment migration and rebuilt MCP function, publish
the matching CRM display changes, and refresh the connected tool catalogue if
needed. Validate an authorized real operation by observing the returned saved
ID/revision and the independently read current payment. Do not claim that a
client has been marked paid merely because this code or issue exists.
