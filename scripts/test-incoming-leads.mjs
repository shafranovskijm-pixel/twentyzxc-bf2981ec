import test from "node:test";
import assert from "node:assert/strict";
import { filterIncomingLeads, INCOMING_LEADS_BATCH_SIZE, loadIncomingLeads } from "../src/lib/incoming-leads.ts";

const lead = (values = {}) => ({
  id: "bfa354cb-ad6c-41fd-be63-cacfe24b8f81", name: "CODEX TEST 24SINTAGMA",
  email: "crm-check@example.invalid", phone: "+7 (999) 123-45-67",
  source: "24sintagma.ru/sites", message: "Тестовая заявка. Не обрабатывать.",
  status: "new", created_at: "2026-10-18T10:00:00Z", ...values,
});

test("reads beyond the first response so an older UUID can be found", async () => {
  const rows = Array.from({ length: INCOMING_LEADS_BATCH_SIZE + 17 }, (_, i) => lead({ id: `test-${i}` }));
  const calls = [];
  const result = await loadIncomingLeads(async (from, to) => {
    calls.push([from, to]);
    return { data: rows.slice(from, to + 1), error: null };
  });
  assert.equal(result.length, rows.length);
  assert.deepEqual(calls, [[0, 199], [200, 399]]);
  assert.equal(filterIncomingLeads(result, "all", "test-216")[0].id, "test-216");
});

test("does not present a failed later page as a complete or empty inbox", async () => {
  const denied = new Error("RLS denied");
  await assert.rejects(loadIncomingLeads(async from => from === 0
    ? { data: Array.from({ length: INCOMING_LEADS_BATCH_SIZE }, (_, i) => lead({ id: String(i) })), error: null }
    : { data: null, error: denied }), error => error === denied);
  await assert.rejects(loadIncomingLeads(async () => ({ data: null, error: null })), /could not be loaded/);
});

test("empty inbox completes and duplicate records from a shifting page appear once", async () => {
  assert.deepEqual(await loadIncomingLeads(async () => ({ data: [], error: null })), []);
  const first = Array.from({ length: INCOMING_LEADS_BATCH_SIZE }, (_, i) => lead({ id: String(i) }));
  const result = await loadIncomingLeads(async from => ({
    data: from === 0 ? first : [first.at(-1), lead({ id: "older" })], error: null,
  }));
  assert.equal(result.length, INCOMING_LEADS_BATCH_SIZE + 1);
  assert.equal(result.filter(row => row.id === first.at(-1).id).length, 1);
});

test("a cancelled inbox does not continue fetching pages", async () => {
  const controller = new AbortController();
  let calls = 0;
  await assert.rejects(loadIncomingLeads(async () => {
    calls++;
    controller.abort();
    return { data: Array.from({ length: INCOMING_LEADS_BATCH_SIZE }, (_, i) => lead({ id: String(i) })), error: null };
  }, controller.signal), { name: "AbortError" });
  assert.equal(calls, 1);
});

test("finds UUID, contacts, source and full message locally with trimmed case-insensitive search", () => {
  const rows = [lead(), lead({ id: "other", name: "Другая", message: null, phone: null, email: null, source: null })];
  for (const query of [" BFA354CB-AD6C-41FD-BE63-CACFE24B8F81 ", "codex test", "CRM-CHECK@", "24SINTAGMA.RU", "не обрабатывать"]) {
    assert.deepEqual(filterIncomingLeads(rows, "all", query).map(row => row.id), [rows[0].id]);
  }
  assert.equal(filterIncomingLeads(rows, "all", "не найдено").length, 0);
});

test("phone formatting does not hide an enquiry and status filters remain independent", () => {
  const rows = [lead(), lead({ id: "closed", status: "rejected" })];
  assert.equal(filterIncomingLeads(rows, "all", "9991234567").length, 2);
  assert.deepEqual(filterIncomingLeads(rows, "new", "+7 999 123-45-67").map(row => row.id), [rows[0].id]);
  assert.deepEqual(filterIncomingLeads(rows, "rejected", " ").map(row => row.id), ["closed"]);
  assert.equal(filterIncomingLeads(rows, "converted", "codex").length, 0);
});

test("null optional fields remain searchable by UUID and filtering does not mutate records", () => {
  const row = lead({ name: null, phone: null, email: null, message: null, source: null, status: null });
  const before = structuredClone(row);
  assert.deepEqual(filterIncomingLeads([row], "all", row.id), [row]);
  assert.deepEqual(filterIncomingLeads([row], "new", ""), []);
  assert.deepEqual(row, before);
});
