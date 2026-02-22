import type { Metadata } from "next";
import { Clock, MapPin } from "lucide-react";
import { ContactForm } from "@/components/forms/contact-form";

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

const CONTACT_INFO = [
  {
    icon: Clock,
    title: "Response Time",
    value: "< 24 hours",
    description: "For most inquiries",
  },
  {
    icon: MapPin,
    title: "Location",
    value: "Remote Team",
    description: "Distributed worldwide",
  },
];

export default function ContactPage(): React.ReactElement {
  return (
    <div className="container py-16 sm:py-24">
      {/* Header */}
      <div className="mx-auto mb-12 max-w-2xl text-center">
        <h1 className="mb-4 text-3xl font-bold sm:text-4xl">Get in Touch</h1>
        <p className="text-muted-foreground text-lg">
          Have a question, feature request, or just want to say hi? We&apos;d
          love to hear from you.
        </p>
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
              <h3 className="mb-2 font-medium">Looking for a tool?</h3>
              <p className="text-muted-foreground text-sm">
                Browse our{" "}
                <a href="/tools" className="text-primary hover:underline">
                  full collection of tools
                </a>
                .
              </p>
            </div>
          </div>

          {/* Contact Form */}
          <div className="lg:col-span-3">
            <div className="rounded-lg border p-6 sm:p-8">
              <h2 className="mb-6 text-xl font-semibold">Send us a message</h2>
              <ContactForm />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
