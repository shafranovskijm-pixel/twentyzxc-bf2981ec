# ChatGPT / MCP: first document implementation

Status: local implementation, not deployed or connected to a live ChatGPT account.
The Lovable Git settings were inspected on 2026-09-28: project
`c2afa16d-2c40-4a1e-9579-ec1baa3f79f0` connects to
`shafranovskijm-pixel/twentyzxc-bf2981ec`, branch `main`.
The implementation base is `f537cbbfcafaa7594057e4eeef4c4d14f32e8237`.

## Implemented boundary

`src/lib/mcp/index.ts` defines eight tools: suggest a number, search clients, list
contracts, list linked documents, read a document, preview, create, and revise. The existing
Lovable MCP SDK builds a Supabase Edge Function and OAuth manifest. No OpenAI API
key or model invocation is used by this server: the conversational client calls
its tools. OAuth configuration and an actual ChatGPT connection remain deployment
work; local tests do not establish their availability.

All handlers use the verified caller's JWT and require the CRM admin role. They
do not use a service-role key. Client projections deliberately omit passwords,
logins and notes. Exact IDs identify a selected client/document. Ambiguous legacy
contract links by client name fail instead of guessing.

New documents are created in 24ZXC by default. Current templates (standard, FRDO,
NMO) provide the document text and design. The renderer escapes supplied strings,
formats dates without timezone shifts, and fixes the company/client requisites
in revision metadata. The API creates HTML; it does not create or claim a PDF.
Reusing template text is not a new legal review or an assertion that it fits every
client's transaction.

`crm_save_document` is the atomic database boundary. See
`docs/crm-document-api-sql.md` for its role checks, number locks, revision ledger,
request replay, contract-card drift detection and rollback behavior. A retry uses
the same request UUID and exactly the same command. A deliberate new operation
uses a new UUID. A version conflict requires rereading, not silently retrying with
a newer number.

## Command data

Documents need an explicit existing `clientId`, `type`, `number`, ISO `date` and
`services` rows (`name`, `qty`, `price`). New contracts additionally need
`subject`, `deadline` text and `paymentTerms`. Contract `template` defaults to
`standard`, the existing CRM "Сайт" template; `frdo` and `nmo` select their named
templates. The linked contract card receives the existing exact type label
"Сайт", "ФРДО" or "НМО". A revision cannot change its template. Acts require
an explicit `contractId`; invoices may link one.

An invoice discount is `{kind: "amount" | "percent", value, deadline?}`. A revision
may set `discount: null` to remove it. Values use two decimal places, quantities
up to three; calculation rounds each line half-up to kopecks. The current editor
uses the same calculation and stores the invoice amount after the discount.
The discount deadline remains a stated condition, not a timer that silently
changes a previously generated document.

Contract `servicePeriod: {start?, end?, noDeadline}` carries explicit ISO dates
separately from the date of the document and the date of payment. No period is
inferred from free text. When supplied, these dates must agree with the requested
`deadline` text. Changing a previously structured deadline also needs an explicit
updated period. `paid_until` is never inferred or overwritten by this API.

Revision changes may contain date, services, subject, deadline, paymentTerms,
servicePeriod or discount. They cannot change document number/type, client or
contract identity. Client and issuer snapshots remain fixed. A card's independent
date/amount/period change is detected before overwriting it.

## Known limits and next steps

- Call `crm_suggest_document_number` for a `NNN/YYYY` candidate using the document
  date. It scans all clients' documents for that type and year; contracts also
  include contract cards. Legacy `NNN-YYYY` numbers are included. The candidate is
  not reserved. On a number collision before successful creation, reread the
  candidate and retry the failed operation with that new number. The create
  transaction remains the authority for uniqueness.
- Existing documents without a verified structured API revision cannot be
  automatically reinterpreted from HTML. Explicit adoption is a later operation.
  A manual edit in the old editor creates a legacy revision; it likewise needs
  adoption before another API edit. Listing by client ID explicitly reports that
  historical unlinked rows are outside its coverage.
- The API does not expose custom appendices or update a signed-document status.
  Existing card appendix/payment fields are preserved on revisions. It cannot
  establish whether a document was signed externally.
- The separate SINTAGMA patch searches source invoices and requests short-lived
  download links under the caller's organization permissions. No importer, SHA-256
  inspection or CRM file persistence is included in this first stage.
- There is no server PDF renderer or sending tool yet. The existing mail handler
  lacks its own admin check in this source snapshot and may return async 202 before
  SMTP completes. It must be integrated with authorization, immutable attachments
  and delivery evidence before a new send/resend tool is exposed.
- No migration, backend function, published frontend, OAuth setting or client
  message has been changed by this local work. A live end-to-end test is pending.

## Verification

`npm test` runs the existing application tests together with the new tests.
`npm run test:crm` runs the focused document/domain/authorization tests in Node.
`npm run test:crm:sql` executes the selected real schema migrations, new migration,
RLS checks and transactional assertions in PGlite (PostgreSQL WASM).
`npx tsc --noEmit -p tsconfig.app.json` checks application types; `npm run build`
builds the frontend and MCP entry.

On Windows, the Vite configuration loads the plugin through
`scripts/mcp-sdk-windows.mjs`. SDK 0.23.0 otherwise misclassifies a drive path as
an npm package and emits an unusable `npm:D:\\...` entry import. The helper checks
the exact SDK version and resolver text, copies the SDK inside the ignored
`.codex-temp/` directory, and patches only that private copy. It leaves the original
dependency directory untouched; Linux uses the normal plugin. Four guard tests
cover this workaround. Vite build, dev and manifest extraction use the same loader.

The SDK output is JavaScript with erased TypeScript types saved under `.ts`.
Running strict `deno check` on that generated file reports implicit types and
widened literals (221 diagnostics in the local run); it is not a successful type
check. Application source is checked with `tsc`. The generated artifact is also
executed by `deno test --no-check --allow-env --deny-net
supabase/tests/mcp_runtime.test.ts`: this tests actual Deno startup and HTTP 401
with OAuth discovery before any network/database access, without starting a
listening server. It is runtime evidence, not an authenticated live-site test.

PGlite does not test deployed Supabase infrastructure or multi-session contention.
Mocked query tests test projections and routing, not live data. No SMTP, client
email, original file download or deployed OAuth behavior is claimed.

Official interface references:
- https://developers.openai.com/plugins/quickstart
- https://developers.openai.com/plugins/build/mcp-server
- https://developers.openai.com/plugins/build/auth
- Installed `@lovable.dev/mcp-js@0.23.0` README and Supabase Vite adapter.
