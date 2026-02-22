"use client";

import { motion } from "framer-motion";
import { Zap, Shield, Globe, Sparkles } from "lucide-react";
import { fadeInUp, staggerContainer, VIEWPORT_ONCE } from "@/lib/animation";
import { cn } from "@/lib/utils";

function getFeatures(
  toolCountLabel: string
): { icon: typeof Zap; title: string; description: string }[] {
  return [
    {
      icon: Zap,
      title: "Instant Results",
      description:
        "Client-side tools run in your browser with zero latency. No waiting, no server round-trips.",
    },
    {
      icon: Shield,
      title: "Privacy First",
      description:
        "Your data never leaves your device. We don\u2019t track, store, or analyze your tool inputs.",
    },
    {
      icon: Globe,
      title: "Free & Open Source",
      description:
        "Every tool is completely free to use. No accounts, no paywalls, no usage limits. Fully open source.",
    },
    {
      icon: Sparkles,
      title: `${toolCountLabel} Tools`,
      description:
        "A comprehensive collection of developer utilities — from JSON formatting to image processing.",
    },
  ];
}

interface FeatureCardsProps {
  toolCountLabel: string;
  className?: string;
}

export function FeatureCards({
  toolCountLabel,
  className,
}: FeatureCardsProps): React.ReactElement {
  const FEATURES = getFeatures(toolCountLabel);
  return (
    <section className={cn("bg-muted/30 border-t py-12 sm:py-16", className)}>
      <div className="container">
        <p className="text-brand mb-3 text-center text-xs font-semibold tracking-widest uppercase">
          Why utils.live
        </p>
        <motion.h2
          className="mb-8 text-center text-2xl font-bold sm:text-3xl"
          variants={fadeInUp}
          initial="hidden"
          whileInView="visible"
          viewport={VIEWPORT_ONCE}
        >
          Why developers choose utils.live
        </motion.h2>
        <motion.div
          className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4"
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={VIEWPORT_ONCE}
        >
          {FEATURES.map((feature) => (
            <motion.div
              key={feature.title}
              variants={fadeInUp}
              className="text-center"
            >
              <div className="bg-brand/10 mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl">
                <feature.icon className="text-brand h-8 w-8" />
              </div>
              <h3 className="mb-2 text-lg font-semibold">{feature.title}</h3>
              <p className="text-muted-foreground">{feature.description}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
