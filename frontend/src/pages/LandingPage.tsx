import { useRef } from "react";
import { useReveal, useScrollMotion } from "@/hooks/useMotion";
import { LandingNav } from "@/components/landing/LandingNav";
import { LandingHero } from "@/components/landing/LandingHero";
import { LandingMarquee } from "@/components/landing/LandingMarquee";
import { LandingStats } from "@/components/landing/LandingStats";
import { LandingFeatures } from "@/components/landing/LandingFeatures";
import { LandingAgentDemo } from "@/components/landing/LandingAgentDemo";
import { LandingLiveTruth } from "@/components/landing/LandingLiveTruth";
import { LandingFlow } from "@/components/landing/LandingFlow";
import { LandingRoles } from "@/components/landing/LandingRoles";
import { LandingCta } from "@/components/landing/LandingCta";

export default function LandingPage() {
  const hostRef = useRef<HTMLDivElement>(null);
  const lifted = useScrollMotion(hostRef);
  useReveal(hostRef);

  return (
    <div
      ref={hostRef}
      className="scroll-host h-full overflow-x-hidden overflow-y-auto scroll-smooth bg-paper"
    >
      <div aria-hidden className="grain pointer-events-none fixed inset-0 -z-10 bg-paper" />
      <LandingNav lifted={lifted} />
      <main className="relative">
        <LandingHero />
        <LandingMarquee />
        <LandingStats />
        <LandingFeatures />
        <LandingAgentDemo />
        <LandingLiveTruth />
        <LandingFlow />
        <LandingRoles />
        <LandingCta />
      </main>
    </div>
  );
}