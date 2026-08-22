import type { Metadata } from "next";
import Navbar from "@/components/clipforge/Navbar";
import Hero from "@/components/clipforge/Hero";
import DemoVideo from "@/components/clipforge/DemoVideo";
import HowItWorks from "@/components/clipforge/HowItWorks";
import Features from "@/components/clipforge/Features";
import Pricing from "@/components/clipforge/Pricing";
import Faq from "@/components/clipforge/Faq";
import CtaFooter from "@/components/clipforge/CtaFooter";

export const metadata: Metadata = {
  title: "ClipForge AI · Auto Viral Clipping",
  description: "Ubah video panjang (YouTube, podcast, webinar) menjadi puluhan klip 9:16 viral siap upload ke TikTok/Reels/Shorts. Auto-clipping AI + subtitle Hormozi.",
};

export default function Home() {
  return (
    <div className="min-h-screen bg-[#05060B] text-white selection:bg-purple-500 selection:text-white">
      <Navbar />
      <main>
        <Hero />
        <DemoVideo />
        <HowItWorks />
        <Features />
        <Pricing />
        <Faq />
        <CtaFooter />
      </main>
    </div>
  );
}
