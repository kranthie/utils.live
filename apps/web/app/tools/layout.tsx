import type { ReactNode } from "react";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";

interface ToolsLayoutProps {
  children: ReactNode;
}

export default function ToolsLayout({
  children,
}: ToolsLayoutProps): React.ReactElement {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main
        id="main-content"
        className="container flex-1 px-4 py-6 sm:px-6 sm:py-8"
      >
        {children}
      </main>
      <Footer />
    </div>
  );
}
