"use client";

import { LazyMotion, domAnimation } from "framer-motion";
import type { ReactNode } from "react";

/**
 * Lazily loads the framer-motion DOM animation feature set (~28 KB vs. the
 * ~120 KB full bundle you get when consumers use `motion.*` eagerly) and
 * exposes the `m.*` shortcut components to children.
 *
 * Use this once around any subtree whose components import `m` from
 * framer-motion. Keep `strict` on: it surfaces cases where a consumer used
 * `motion.*` (which requires the full feature set) instead of `m.*`.
 */
export function MotionProvider({
  children,
}: {
  children: ReactNode;
}): React.ReactElement {
  return (
    <LazyMotion features={domAnimation} strict>
      {children}
    </LazyMotion>
  );
}
