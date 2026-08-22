import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "ClipForge AI - Auto Viral Clipping",
    short_name: "ClipForge",
    description: "Ubah Video Panjang Menjadi Klip Viral dalam Hitungan Menit.",
    start_url: "/home",
    display: "standalone",
    background_color: "#05060B",
    theme_color: "#2563EB",
    icons: [
      { src: "/logo.svg", sizes: "any", type: "image/svg+xml" },
    ],
  };
}
