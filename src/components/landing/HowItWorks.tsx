import { motion } from "framer-motion";
import { Upload, Wallet, Link2 } from "lucide-react";

const steps = [
  { icon: Upload, title: "Upload File", description: "Drag and drop your file into the secure uploader." },
  { icon: Wallet, title: "Set Wallet Access", description: "Define which wallet addresses can access the file." },
  { icon: Link2, title: "Share Secure Link", description: "Share the encrypted link. Only authorized wallets can open it." },
];

export function HowItWorks() {
  return (
    <section className="py-24 px-4 border-t border-border/30">
      <div className="container max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">How It Works</h2>
          <p className="text-muted-foreground">Three steps to decentralized file security.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {steps.map((step, i) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15, duration: 0.5 }}
              className="text-center"
            >
              <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center mx-auto mb-5">
                <step.icon className="h-7 w-7 text-accent" />
              </div>
              <div className="text-sm font-medium text-accent mb-2">Step {i + 1}</div>
              <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
              <p className="text-muted-foreground text-sm">{step.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
