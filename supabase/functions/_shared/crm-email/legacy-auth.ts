/** Authorization for existing CRM and organization mail callers. */
export class EmailAuthorizationError extends Error {
  constructor(public readonly status: 401 | 403, message: string) { super(message); }
}
type QueryResult = { data: unknown; error: unknown };
export interface EmailAuthDatabase {
  auth: { getUser(token: string): Promise<{ data: { user: { id: string } | null }; error: unknown }> };
  rpc(name: string, args: Record<string, unknown>): PromiseLike<QueryResult>;
  from(name: string): { select(fields: string): { ilike(field: string, value: string): { limit(count: number): PromiseLike<QueryResult> } } };
}

export function requestBearer(request: Request): string {
  const match = request.headers.get("authorization")?.match(/^Bearer ([^\s]+)$/i);
  if (!match) throw new EmailAuthorizationError(401, "Authentication required");
  return match[1];
}

export async function authorizeLegacyEmail(token: string, serviceKey: string | undefined, database: EmailAuthDatabase, recipients: string[]): Promise<void> {
  // Only the exact server-side key used by the existing campaign worker bypasses user authentication.
  if (serviceKey && token === serviceKey) return;
  const { data, error } = await database.auth.getUser(token);
  if (error || !data.user?.id) throw new EmailAuthorizationError(401, "Invalid authentication");
  const admin = await database.rpc("has_role", { _user_id: data.user.id, _role: "admin" });
  if (!admin.error && admin.data === true) return;
  const organization = await database.rpc("has_role", { _user_id: data.user.id, _role: "organization" });
  if (organization.error || organization.data !== true) throw new EmailAuthorizationError(403, "Email sending is not permitted");
  // Preserve OrgSales while limiting it to existing leads visible through caller RLS.
  // Literal escaping prevents '%' or '_' in a mailbox from widening the match.
  for (const recipient of recipients) {
    const escaped = recipient.replace(/[\\%_]/g, value => `\\${value}`);
    const visible = await database.from("org_leads").select("id").ilike("email", escaped).limit(1);
    if (visible.error || !Array.isArray(visible.data) || !visible.data.length) throw new EmailAuthorizationError(403, "Recipient is not an accessible organization lead");
  }
}
