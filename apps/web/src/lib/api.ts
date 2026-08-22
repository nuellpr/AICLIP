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

export const apiFetch = (path: string, options: RequestInit = {}): Promise<Response> => {
  const headers = new Headers(options.headers);
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('clipforge_token');
    if (token) headers.set('Authorization', `Bearer ${token}`);
  }
  if (options.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  return fetch(getApiUrl(path), { ...options, headers });
};
