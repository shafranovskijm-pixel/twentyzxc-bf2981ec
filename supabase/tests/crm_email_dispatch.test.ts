import { dispatchDelivery, preparePdfAttachments, publicDelivery, sha256, type Delivery, type DeliveryDependencies } from "../functions/_shared/crm-email/delivery.ts";
function assert(value: unknown, message = "Assertion failed"): asserts value { if (!value) throw new Error(message); }
const pdf = new TextEncoder().encode("%PDF-1.7\nfixture");
async function fixture(state = "prepared") {
  let row: Delivery = { id: "delivery", actor_id: "actor", client_id: "client", recipient: "test@example.invalid", subject: "Документ", body: "<script>data</script>", state, message_id: "<crm-delivery@24zxc.ru>",
    documents: [{ documentId: "doc", revision: 2, filename: "Счёт.pdf", html: "<p>Сохранённая версия</p>", type: "invoice", number: "TEST" }],
    attachments: [{ documentId: "doc", revision: 2, filename: "Счёт.pdf", path: "immutable.pdf", sha256: await sha256(pdf), size: pdf.length, contentType: "application/pdf" }] };
  const calls = { send: 0, finish: [] as string[], upload: 0, html: "" };
  const deps: DeliveryDependencies = {
    render: async html => { assert(html.includes("Сохранённая")); return pdf; },
    upload: async () => { calls.upload++; }, download: async () => pdf,
    finalize: async (_id, _actor, attachments) => row = { ...row, state: "prepared", attachments },
    claim: async () => { const claimed = row.state === "prepared"; if (claimed) row = { ...row, state: "sending" }; return { claimed, delivery: row }; },
    finish: async (_id, _actor, next, receipt, error) => { calls.finish.push(next); return row = { ...row, state: next, receipt, error }; },
    send: async input => { calls.send++; calls.html = input.html; assert(input.messageId === row.message_id); return { receipt: "250 2.0.0 accepted" }; },
  };
  return { deps, calls, get row() { return row; } };
}
Deno.test("SMTP accepted is journalled once; repeating delivery never sends twice", async () => {
  const f = await fixture();
  const sent = await dispatchDelivery("delivery", "actor", f.deps);
  const repeated = await dispatchDelivery("delivery", "actor", f.deps);
  assert(sent.state === "smtp_accepted" && repeated.state === "smtp_accepted" && f.calls.send === 1);
  assert(f.calls.html.includes("&lt;script&gt;") && !f.calls.html.includes("<script>"));
  assert(publicDelivery(sent).recipientDeliveryConfirmed === false);
});
Deno.test("simultaneous calls use the atomic claim, one SMTP call", async () => {
  const f = await fixture();
  await Promise.all([dispatchDelivery("delivery", "actor", f.deps), dispatchDelivery("delivery", "actor", f.deps)]);
  assert(f.calls.send === 1);
});
Deno.test("modified attachment is rejected before SMTP", async () => {
  const f = await fixture(); f.deps.download = async () => new TextEncoder().encode("%PDF-1.7\nchanged");
  assert((await dispatchDelivery("delivery", "actor", f.deps)).state === "failed"); assert(f.calls.send === 0);
});
Deno.test("pre-submission SMTP failure is distinct from ambiguous post-submission", async () => {
  for (const outcome of ["failed", "unknown"]) {
    const f = await fixture(); f.deps.send = async () => { f.calls.send++; throw Object.assign(new Error("SMTP failure"), { outcome }); };
    assert((await dispatchDelivery("delivery", "actor", f.deps)).state === outcome);
    await dispatchDelivery("delivery", "actor", f.deps); assert(f.calls.send === 1);
  }
});
Deno.test("SMTP accepted followed by DB outage never reports safely failed", async () => {
  const f = await fixture(); f.deps.finish = async () => { throw new Error("DB unavailable"); };
  assert((await dispatchDelivery("delivery", "actor", f.deps)).state === "unknown");
  assert(f.calls.send === 1); await dispatchDelivery("delivery", "actor", f.deps); assert(f.calls.send === 1);
});
Deno.test("prepare uses frozen source and hash-addressed PDF; no SMTP", async () => {
  const f = await fixture("preparing");
  const ready = await preparePdfAttachments(f.row, f.deps);
  assert(ready.state === "prepared" && f.calls.send === 0 && f.calls.upload === 1);
  assert(ready.attachments[0].path.endsWith(`-r2-${await sha256(pdf)}.pdf`));
  await preparePdfAttachments(ready, f.deps); assert(f.calls.upload === 1);
});
Deno.test("public result never includes source HTML or storage path", async () => {
  const f = await fixture(); const output = JSON.stringify(publicDelivery(f.row));
  assert(!output.includes("Сохранённая") && !output.includes("immutable.pdf") && !output.includes('"actor_id"'));
});
