import { motion } from "framer-motion";
import { Shield, HardDrive, Link2, EyeOff } from "lucide-react";

const features = [
  {
    icon: Shield,
    title: "Wallet-Protected Encryption",
    description: "Your file security is tied to your Aptos wallet signature. Only you hold the decryption key.",
  },
  {
    icon: HardDrive,
    title: "Decentralized Storage",
    description: "Data is stored across the global Shelby network. Secure, permanent, and always available.",
  },
  {
    icon: Link2,
    title: "Cross-Device Synchronization",
    description: "Access your file history and storage quota automatically on any device once connected.",
  },
  {
    icon: EyeOff,
    title: "Privacy-First Control",
    description: "Complete control over your privacy. Manage data ownership without third-party intermediaries.",
  },
];

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1 } },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

export function FeaturesSection() {
  return (
    <section id="features" className="py-24 px-4">
      <div className="container max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Premium <span className="gradient-text">Web3 Security</span>
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Enterprise-grade file security powered by decentralized blockchain technology.
          </p>
        </div>

        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-100px" }}
        >
          {features.map((f) => (
            <motion.div
              key={f.title}
              variants={item}
              className="glass-card p-6 group hover:glow-sm transition-all duration-300"
            >
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                <f.icon className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2 text-foreground">{f.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{f.description}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
