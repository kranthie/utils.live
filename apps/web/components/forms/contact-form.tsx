"use client";

import { useState } from "react";
import { Send, CheckCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TextInput } from "@/components/forms/text-input";
import { Textarea } from "@/components/forms/textarea";
import { SearchableSelect } from "@/components/forms/searchable-select";
import { cn } from "@/lib/utils";

const STATICFORMS_API_KEY = process.env.NEXT_PUBLIC_STATICFORMS_API_KEY ?? "";

interface ContactFormProps {
  className?: string;
}

export interface ContactFormData {
  name: string;
  email: string;
  subject: string;
  message: string;
}

const SUBJECT_OPTIONS = [
  { value: "general", label: "General Inquiry" },
  { value: "bug", label: "Bug Report" },
  { value: "feature", label: "Feature Request" },
  { value: "support", label: "Technical Support" },
  { value: "partnership", label: "Partnership" },
  { value: "other", label: "Other" },
];

type FormStatus = "idle" | "submitting" | "success" | "error";

export function ContactForm({
  className,
}: ContactFormProps): React.ReactElement {
  const [formData, setFormData] = useState<ContactFormData>({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [status, setStatus] = useState<FormStatus>("idle");

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();

    if (!formData.name || !formData.email || !formData.message) {
      return;
    }

    setStatus("submitting");

    try {
      const subject = formData.subject
        ? (SUBJECT_OPTIONS.find((o) => o.value === formData.subject)?.label ??
          formData.subject)
        : "Contact Form";

      const res = await fetch("https://api.staticforms.dev/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apiKey: STATICFORMS_API_KEY,
          name: formData.name,
          email: formData.email,
          replyTo: formData.email,
          subject: `[utils.live] ${subject}`,
          message: formData.message,
          honeypot: "",
        }),
      });

      const data = (await res.json()) as { success: boolean };

      if (data.success) {
        setStatus("success");
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  };

  if (status === "success") {
    return (
      <div
        className={cn(
          "flex flex-col items-center justify-center rounded-lg border p-8 text-center",
          className
        )}
      >
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
          <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
        </div>
        <h3 className="mb-2 text-xl font-semibold">Message Sent!</h3>
        <p className="text-muted-foreground max-w-md">
          Thank you for reaching out. We&apos;ll get back to you as soon as
          possible, usually within 24 hours.
        </p>
        <Button
          variant="outline"
          className="mt-6"
          onClick={() => {
            setStatus("idle");
            setFormData({ name: "", email: "", subject: "", message: "" });
          }}
        >
          Send Another Message
        </Button>
      </div>
    );
  }

  return (
    <form
      onSubmit={(e) => void handleSubmit(e)}
      className={cn("space-y-6", className)}
    >
      {status === "error" && (
        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950/30 dark:text-red-400">
          <AlertCircle className="h-4 w-4 shrink-0" />
          Something went wrong. Please try again.
        </div>
      )}

      <div className="grid gap-6 sm:grid-cols-2">
        <TextInput
          name="name"
          label="Name"
          placeholder="Your name"
          required
          value={formData.name}
          onChange={(value) => setFormData({ ...formData, name: value })}
          disabled={status === "submitting"}
        />
        <TextInput
          name="email"
          label="Email"
          type="email"
          placeholder="you@example.com"
          required
          value={formData.email}
          onChange={(value) => setFormData({ ...formData, email: value })}
          disabled={status === "submitting"}
        />
      </div>

      <SearchableSelect
        name="subject"
        label="Subject"
        placeholder="Select a topic"
        options={SUBJECT_OPTIONS}
        value={formData.subject}
        onChange={(value) => setFormData({ ...formData, subject: value ?? "" })}
        disabled={status === "submitting"}
      />

      <Textarea
        name="message"
        label="Message"
        placeholder="How can we help you?"
        required
        minRows={6}
        value={formData.message}
        onChange={(e) => setFormData({ ...formData, message: e.target.value })}
        disabled={status === "submitting"}
      />

      <Button
        type="submit"
        className="w-full sm:w-auto"
        disabled={
          status === "submitting" ||
          !formData.name ||
          !formData.email ||
          !formData.message
        }
      >
        {status === "submitting" ? (
          <>Sending...</>
        ) : (
          <>
            <Send className="mr-2 h-4 w-4" />
            Send Message
          </>
        )}
      </Button>
    </form>
  );
}
