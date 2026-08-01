export const getApiUrl = (path: string): string => {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  if (typeof window !== 'undefined') {
    return `${process.env.NEXT_PUBLIC_API_URL || ''}${cleanPath}`;
  }
  return `http://127.0.0.1:3001${cleanPath}`;
};
