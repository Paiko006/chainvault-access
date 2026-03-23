import { Navbar } from "@/components/landing/Navbar";
import { FeaturesSection } from "@/components/landing/FeaturesSection";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { PreviewSection } from "@/components/landing/PreviewSection";
import { Footer } from "@/components/landing/Footer";

const FeaturesPage = () => {
  return (
    <div className="min-h-screen bg-background text-foreground pt-16">
      <Navbar />
      <FeaturesSection />
      <HowItWorks />
      <PreviewSection />
      <Footer />
    </div>
  );
};

export default FeaturesPage;
