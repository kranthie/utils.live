import type { Metadata } from "next";
import { Link } from "@/i18n/navigation";
import { Clock, MapPin } from "lucide-react";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { ContactForm } from "@/components/forms/contact-form";

interface ContactPageProps {
  params: Promise<{ locale: string }>;
}

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Get in touch with the utils.live team. We'd love to hear from you about features, bugs, or partnerships.",
  openGraph: {
    title: "Contact | utils.live",
    description:
      "Get in touch with the utils.live team. We'd love to hear from you.",
  },
  alternates: {
    canonical: "https://utils.live/contact",
  },
};

export default async function ContactPage({
  params,
}: ContactPageProps): Promise<React.ReactElement> {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("marketing.contact");

  const CONTACT_INFO = [
    {
      icon: Clock,
      title: t("info.responseTime.title"),
      value: t("info.responseTime.value"),
      description: t("info.responseTime.description"),
    },
    {
      icon: MapPin,
      title: t("info.location.title"),
      value: t("info.location.value"),
      description: t("info.location.description"),
    },
  ];

  return (
    <div className="container py-16 sm:py-24">
      {/* Header */}
      <div className="mx-auto mb-12 max-w-2xl text-center">
        <h1 className="mb-4 text-3xl font-bold sm:text-4xl">
          {t("hero.heading")}
        </h1>
        <p className="text-muted-foreground text-lg">{t("hero.description")}</p>
      </div>

      <div className="mx-auto max-w-5xl">
        <div className="grid gap-12 lg:grid-cols-5">
          {/* Contact Info */}
          <div className="space-y-8 lg:col-span-2">
            {CONTACT_INFO.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.title} className="flex gap-4">
                  <div className="bg-muted flex h-10 w-10 shrink-0 items-center justify-center rounded-lg">
                    <Icon className="text-muted-foreground h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-medium">{item.title}</h3>
                    <p className="text-primary text-sm">{item.value}</p>
                    <p className="text-muted-foreground text-xs">
                      {item.description}
                    </p>
                  </div>
                </div>
              );
            })}

            {/* Tools Link */}
            <div className="bg-muted/30 rounded-lg p-4">
              <h3 className="mb-2 font-medium">
                {t("lookingForTool.heading")}
              </h3>
              <p className="text-muted-foreground text-sm">
                Browse our{" "}
                <Link href="/tools" className="text-primary hover:underline">
                  {t("lookingForTool.linkText")}
                </Link>
                .
              </p>
            </div>
          </div>

          {/* Contact Form */}
          <div className="lg:col-span-3">
            <div className="rounded-lg border p-6 sm:p-8">
              <h2 className="mb-6 text-xl font-semibold">
                {t("form.heading")}
              </h2>
              <ContactForm />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
