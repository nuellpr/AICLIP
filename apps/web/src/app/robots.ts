import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/home", "/klipchip"],
        disallow: ["/dashboard", "/login", "/api"],
      },
    ],
    sitemap: "https://forgeai.web.id/sitemap.xml",
  };
}
