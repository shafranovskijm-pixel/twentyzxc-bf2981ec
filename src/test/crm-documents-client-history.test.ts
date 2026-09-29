import { describe, expect, it } from "vitest";
import { loadClientCardDocuments } from "../lib/client-document-query";

function database(clients: { id: string; name: string }[], documents: Record<string, unknown>[]) {
  const queries: { table: string; filters: [string, unknown][] }[] = [];
  return {
    queries,
    db: {
      from(table: string) {
        let rows = table === "clients" ? clients : documents;
        const entry = { table, filters: [] as [string, unknown][] };
        queries.push(entry);
        const query = {
          select() { return query; },
          eq(field: string, value: unknown) {
            entry.filters.push([field, value]);
            rows = rows.filter(row => row[field] === value);
            return query;
          },
          is(field: string, value: unknown) { return query.eq(field, value); },
          order() { return query; },
          limit(limit: number) { rows = rows.slice(0, limit); return query; },
          then(resolve: (result: unknown) => unknown) { return Promise.resolve({ data: rows, error: null }).then(resolve); },
        };
        return query;
      },
    } as unknown as Parameters<typeof loadClientCardDocuments>[0],
  };
}

function doc(id: string, clientId: string | null, name: string, createdAt: string) {
  return { id, client_id: clientId, client_name: name, created_at: createdAt, html_content: `<p>${name}</p>` };
}

describe("client card document identity", () => {
  it("keeps linked documents visible after rename without rewriting legal snapshots", async () => {
    const fixture = database([{ id: "a", name: "New name" }], [doc("1", "a", "Old name", "2026-01-01")]);
    const result = await loadClientCardDocuments(fixture.db, "a", "New name");
    expect(result.map(row => row.id)).toEqual(["1"]);
    expect(result[0].html_content).toBe("<p>Old name</p>");
  });

  it("merges only unlinked unique-name legacy documents and sorts the shared list", async () => {
    const fixture = database([{ id: "a", name: "Company" }], [
      doc("1", "a", "Earlier name", "2026-01-01"),
      doc("2", null, "Company", "2026-02-01"),
      doc("3", "other", "Company", "2026-03-01"),
      doc("4", null, "Different", "2026-04-01"),
    ]);
    const result = await loadClientCardDocuments(fixture.db, "a", "Company");
    expect(result.map(row => row.id)).toEqual(["2", "1"]);
  });

  it("excludes name-only legacy matches when two clients share a name", async () => {
    const fixture = database([{ id: "a", name: "Same" }, { id: "b", name: "Same" }], [
      doc("1", "a", "Same", "2026-01-01"), doc("2", null, "Same", "2026-02-01"),
    ]);
    expect((await loadClientCardDocuments(fixture.db, "a", "Same")).map(row => row.id)).toEqual(["1"]);
    expect(fixture.queries).toHaveLength(2);
  });

  it("does not adopt another client's legacy documents while editing a name", async () => {
    const fixture = database([{ id: "a", name: "Original" }, { id: "b", name: "Typed name" }], [
      doc("1", "a", "Original", "2026-01-01"), doc("2", null, "Typed name", "2026-02-01"),
    ]);
    expect((await loadClientCardDocuments(fixture.db, "a", "Typed name")).map(row => row.id)).toEqual(["1"]);
  });

  it("does not load documents for an unsaved client", async () => {
    const fixture = database([{ id: "a", name: "Same" }], [doc("1", "a", "Same", "2026-01-01")]);
    expect(await loadClientCardDocuments(fixture.db, "", "Same")).toEqual([]);
    expect(fixture.queries).toHaveLength(0);
  });
});
