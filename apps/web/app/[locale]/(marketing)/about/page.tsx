import type { Metadata } from "next";
import { Zap, Shield, Code, Globe, Users, Heart } from "lucide-react";
import { getToolCountLabel } from "@/lib/tools/get-tool";

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

const VALUES = [
  {
    icon: Zap,
    title: "Speed First",
    description:
      "Tools should be instant. Our client-side tools run in your browser for zero latency.",
  },
  {
    icon: Shield,
    title: "Privacy by Design",
    description:
      "Your data stays on your device. We don't track, store, or analyze your tool inputs.",
  },
  {
    icon: Code,
    title: "Developer Experience",
    description:
      "Built by developers, for developers. Every tool is designed to save you time.",
  },
  {
    icon: Globe,
    title: "Free & Accessible",
    description:
      "Core tools are free forever. We believe everyone should have access to quality utilities.",
  },
];

const STATS = [
  { value: getToolCountLabel(), label: "Developer Tools" },
  { value: "100%", label: "Free Core Tools" },
  { value: "0", label: "Data Collected" },
  { value: "<50ms", label: "Avg Response Time" },
];

export default function AboutPage(): React.ReactElement {
  return (
    <div className="container py-16 sm:py-24">
      {/* Hero Section */}
      <div className="mx-auto mb-16 max-w-3xl text-center">
        <h1 className="mb-6 text-3xl font-bold sm:text-4xl lg:text-5xl">
          Developer tools that{" "}
          <span className="from-primary to-primary/60 bg-gradient-to-r bg-clip-text text-transparent">
            respect your time
          </span>
        </h1>
        <p className="text-muted-foreground text-lg leading-relaxed">
          utils.live was born from frustration with slow, ad-filled, and
          privacy-invasive online tools. We built what we wanted to use: fast,
          free, and respectful utilities.
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
          Our Values
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
        <h2 className="mb-4 text-2xl font-bold">Our Mission</h2>
        <p className="text-muted-foreground leading-relaxed">
          We believe developer tools should be accessible to everyone,
          regardless of budget or technical expertise. utils.live provides
          professional-grade utilities without the bloat, tracking, or paywalls.
          Our goal is to help you focus on what matters: building great
          software.
        </p>
      </div>

      {/* Team */}
      <div className="mt-20 text-center">
        <h2 className="mb-4 text-2xl font-bold sm:text-3xl">
          Built with{" "}
          <span className="from-primary to-primary/60 bg-gradient-to-r bg-clip-text text-transparent">
            care
          </span>
        </h2>
        <p className="text-muted-foreground mx-auto max-w-2xl">
          utils.live is maintained by a small team of passionate developers who
          use these tools daily. We&apos;re always adding new tools and
          improving existing ones based on community feedback.
        </p>
        <div className="mt-6 flex items-center justify-center gap-2">
          <Users className="text-muted-foreground h-4 w-4" />
          <span className="text-muted-foreground text-sm">
            Feedback and suggestions welcome
          </span>
        </div>
      </div>
    </div>
  );
}
