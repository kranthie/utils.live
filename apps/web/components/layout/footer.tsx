import Link from "next/link";
import { Terminal } from "lucide-react";
import { cn } from "@/lib/utils";

interface FooterProps {
  className?: string;
}

const GITHUB_URL = "https://github.com/kranthie/utils.live";

const FOOTER_LINKS = {
  product: [
    { label: "All Tools", href: "/tools" },
    { label: "Blog", href: "/blog" },
  ],
  company: [
    { label: "About", href: "/about" },
    { label: "Contact", href: "/contact" },
  ],
  community: [
    { label: "GitHub", href: GITHUB_URL },
    { label: "Report Issue", href: `${GITHUB_URL}/issues` },
  ],
};

export function Footer({ className }: FooterProps): React.ReactElement {
  return (
    <footer className={cn("bg-muted/30 border-t", className)}>
      <div className="container mx-auto px-4 py-8 md:py-10">
        {/* Main footer content */}
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4 lg:gap-12">
          {/* Brand column */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="mb-4 flex items-center gap-2">
              <Terminal className="text-brand h-6 w-6" />
              <span className="text-xl font-bold">utils.live</span>
            </Link>
            <p className="text-muted-foreground mb-4 max-w-xs text-sm">
              Free, open-source developer utilities for encoding, conversion,
              formatting, and more.
            </p>
          </div>

          {/* Product links */}
          <div>
            <h2 className="mb-4 text-base font-semibold">Product</h2>
            <ul className="space-y-3">
              {FOOTER_LINKS.product.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-muted-foreground hover:text-foreground text-sm transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company links */}
          <div>
            <h2 className="mb-4 text-base font-semibold">Company</h2>
            <ul className="space-y-3">
              {FOOTER_LINKS.company.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-muted-foreground hover:text-foreground text-sm transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Community links */}
          <div>
            <h2 className="mb-4 text-base font-semibold">Community</h2>
            <ul className="space-y-3">
              {FOOTER_LINKS.community.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-sm transition-colors"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </footer>
  );
}
