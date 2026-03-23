import { Check, Zap, Shield, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

export const QUOTA_STORAGE_KEY = "chainvault_quota";
export const DEFAULT_QUOTA = 5 * 1024 * 1024 * 1024; // 5 GB

const plans = [
  {
    name: "Starter",
    price: "0",
    storage: "5 GB",
    description: "Ideal for individual private documents and passwords.",
    features: [
      "5 GB Decentralized Storage",
      "AES-256 Client-side Encryption",
      "Shelby Network Access",
      "Basic Support"
    ],
    icon: Shield,
    color: "text-muted-foreground",
    active: false
  },
  {
    name: "Pro Vault",
    price: "1",
    storage: "50 GB",
    description: "For power users storing media and larger encrypted archives.",
    features: [
      "50 GB Premium Storage",
      "Multi-device Synchronization",
      "Advanced Access Control",
      "Priority Network Bandwidth",
      "Direct Support"
    ],
    icon: Zap,
    color: "text-primary",
    active: true,
    highlight: true
  },
  {
    name: "Enterprise",
    price: "5",
    storage: "500 GB",
    description: "Maximum security and capacity for teams and organizations.",
    features: [
      "500 GB Dedicated Storage",
      "Custom Encryption Policies",
      "Full API Access",
      "Whitelabel Sharing Pages",
      "24/7 Dedicated Support"
    ],
    icon: Crown,
    color: "text-accent",
    active: false
  }
];

export function PricingSection() {
  const navigate = useNavigate();

  const handleUpgrade = (plan: typeof plans[0]) => {
    if (plan.price === "0") {
      navigate("/dashboard");
      return;
    }

    // Calculate bytes
    const gb = parseInt(plan.storage);
    const bytes = gb * 1024 * 1024 * 1024;
    
    localStorage.setItem(QUOTA_STORAGE_KEY, bytes.toString());
    toast.success(`Berhasil upgrade ke ${plan.name}! Kapasitas Anda sekarang ${plan.storage}. 🚀`);
    
    setTimeout(() => {
      navigate("/dashboard");
    }, 1500);
  };

  return (
    <section id="pricing" className="py-24 relative overflow-hidden">
      {/* Background Glows */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-primary/5 blur-[120px] rounded-full pointer-events-none" />
      
      <div className="container px-4 mx-auto relative z-10">
        <div className="max-w-3xl mx-auto text-center mb-16">
          <h2 className="text-[10px] uppercase tracking-[0.2em] font-black text-primary mb-4">Pricing Plans</h2>
          <h3 className="text-3xl md:text-5xl font-bold mb-6">
            Penyimpanan Aman, <span className="gradient-text">Harga Transparan</span>
          </h3>
          <p className="text-muted-foreground text-lg">
            Upgrade kapasitas vault Anda secara permanen di jaringan Shelby menggunakan token $APT.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`glass-card p-8 rounded-2xl flex flex-col relative transition-all duration-500 hover:glow-sm group ${plan.highlight ? 'border-primary/40 ring-1 ring-primary/20 scale-105 z-10' : 'border-border/40'}`}
            >
              {plan.highlight && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary text-white text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest shadow-lg shadow-primary/20">
                  Paling Populer
                </div>
              )}

              <div className="flex items-center gap-4 mb-6">
                <div className={`h-12 w-12 rounded-xl bg-white/5 flex items-center justify-center ${plan.color}`}>
                  <plan.icon className="h-6 w-6" />
                </div>
                <div>
                  <h4 className="font-bold text-xl">{plan.name}</h4>
                  <div className="text-muted-foreground text-xs uppercase tracking-widest font-bold">{plan.storage}</div>
                </div>
              </div>

              <div className="mb-8">
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  <span className="text-xl font-bold text-primary">$APT</span>
                  {plan.price !== "0" && <span className="text-muted-foreground text-sm">/ bulan</span>}
                </div>
                <p className="text-muted-foreground text-sm mt-3 leading-relaxed">
                  {plan.description}
                </p>
              </div>

              <div className="space-y-4 mb-10 flex-1">
                {plan.features.map((feature) => (
                  <div key={feature} className="flex items-start gap-3">
                    <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                      <Check className="h-3 w-3 text-primary" />
                    </div>
                    <span className="text-sm text-muted-foreground/90">{feature}</span>
                  </div>
                ))}
              </div>

              <Button
                variant={plan.highlight ? "hero" : "outline"}
                className={`w-full py-6 rounded-xl font-bold uppercase tracking-widest text-[11px] transition-all group-hover:scale-[1.02] ${!plan.highlight ? 'hover:bg-white/5' : ''}`}
                onClick={() => handleUpgrade(plan)}
              >
                {plan.price === "0" ? "Mulai Gratis" : "Upgrade Sekarang"}
              </Button>
            </div>
          ))}
        </div>

        <div className="mt-16 glass-card p-8 rounded-2xl border-dashed border-2 border-border/50 text-center max-w-2xl mx-auto">
          <p className="text-sm text-muted-foreground">
            Butuh kapasitas lebih dari 500 GB untuk kebutuhan korporat? 
            <a href="#" className="mx-1 text-primary hover:underline font-bold">Hubungi Tim Shelby</a> 
            untuk solusi penyimpanan kustom.
          </p>
        </div>
      </div>
    </section>
  );
}
