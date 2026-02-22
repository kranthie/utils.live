import type { Transition } from "framer-motion";

// Spring configs mirroring Remotion's packages/video/src/config/timing.ts
export const SPRING_STANDARD: Transition = {
  type: "spring",
  damping: 12,
  stiffness: 80,
  mass: 1,
};

export const SPRING_SNAPPY: Transition = {
  type: "spring",
  damping: 10,
  stiffness: 100,
  mass: 1,
};

export const SPRING_GENTLE: Transition = {
  type: "spring",
  damping: 15,
  stiffness: 60,
  mass: 1,
};

export const SPRING_BOUNCY: Transition = {
  type: "spring",
  damping: 8,
  stiffness: 80,
  mass: 1,
};

export const VIEWPORT_ONCE = { once: true, margin: "-100px" as const };

export const STAGGER_DELAY = 0.08;
