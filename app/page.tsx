import { Navigation } from "@/components/Navigation";
import { Hero } from "@/components/Hero";
import { Problem } from "@/components/Problem";
import { NetworkStory } from "@/components/NetworkStory";
import { Capabilities } from "@/components/Capabilities";
import { ProductDemo } from "@/components/ProductDemo";
import { ScaleUseCases } from "@/components/ScaleUseCases";
import { IntelligenceCTA } from "@/components/IntelligenceCTA";

export default function Home() {
  return (
    <main>
      <Navigation />
      <Hero />
      <Problem />
      <NetworkStory />
      <Capabilities />
      <ProductDemo />
      <ScaleUseCases />
      <IntelligenceCTA />
    </main>
  );
}