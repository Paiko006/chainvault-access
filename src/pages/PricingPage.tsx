import { Navbar } from "@/components/landing/Navbar";
import { PricingSection } from "@/components/landing/PricingSection";
import { SocialProof } from "@/components/landing/SocialProof";
import { Footer } from "@/components/landing/Footer";

const PricingPage = () => {
  return (
    <div className="min-h-screen bg-background text-foreground pt-16">
      <Navbar />
      <PricingSection />
      <SocialProof />
      <Footer />
    </div>
  );
};

export default PricingPage;
