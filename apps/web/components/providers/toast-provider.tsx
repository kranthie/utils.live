"use client";

import { Toaster } from "@/components/ui/sonner";

export function ToastProvider(): React.ReactElement {
  return <Toaster position="bottom-right" richColors closeButton />;
}
