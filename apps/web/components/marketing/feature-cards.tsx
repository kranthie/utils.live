"use client";

import { m } from "framer-motion";
import { Zap, Shield, Globe, Sparkles } from "lucide-react";
import { useTranslations } from "next-intl";
import { fadeInUp, staggerContainer, VIEWPORT_ONCE } from "@/lib/animation";
import { cn } from "@/lib/utils";

interface FeatureCardsProps {
  toolCountLabel: string;
  className?: string;
}

export function FeatureCards({
  toolCountLabel,
  className,
}: FeatureCardsProps): React.ReactElement {
  const t = useTranslations("home.features");

  const FEATURES = [
    {
      icon: Zap,
      title: t("instantResults.title"),
      description: t("instantResults.description"),
    },
    {
      icon: Shield,
      title: t("privacyFirst.title"),
      description: t("privacyFirst.description"),
    },
    {
      icon: Globe,
      title: t("freeOpenSource.title"),
      description: t("freeOpenSource.description"),
    },
    {
      icon: Sparkles,
      title: t("toolsCount.title", { toolCountLabel }),
      description: t("toolsCount.description"),
    },
  ];

  return (
    <section className={cn("bg-muted/30 border-t py-12 sm:py-16", className)}>
      <div className="container">
        <p className="text-brand mb-3 text-center text-xs font-semibold tracking-widest uppercase">
          {t("eyebrow")}
        </p>
        <m.h2
          className="mb-8 text-center text-2xl font-bold sm:text-3xl"
          variants={fadeInUp}
          initial="hidden"
          whileInView="visible"
          viewport={VIEWPORT_ONCE}
        >
          {t("heading")}
        </m.h2>
        <m.div
          className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4"
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={VIEWPORT_ONCE}
        >
          {FEATURES.map((feature) => (
            <m.div
              key={feature.title}
              variants={fadeInUp}
              className="text-center"
            >
              <div className="bg-brand/10 mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl">
                <feature.icon className="text-brand h-8 w-8" />
              </div>
              <h3 className="mb-2 text-lg font-semibold">{feature.title}</h3>
              <p className="text-muted-foreground">{feature.description}</p>
            </m.div>
          ))}
        </m.div>
      </div>
    </section>
  );
}
