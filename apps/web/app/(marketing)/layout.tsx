import type { Metadata } from "next";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { getToolCountLabel } from "@/lib/tools/get-tool";

const toolCountLabel = getToolCountLabel();

export const metadata: Metadata = {
  title: {
    template: "%s | utils.live",
    default: "utils.live - Developer Utilities Platform",
  },
  description: `${toolCountLabel} developer tools for text encoding, data conversion, code formatting, and more. Fast, free, and privacy-focused.`,
};

interface MarketingLayoutProps {
  children: React.ReactNode;
}

export default function MarketingLayout({
  children,
}: MarketingLayoutProps): React.ReactElement {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main id="main-content" className="flex-1">
        {children}
      </main>
      <Footer />
    </div>
  );
}
