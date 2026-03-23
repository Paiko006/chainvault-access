import { Navbar } from "@/components/landing/Navbar";
import { FeaturesSection } from "@/components/landing/FeaturesSection";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { PreviewSection } from "@/components/landing/PreviewSection";
import { Footer } from "@/components/landing/Footer";
import { Particles } from "@/components/ui/particles";

const FeaturesPage = () => {
  return (
    <div className="min-h-screen bg-transparent text-foreground pt-16 relative">
      <div className="fixed inset-0 bg-black -z-20 pointer-events-none" />
      <Particles 
        particleCount={800}
        particleSpread={10}
        speed={0.1}
        particleColors={['#ffffff', '#4cc9f0', '#7cff67']}
        moveParticlesOnHover={true}
        particleHoverFactor={1.5}
        alphaParticles={true}
        particleBaseSize={140}
        className="-z-10"
      />
      <Navbar />
      <FeaturesSection />
      <HowItWorks />
      <PreviewSection />
      <Footer />
    </div>
  );
};

export default FeaturesPage;
