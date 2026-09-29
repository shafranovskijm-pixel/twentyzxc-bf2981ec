# Client cards and original PDFs through ChatGPT

Version 0.4.0 adds six tools to the existing 13 document/email tools:
`crm_get_client`, `crm_create_client`, `crm_update_client`,
`crm_import_client_pdf`, `crm_list_client_files`, `crm_get_client_file`.

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
are declared optional. Download uses HTTPS `files.oaiusercontent.com` only, no
redirects or arbitrary URL fetch. Another actual host must be verified before it
can be supported. Maximum 10 MiB, PDF signature/end marker and SHA256 checked.

Originals are stored in the private `crm-client-files` bucket, linked to exact
`client_files.client_id`, displayed in the card's "Оригиналы PDF" section. Downloads
use 10-minute signed URLs. No overwrite or delete tool exists. Retries preserve
original bytes. An uploaded file is not a generated contract, invoice or act and
does not send mail or change contract dates. Check the actual document's customer
before attaching it; do not assign another organization's agreement by filename.

The pinned Lovable SDK 0.23.0 omits extension metadata by default. The guarded
private SDK copy now forwards `_meta` in HTTP and MCP listings on Windows/Linux.
The build bundles that corrected runtime and preserves OAuth unchanged. Use
`npm run mcp:manifest` instead of the upstream extraction CLI. Shared node_modules
is never patched. A changed SDK fails the patch instead of silently dropping files.

## Release gates

Apply client command, client file and document rename migrations in timestamp
order. Regenerate/commit the MCP function and manifest, deploy function, publish
frontend, refresh ChatGPT tools. Keep the existing read-only auto-approval policy;
writes ask for approval. Preparing documents is separate from sending and the
recipient/document set must be shown before the separate send confirmation.

Run `npm run test:crm`, `npm run test:crm:sql`,
`node scripts/test-crm-client-files-sql.mjs`, TypeScript and Vite build. The Deno
runtime smoke verifies the generated artifact rejects unauthenticated requests.
Use a transaction/rollback live SQL smoke for writes; actual attachment transport
and card visibility require a live ChatGPT/browser check. Local tests alone do not
establish deployment or real upload success. Never send mail as a release test.
