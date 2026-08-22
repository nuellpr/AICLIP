import type { MetadataRoute } from "next";

const BASE = "https://forgeai.web.id";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    { url: `${BASE}/`, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${BASE}/home`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${BASE}/klipchip`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${BASE}/login`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
  ];
}
