

## Problem Analysis

The admin session keeps getting reset due to several issues in `use-admin-auth.tsx`:

1. **1-second timeout race condition** (line 35-39): Fires before `getSession()` or `onAuthStateChange` resolves, setting `isLoading=false` with no user/admin state, which triggers the login dialog (line 137 in Admin.tsx).

2. **No admin status caching**: Every page load/refresh calls the `has_role` RPC. If it times out (5s limit) or fails due to network issues, `isAdmin` becomes `false` and the user gets kicked out.

3. **Token refresh events**: `onAuthStateChange` fires on `TOKEN_REFRESHED`, re-running `checkAdminRole` each time. Any failure resets admin state.

## Plan

### 1. Cache admin status in localStorage

After a successful `checkAdminRole`, store `{ userId, isAdmin, timestamp }` in localStorage. On hook init, read this cache immediately to set initial state, avoiding the loading/logout flash.

### 2. Rewrite initialization logic

- Remove the aggressive 1-second timeout
- On mount: read cached admin state first, then call `getSession()` to verify
- Only show login if session is definitively absent (not on timeout)
- Re-verify admin role in background without resetting state on failure

### 3. Handle auth state changes gracefully

- On `TOKEN_REFRESHED`: keep existing admin state, don't re-check
- On `SIGNED_IN`: verify admin role, update cache
- On `SIGNED_OUT`: clear cache and state
- Never set `isAdmin=false` on RPC timeout/error if user was previously verified

### Files to modify
- `src/hooks/use-admin-auth.tsx` — rewrite with localStorage caching and resilient logic

