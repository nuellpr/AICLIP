export const getApiUrl = (path: string): string => {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  if (typeof window !== 'undefined') {
    const base = (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/+$/, '');
    if (base.endsWith('/api') && cleanPath.startsWith('/api/')) {
      return `${base}${cleanPath.substring(4)}`;
    }
    return `${base}${cleanPath}`;
  }
  // SSR fallback: use NEXT_PUBLIC_API_URL or default
  const serverBase = (process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:3001').replace(/\/+$/, '');
  return `${serverBase}${cleanPath}`;
};

export const apiFetch = async (path: string, options: RequestInit = {}): Promise<Response> => {
  const headers = new Headers(options.headers);
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('clipforge_token');
    if (token) headers.set('Authorization', `Bearer ${token}`);
  }
  if (options.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  const res = await fetch(getApiUrl(path), { ...options, headers });

  // Token expired/invalid di seluruh app: bersihkan session lalu redirect ke
  // login, jangan biarkan UI diam (spinner/empty state selamanya).
  // Endpoint auth/login/callback dikecualikan (401-nya memang alur normal).
  if (
    res.status === 401 &&
    typeof window !== 'undefined' &&
    !path.startsWith('/auth/')
  ) {
    const { clearAuthSession } = await import('./auth');
    clearAuthSession();
    window.location.href = '/login';
  }

  return res;
};
