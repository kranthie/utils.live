import { Link } from "@/i18n/navigation";
import { Terminal } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { cn } from "@/lib/utils";

interface FooterProps {
  className?: string;
}

const GITHUB_URL = "https://github.com/kranthie/utils.live";

export async function Footer({
  className,
}: FooterProps): Promise<React.ReactElement> {
  const t = await getTranslations("footer");

  const FOOTER_LINKS = {
    product: [
      { label: t("links.allTools"), href: "/tools" },
      { label: t("links.blog"), href: "/blog" },
    ],
    company: [
      { label: t("links.about"), href: "/about" },
      { label: t("links.contact"), href: "/contact" },
    ],
    community: [
      { label: t("links.github"), href: GITHUB_URL },
      { label: t("links.reportIssue"), href: `${GITHUB_URL}/issues` },
    ],
  };

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
              {t("tagline")}
            </p>
          </div>

          {/* Product links */}
          <div>
            <h2 className="mb-4 text-base font-semibold">
              {t("sections.product")}
            </h2>
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
            <h2 className="mb-4 text-base font-semibold">
              {t("sections.company")}
            </h2>
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
            <h2 className="mb-4 text-base font-semibold">
              {t("sections.community")}
            </h2>
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
