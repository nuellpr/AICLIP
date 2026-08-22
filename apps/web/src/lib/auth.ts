export interface AuthUser {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
  role: string;
}

export const getStoredToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('clipforge_token');
};

export const getStoredUser = (): AuthUser | null => {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem('clipforge_user');
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch (_e) {
    return null;
  }
};

export const setAuthSession = (token: string, user: AuthUser) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem('clipforge_token', token);
  localStorage.setItem('clipforge_user', JSON.stringify(user));
};

export const clearAuthSession = () => {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('clipforge_token');
  localStorage.removeItem('clipforge_user');
};

export const getAuthHeader = (): Record<string, string> => {
  const token = getStoredToken();
  if (!token) return {};
  return { Authorization: `Bearer ${token}` };
};

export const isAuthenticated = (): boolean => {
  return !!getStoredToken() && !!getStoredUser();
};
