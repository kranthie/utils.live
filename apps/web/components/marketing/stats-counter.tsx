"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { motion, useInView } from "framer-motion";
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

interface StatCardProps {
  value: string;
  label: string;
  onVisible?: () => void;
}

function StatCard({
  value,
  label,
  onVisible,
}: StatCardProps): React.ReactElement {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  useEffect(() => {
    if (isInView && onVisible) {
      onVisible();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- onVisible is stable (useCallback)
  }, [isInView]);

  return (
    <motion.div ref={ref} variants={fadeInUp}>
      <div className="bg-card rounded-2xl p-8 text-center">
        <div
          className="text-brand text-5xl font-bold tracking-tight sm:text-6xl"
          style={{ fontVariantNumeric: "tabular-nums" }}
        >
          {value}
        </div>
        <div className="text-muted-foreground mt-2 text-lg">{label}</div>
      </div>
    </motion.div>
  );
}

interface StatsCounterProps {
  toolCount: number;
  categoryCount: number;
  className?: string;
}

export function StatsCounter({
  toolCount,
  categoryCount,
  className,
}: StatsCounterProps): React.ReactElement {
  const toolCounter = useCountUp(toolCount);
  const categoryCounter = useCountUp(categoryCount);

  return (
    <section className={cn("py-16 sm:py-20", className)}>
      <div className="container">
        <motion.div
          className="grid gap-6 sm:grid-cols-3"
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={VIEWPORT_ONCE}
        >
          <StatCard
            value={`${toolCounter.count}+`}
            label="Developer Tools"
            onVisible={toolCounter.start}
          />
          <StatCard
            value={`${categoryCounter.count}`}
            label="Categories"
            onVisible={categoryCounter.start}
          />
          <StatCard value="100%" label="Free Forever" />
        </motion.div>
      </div>
    </section>
  );
}
