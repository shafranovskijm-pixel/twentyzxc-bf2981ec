export class AdminAuthTimeoutError extends Error {
  constructor() {
    super("The authentication request timed out");
    this.name = "AdminAuthTimeoutError";
  }
}

// Bound the UI wait even when a transport or browser auth lock stops responding.
// This does not cancel the SDK operation; any later auth event must still verify
// the administrator role before it can grant access.
export async function withAdminAuthTimeout<T>(operation: PromiseLike<T>, milliseconds: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      operation,
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new AdminAuthTimeoutError()), milliseconds);
      }),
    ]);
  } finally {
    clearTimeout(timer);
  }
}
