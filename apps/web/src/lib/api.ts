export const getApiUrl = (path: string): string => {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `http://127.0.0.1:3001${cleanPath}`;
};
