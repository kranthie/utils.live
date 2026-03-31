import type { ReactNode } from "react";
import { setRequestLocale } from "next-intl/server";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";

interface ToolsLayoutProps {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}

export default async function ToolsLayout({
  children,
  params,
}: ToolsLayoutProps): Promise<React.ReactElement> {
  const { locale } = await params;
  setRequestLocale(locale);

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
