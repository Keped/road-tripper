const AUTH_TOKEN_KEY = 'roadpulse_auth_token';

export function getAuthToken(): string | null {
  return localStorage.getItem(AUTH_TOKEN_KEY) || sessionStorage.getItem(AUTH_TOKEN_KEY);
}

export function setAuthToken(token: string, remember: boolean = true): void {
  if (remember) {
    localStorage.setItem(AUTH_TOKEN_KEY, token);
  } else {
    sessionStorage.setItem(AUTH_TOKEN_KEY, token);
  }
}

export function clearAuthToken(): void {
  localStorage.removeItem(AUTH_TOKEN_KEY);
  sessionStorage.removeItem(AUTH_TOKEN_KEY);
}

export async function login(username: string, password: string, remember: boolean = true): Promise<boolean> {
  const res = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Invalid credentials');
  }

  const data = await res.json();
  if (data.success && data.token) {
    setAuthToken(data.token, remember);
    return true;
  }

  return false;
}

export async function checkSession(): Promise<boolean> {
  const token = getAuthToken();
  if (!token) return false;

  try {
    const res = await fetch('/api/auth/session', {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      clearAuthToken();
      return false;
    }
    const data = await res.json();
    return data.authenticated === true;
  } catch {
    return false;
  }
}
