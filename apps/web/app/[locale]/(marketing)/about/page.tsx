import type { Metadata } from "next";
import { Zap, Shield, Code, Globe, Users, Heart } from "lucide-react";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { getToolCountLabel } from "@/lib/tools/get-tool";

interface AboutPageProps {
  params: Promise<{ locale: string }>;
}

export const metadata: Metadata = {
  title: "About",
  description:
    "Learn about utils.live - our mission to make developer tools accessible, fast, and privacy-focused.",
  openGraph: {
    title: "About | utils.live",
    description:
      "Learn about utils.live - our mission to make developer tools accessible, fast, and privacy-focused.",
  },
  alternates: {
    canonical: "https://utils.live/about",
  },
};

export default async function AboutPage({
  params,
}: AboutPageProps): Promise<React.ReactElement> {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("marketing.about");

  const VALUES = [
    {
      icon: Zap,
      title: t("values.speedFirst.title"),
      description: t("values.speedFirst.description"),
    },
    {
      icon: Shield,
      title: t("values.privacyByDesign.title"),
      description: t("values.privacyByDesign.description"),
    },
    {
      icon: Code,
      title: t("values.developerExperience.title"),
      description: t("values.developerExperience.description"),
    },
    {
      icon: Globe,
      title: t("values.freeAccessible.title"),
      description: t("values.freeAccessible.description"),
    },
  ];

  const STATS = [
    { value: getToolCountLabel(), label: t("stats.developerTools") },
    { value: "100%", label: t("stats.freeCoreTools") },
    { value: "0", label: t("stats.dataCollected") },
    { value: "<50ms", label: t("stats.avgResponseTime") },
  ];

  return (
    <div className="container py-16 sm:py-24">
      {/* Hero Section */}
      <div className="mx-auto mb-16 max-w-3xl text-center">
        <h1 className="mb-6 text-3xl font-bold sm:text-4xl lg:text-5xl">
          {t("hero.headingPrefix")}{" "}
          <span className="from-primary to-primary/60 bg-gradient-to-r bg-clip-text text-transparent">
            {t("hero.gradientText")}
          </span>
        </h1>
        <p className="text-muted-foreground text-lg leading-relaxed">
          {t("hero.description")}
        </p>
      </div>

      {/* Stats */}
      <div className="mb-20 grid grid-cols-2 gap-8 md:grid-cols-4">
        {STATS.map((stat) => (
          <div key={stat.label} className="text-center">
            <div className="text-primary text-3xl font-bold sm:text-4xl">
              {stat.value}
            </div>
            <div className="text-muted-foreground mt-1 text-sm">
              {stat.label}
            </div>
          </div>
        ))}
      </div>

      {/* Values */}
      <div className="mb-20">
        <h2 className="mb-10 text-center text-2xl font-bold sm:text-3xl">
          {t("values.heading")}
        </h2>
        <div className="grid gap-8 md:grid-cols-2">
          {VALUES.map((value) => {
            const Icon = value.icon;
            return (
              <div key={value.title} className="flex gap-4">
                <div className="bg-primary/10 flex h-12 w-12 shrink-0 items-center justify-center rounded-lg">
                  <Icon className="text-primary h-6 w-6" />
                </div>
                <div>
                  <h3 className="mb-2 font-semibold">{value.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {value.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Mission */}
      <div className="bg-muted/30 mx-auto max-w-3xl rounded-2xl p-8 text-center sm:p-12">
        <Heart className="text-primary mx-auto mb-4 h-8 w-8" />
        <h2 className="mb-4 text-2xl font-bold">{t("mission.heading")}</h2>
        <p className="text-muted-foreground leading-relaxed">
          {t("mission.description")}
        </p>
      </div>

      {/* Team */}
      <div className="mt-20 text-center">
        <h2 className="mb-4 text-2xl font-bold sm:text-3xl">
          {t("team.headingPrefix")}{" "}
          <span className="from-primary to-primary/60 bg-gradient-to-r bg-clip-text text-transparent">
            {t("team.gradientText")}
          </span>
        </h2>
        <p className="text-muted-foreground mx-auto max-w-2xl">
          {t("team.description")}
        </p>
        <div className="mt-6 flex items-center justify-center gap-2">
          <Users className="text-muted-foreground h-4 w-4" />
          <span className="text-muted-foreground text-sm">
            {t("team.feedbackWelcome")}
          </span>
        </div>
      </div>
    </div>
  );
}
