# Client cards and original PDF/Word files through ChatGPT

Version 0.5.0 adds seven tools to the existing 13 document/email tools:
`crm_get_client`, `crm_create_client`, `crm_update_client`,
`crm_import_client_file`, `crm_import_client_pdf`, `crm_list_client_files`, `crm_get_client_file`.
The PDF-only import remains for existing callers; new requests use the generic import.

## Conversation flow

Search by INN, name or email first. Select an exact client ID; do not guess among
namesakes. Create only when a new card is requested and no existing identity was
found. `name` is the organization/customer; `contact_person` is its contact's name.
Read the card before an update and supply `crm_revision` as `expectedRevision`.
Only supplied fields change. `null` explicitly clears an optional field; missing
information is omitted. A conflict requires rereading and reviewing the change.
Return the saved card ID, fields and revision after success.

Examples: "Найди ПИК и запиши контактное лицо Анна, почту ...";
"Создай клиента ... с ИНН ..."; "Сохрани приложенный договор в карточке ...".
Example ellipses are placeholders, never customer data.

Duplicate normalized names and INNs are rejected. A shared mailbox needs explicit
`allowSharedEmail`; this is not permission to merge cards. A request UUID belongs
to one immutable command. Saved snapshots and audit records exclude passwords,
logins and internal notes. All handlers require the verified caller's admin role.

Client revision advances on ordinary CRM edits and legacy email updates as well.
Unambiguous name-linked legacy contracts follow a rename transactionally. Generated
documents retain their original party snapshots and remain visible by client ID;
new revisions validate the stable document/client/contract relationship. Name-only
ambiguous legacy links require manual reconciliation. Cards are not merged.

## Original attachments

The native ChatGPT file parameter schema follows
https://developers.openai.com/plugins/reference#file-apis: `_meta.openai/fileParams`
lists `file`, with required `download_url` and `file_id`; `mime_type` and `file_name`
are declared optional. Download allows HTTPS subdomains of `oaiusercontent.com`,
the [OpenAI-documented file-host family](https://help.openai.com/en/articles/9247338-network-recommendations-for-chatgpt-errors-on-web-and-apps).
This includes the observed native transport host `sdmntprpolandcentral.oaiusercontent.com`.
The exact HTTPS hostname `oaisdmntprpolandcentral.blob.core.windows.net` is also
allowed because ChatGPT supplied it for original attachments in a live tool call.
This is one observed Azure storage account, not an Azure hostname wildcard.
Matching uses the full `.oaiusercontent.com` DNS-label boundary or exact equality
for that Azure account; the bare apex, lookalike domains, arbitrary user hosts,
other Azure accounts and nested Azure hostnames are rejected. Redirects,
credentials, non-default ports and URL fragments remain forbidden.
Maximum 10 MiB. PDF signature/end marker, Word OLE directory
or DOCX archive structure/content types, and SHA256 are checked. DOCM, encrypted,
malformed or disguised formats are rejected. Word content is never executed.

Originals are stored in the private `crm-client-files` bucket, linked to exact
`client_files.client_id`, displayed in the card's original files section. Downloads
use 10-minute signed URLs. No overwrite or delete tool exists. Retries preserve
original bytes. An uploaded file is not a generated contract, invoice or act and
does not send mail or change contract dates. Check the actual document's customer
before attaching it; do not assign another organization's agreement by filename.

The pinned Lovable SDK 0.23.0 omits extension metadata by default. The guarded
private SDK copy now forwards `_meta` in HTTP and MCP listings on Windows/Linux.
The build bundles that corrected runtime and preserves OAuth unchanged. Use
`npm run mcp:manifest` instead of the upstream extraction CLI. Shared node_modules
is never patched. A changed SDK fails the patch instead of silently dropping files.

## Document-specific authorized representative

For `standard` or `frdo` contracts, preview/create may include an explicit
`document.clientRepresentative` from the original source, for example:

```json
{
  "clientRepresentative": {
    "name": "Иванов Иван Иванович",
    "post": "Представитель заказчика",
    "basis": "доверенности № TEST от 01.01.2026"
  }
}
```

This synthetic example is not a customer's authority. Supply all three verified
values; `basis` follows the words «на основании». The document uses this signatory
and authority instead of assuming a director acting under the charter. It leaves
the client card and saved director snapshot unchanged. Client name, INN and address
are still required. Invoices, acts and NMO contracts reject this override.
Revisions preserve it unless a complete replacement is explicitly supplied.
It is stored in the existing document input/metadata JSON; no migration is needed.

The CRM viewer and PDF download use the saved HTML. The manual document editor
does not expose this field: recreating the document through that form does not
preserve the representative override. Use the chat revision tool for these
contracts and verify the rendered document before sending.

## Release gates

Apply client command, client file and document rename migrations in timestamp
order. Provision the private 10 MiB `crm-client-files` bucket with Lovable's Storage
tool before the file migration: bucket SQL changes are blocked by that platform.
If the tool cannot set allowed MIME types, the migration permits NULL there and
enforces MIME plus exact UUID/UUID.extension paths in the admin INSERT policy.
Apply the canonical `20260930024508_6b5c5206-bd90-423e-ae78-e7ec4427bf64.sql` migration after the
three already-applied canonical client migrations to enable PDF, DOC and DOCX;
MCP additionally validates the actual bytes. A public/oversized bucket fails the
prerequisite guard. Regenerate/commit the MCP function and manifest, deploy function, publish
frontend, refresh ChatGPT tools. Keep the existing read-only auto-approval policy;
writes ask for approval. Preparing documents is separate from sending and the
recipient/document set must be shown before the separate send confirmation.

Run `npm run test:crm`, `npm run test:crm:sql`,
`node scripts/test-crm-client-files-sql.mjs`, TypeScript and Vite build. The Deno
runtime smoke verifies the generated artifact rejects unauthenticated requests.
Use a transaction/rollback live SQL smoke for writes; actual attachment transport
and card visibility require a live ChatGPT/browser check. Local tests alone do not
establish deployment or real upload success. Never send mail as a release test.
