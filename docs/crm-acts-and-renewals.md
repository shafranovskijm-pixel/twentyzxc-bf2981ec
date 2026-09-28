# Acts and renewal options

The CRM MCP source now supports 13 tools. This document describes behavior;
deployment evidence is recorded separately and is not implied by this file.

## Invoice-based acts

An act accepts exactly one basis: a CRM `contractId`, or `invoiceBasis` for an
existing SINTAGMA `subscription_invoice`. Read that invoice with the SINTAGMA
export tool first; pass its exact organization, source ID, number, date, amount,
and payer identity. This is a caller-supplied source snapshot, not an independent
cross-project server verification. No SINTAGMA record or payment status changes.

The act is saved in `generated_documents` with `client_id`, revision history and
an immutable source snapshot. The CRM validates the payer INN, full invoice
amount and dates, and prevents a second act for the same invoice. It does not
invent a contract. Invoice-based acts require the client's name and INN; missing
fields are reported explicitly. No missing client identity is guessed.

For an executor explicitly configured as an individual entrepreneur, an empty
signature name is derived from the saved full legal name, and the capacity is
`ИП`. Existing representative details and persisted settings are preserved.

## Show options before sending

For “выставить договор и счёт по ФИС ФРДО компаниям, у которых скоро закончится
срок”, start with `crm_find_renewal_candidates`. The tool is read-only and shows
the actual search window (30 days by default), contracts, recorded expiry basis,
previous amounts, source services, email, ambiguous client matches and missing
conditions. `paid_until` is explicitly a paid-through date, not evidence that a
contract expires. A new price or annual period is never inferred.

Show the options and ask the user to select clients and agree new conditions.
Then preview and save the requested documents. Prepare the email with exact
document revisions, show recipient and attachments, and ask “Отправить?”. Wait
for the separate answer before `crm_send_document_email`. The initial instruction
to create/issue a document is not a send approval. The conversational workflow is
expressed in MCP instructions and tool descriptions; the existing server pins
recipient, attachment versions and duplicate-send protection.

If saving fails, report the actual error. An external PDF or Gmail message does
not count as a document saved in CRM and is not a substitute for fixing the save.

Existing sent acts are unchanged. Importing the previous ВЦОТ PDFs was explicitly
excluded by the user from this change.

