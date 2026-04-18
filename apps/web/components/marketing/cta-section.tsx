"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { Link } from "@/i18n/navigation";
import { Search, ArrowRight } from "lucide-react";
import { m, useInView } from "framer-motion";
import { useTranslations } from "next-intl";
import { useKeyboard } from "@/components/providers/keyboard-provider";
import { fadeInUp, staggerContainer, VIEWPORT_ONCE } from "@/lib/animation";
import { cn } from "@/lib/utils";

function useCountUp(
  target: number,
  duration: number = 2000
): { count: number; start: () => void } {
  const [count, setCount] = useState(0);
  const startedRef = useRef(false);

  const start = useCallback((): void => {
    if (startedRef.current) return;
    startedRef.current = true;

    const startTime = performance.now();

    const tick = (now: number): void => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(eased * target));

      if (progress < 1) {
        requestAnimationFrame(tick);
      }
    };

    requestAnimationFrame(tick);
  }, [target, duration]);

  return { count, start };
}

interface CTASectionProps {
  toolCount: number;
  categoryCount: number;
  className?: string;
}

export function CTASection({
  toolCount,
  categoryCount,
  className,
}: CTASectionProps): React.ReactElement {
  const t = useTranslations("home.cta");
  const { setSearchOpen } = useKeyboard();
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  const toolCounter = useCountUp(toolCount);
  const categoryCounter = useCountUp(categoryCount);

  useEffect(() => {
    if (isInView) {
      toolCounter.start();
      categoryCounter.start();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only trigger on isInView
  }, [isInView]);

  return (
    <section ref={ref} className={cn("py-12 sm:py-16", className)}>
      <div className="container">
        <m.div
          className="mx-auto max-w-3xl text-center"
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={VIEWPORT_ONCE}
        >
          {/* Inline stats */}
          <m.div
            className="mb-6 flex items-center justify-center gap-8 sm:gap-12"
            variants={fadeInUp}
          >
            <div className="text-center">
              <div
                className="text-brand text-3xl font-bold sm:text-4xl"
                style={{ fontVariantNumeric: "tabular-nums" }}
              >
                {toolCounter.count}+
              </div>
              <div className="text-muted-foreground text-sm">
                {t("toolsLabel")}
              </div>
            </div>
            <div className="bg-border h-8 w-px" />
            <div className="text-center">
              <div
                className="text-brand text-3xl font-bold sm:text-4xl"
                style={{ fontVariantNumeric: "tabular-nums" }}
              >
                {categoryCounter.count}
              </div>
              <div className="text-muted-foreground text-sm">
                {t("categoriesLabel")}
              </div>
            </div>
            <div className="bg-border h-8 w-px" />
            <div className="text-center">
              <div className="text-brand text-3xl font-bold sm:text-4xl">
                100%
              </div>
              <div className="text-muted-foreground text-sm">
                {t("freeLabel")}
              </div>
            </div>
          </m.div>

          <m.h2 className="text-2xl font-bold sm:text-3xl" variants={fadeInUp}>
            {t("heading", { toolCount })}
          </m.h2>
          <m.p
            className="text-muted-foreground mt-3 text-lg"
            variants={fadeInUp}
          >
            {t("subheading")}
          </m.p>

          <m.div
            className="mt-6 flex flex-col items-center gap-4 sm:flex-row sm:justify-center"
            variants={fadeInUp}
          >
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              className="bg-brand hover:bg-brand/90 inline-flex items-center gap-2 rounded-lg px-6 py-3 font-medium text-white transition-colors"
            >
              <Search className="h-5 w-5" />
              {t("searchToolsButton")}
            </button>
            <Link
              href="/tools"
              className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 font-medium transition-colors"
            >
              {t("browseAllTools")}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </m.div>
        </m.div>
      </div>
    </section>
  );
}
