const TOKEN_KEY = 'admin_token';
const ACTIVITY_KEY = 'admin_last_activity';
export const IDLE_LIMIT_MS = 15 * 60 * 1000;

export function saveToken(token: string) {
  sessionStorage.setItem(TOKEN_KEY, token);
  touchActivity();
}

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return sessionStorage.getItem(TOKEN_KEY);
}

export function removeToken() {
  sessionStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(ACTIVITY_KEY);
  localStorage.removeItem(TOKEN_KEY); // nettoie l'ancien stockage
}

export function touchActivity() {
  sessionStorage.setItem(ACTIVITY_KEY, String(Date.now()));
}

export function getLastActivity(): number {
  return Number(sessionStorage.getItem(ACTIVITY_KEY) ?? 0);
}

export function isAuthenticated(): boolean {
  if (!getToken()) return false;
  if (Date.now() - getLastActivity() > IDLE_LIMIT_MS) {
    removeToken();
    return false;
  }
  return true;
}

export function logout() {
  removeToken();
  window.location.replace('/admin/login');
}

export async function refreshToken(): Promise<boolean> {
  const token = getToken();
  if (!token) return false;
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/refresh`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });
        if (!res.ok) return false;
    const data = await res.json();
    if (!data.accessToken) return false;
    sessionStorage.setItem(TOKEN_KEY, data.accessToken);
    return true;
  } catch {
    return false;
  }
}