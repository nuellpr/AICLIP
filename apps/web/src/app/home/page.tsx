import type { Metadata } from "next";
import Navbar from "@/components/clipforge/Navbar";
import Hero from "@/components/clipforge/Hero";
import DemoVideo from "@/components/clipforge/DemoVideo";
import HowItWorks from "@/components/clipforge/HowItWorks";
import Features from "@/components/clipforge/Features";
import Pricing from "@/components/clipforge/Pricing";
import Faq from "@/components/clipforge/Faq";
import CtaFooter from "@/components/clipforge/CtaFooter";
import ScrollProgress from "@/components/clipforge/ScrollProgress";
import Marquee from "@/components/clipforge/Marquee";
import SocialProof from "@/components/clipforge/SocialProof";

export const metadata: Metadata = {
  title: "ClipForge AI · Auto Viral Clipping",
  description: "Ubah video panjang (YouTube, podcast, webinar) menjadi puluhan klip 9:16 viral siap upload ke TikTok/Reels/Shorts. Auto-clipping AI + subtitle Hormozi.",
};

export default function Home() {
  return (
    <div className="min-h-screen bg-[var(--db-panel)] text-[var(--ink)] selection:bg-[#EA4C89] selection:text-white">
      <ScrollProgress />
      <Navbar />
      <main>
        <Hero />
        <DemoVideo />
        <HowItWorks />
        <Features />
        <Marquee />
        <SocialProof />
        <Pricing />
        <Faq />
        <CtaFooter />
      </main>
    </div>
  );
}
