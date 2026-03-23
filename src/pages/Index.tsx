import { Navbar } from "@/components/landing/Navbar";
import { HeroSection } from "@/components/landing/HeroSection";
import GlobeDemo from "@/components/globe-demo";
import { FeaturesSection } from "@/components/landing/FeaturesSection";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { PreviewSection } from "@/components/landing/PreviewSection";
import { PricingSection } from "@/components/landing/PricingSection";
import { SocialProof } from "@/components/landing/SocialProof";
import { Footer } from "@/components/landing/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <HeroSection />
      <GlobeDemo />
      <FeaturesSection />
      <HowItWorks />
      <PreviewSection />
      <PricingSection />
      <SocialProof />
      <Footer />
    </div>
  );
};

export default Index;
