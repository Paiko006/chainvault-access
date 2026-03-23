import { Navbar } from "@/components/landing/Navbar";
import { PricingSection } from "@/components/landing/PricingSection";
import { SocialProof } from "@/components/landing/SocialProof";
import { Footer } from "@/components/landing/Footer";
import { Particles } from "@/components/ui/particles";

const PricingPage = () => {
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
      <PricingSection />
      <SocialProof />
      <Footer />
    </div>
  );
};

export default PricingPage;
