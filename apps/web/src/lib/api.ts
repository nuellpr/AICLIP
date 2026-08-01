export const getApiUrl = (path: string): string => {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  if (typeof window !== 'undefined') {
    const base = (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/+$/, '');
    if (base.endsWith('/api') && cleanPath.startsWith('/api/')) {
      return `${base}${cleanPath.substring(4)}`;
    }
    return `${base}${cleanPath}`;
  }
  return `http://127.0.0.1:3001${cleanPath}`;
};
