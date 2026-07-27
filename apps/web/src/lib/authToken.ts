/**
 * Holds the current access token outside of React state. apiRequest is a
 * plain function (used inside React Query queryFns, not components), so it
 * can't call useContext itself - AuthContext calls setAccessToken whenever
 * the token changes (login, silent refresh, logout), and apiClient.ts reads
 * getAccessToken() on every request instead of needing the token passed in
 * explicitly at every call site.
 */
let accessToken: string | null = null;

export function getAccessToken(): string | null {
  return accessToken;
}

export function setAccessToken(token: string | null): void {
  accessToken = token;
}
