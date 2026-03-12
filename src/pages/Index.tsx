import { Navbar } from "@/components/landing/Navbar";
import { HeroSection } from "@/components/landing/HeroSection";
import { FeaturesSection } from "@/components/landing/FeaturesSection";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { PreviewSection } from "@/components/landing/PreviewSection";
import { SocialProof } from "@/components/landing/SocialProof";
import { Footer } from "@/components/landing/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <HeroSection />
      <FeaturesSection />
      <HowItWorks />
      <PreviewSection />
      <SocialProof />
      <Footer />
    </div>
  );
};

export default Index;
