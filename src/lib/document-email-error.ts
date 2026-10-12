/** Preserve an actionable CRM refusal hidden inside Supabase's HTTP error wrapper. */
export async function documentEmailErrorMessage(error: unknown, fallback = "Не удалось отправить письмо"): Promise<string> {
  const details = error && typeof error === "object" ? error as { context?: unknown; message?: unknown } : null;
  if (details?.context instanceof Response) {
    try {
      // Clone so other consumers can still inspect the original response.
      const body = await details.context.clone().json();
      if (typeof body?.code === "string" && body.code.startsWith("CRM_") && typeof body.error === "string" && body.error.trim()) return body.error;
    } catch { /* A malformed/provider response retains the original error or fallback. */ }
  }
  return typeof details?.message === "string" && details.message.trim() ? details.message : fallback;
}
