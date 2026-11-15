"use client";

import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import TrustStrip from "@/components/TrustStrip";
import AboutSection from "@/components/AboutSection";
import { LandingContentProvider } from "@/components/LandingContentProvider";

export function MainWebBackdrop() {
  return (
    <div
      className="pointer-events-none fixed inset-[-30px] z-0 select-none overflow-hidden"
      style={{
        filter: "blur(14px) brightness(0.68) saturate(1.2)",
        transform: "scale(1.03)",
      }}
      aria-hidden="true"
      inert
    >
      <LandingContentProvider content={null}>
        <div className="min-h-screen bg-[#FEFDF5] text-[#1E1B18] font-sans antialiased">
          <Navbar />
          <Hero />
          <TrustStrip />
          <AboutSection />
        </div>
      </LandingContentProvider>
    </div>
  );
}
