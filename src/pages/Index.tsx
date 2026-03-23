import { Navbar } from "@/components/landing/Navbar";
import { HeroSection } from "@/components/landing/HeroSection";
import GlobeDemo from "@/components/globe-demo";
import { Footer } from "@/components/landing/Footer";
import { Particles } from "@/components/ui/particles";

const Index = () => {
  return (
    <div className="min-h-screen bg-black text-foreground relative">
      <Particles 
        particleCount={300}
        particleSpread={10}
        speed={0.1}
        particleColors={['#ffffff', '#4cc9f0', '#7cff67']}
        moveParticlesOnHover={true}
        particleHoverFactor={1.5}
        alphaParticles={true}
      />
      <Navbar />
      <HeroSection />
      <GlobeDemo />
      <Footer />
    </div>
  );
};

export default Index;
