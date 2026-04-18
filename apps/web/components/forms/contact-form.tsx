"use client";

import { useState } from "react";
import { Send, CheckCircle, AlertCircle } from "lucide-react";
import { useTranslations } from "next-intl";
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

type FormStatus = "idle" | "submitting" | "success" | "error";

export function ContactForm({
  className,
}: ContactFormProps): React.ReactElement {
  const t = useTranslations("marketing.contact.form");

  const SUBJECT_OPTIONS = [
    { value: "general", label: t("subjects.general") },
    { value: "bug", label: t("subjects.bug") },
    { value: "feature", label: t("subjects.feature") },
    { value: "support", label: t("subjects.support") },
    { value: "partnership", label: t("subjects.partnership") },
    { value: "other", label: t("subjects.other") },
  ];

  const [formData, setFormData] = useState<ContactFormData>({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [status, setStatus] = useState<FormStatus>("idle");
  const [fieldErrors, setFieldErrors] = useState<Partial<ContactFormData>>({});
  const [validationMessage, setValidationMessage] = useState<string>("");

  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  function validate(): Partial<ContactFormData> {
    const errors: Partial<ContactFormData> = {};
    if (!formData.name.trim()) errors.name = t("errors.nameRequired");
    if (!formData.email.trim()) {
      errors.email = t("errors.emailRequired");
    } else if (!EMAIL_RE.test(formData.email.trim())) {
      errors.email = t("errors.emailInvalid");
    }
    if (!formData.message.trim()) errors.message = t("errors.messageRequired");
    return errors;
  }

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();

    const errors = validate();
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setValidationMessage(t("errors.fixBeforeSubmit"));
      return;
    }
    setFieldErrors({});
    setValidationMessage("");

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
        <h3 className="mb-2 text-xl font-semibold">{t("successTitle")}</h3>
        <p className="text-muted-foreground max-w-md">
          {t("successDescription")}
        </p>
        <Button
          variant="outline"
          className="mt-6"
          onClick={() => {
            setStatus("idle");
            setFormData({ name: "", email: "", subject: "", message: "" });
          }}
        >
          {t("sendAnother")}
        </Button>
      </div>
    );
  }

  return (
    <form
      onSubmit={(e) => void handleSubmit(e)}
      className={cn("space-y-6", className)}
    >
      {(status === "error" || validationMessage) && (
        <div
          role="alert"
          aria-live="assertive"
          className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950/30 dark:text-red-400"
        >
          <AlertCircle className="h-4 w-4 shrink-0" />
          {validationMessage || t("errorMessage")}
        </div>
      )}

      <div className="grid gap-6 sm:grid-cols-2">
        <TextInput
          name="name"
          label={t("nameLabel")}
          placeholder={t("namePlaceholder")}
          required
          value={formData.name}
          onChange={(value) => {
            setFormData({ ...formData, name: value });
            if (fieldErrors.name)
              setFieldErrors({ ...fieldErrors, name: undefined });
          }}
          error={fieldErrors.name}
          disabled={status === "submitting"}
        />
        <TextInput
          name="email"
          label={t("emailLabel")}
          type="email"
          placeholder={t("emailPlaceholder")}
          required
          value={formData.email}
          onChange={(value) => {
            setFormData({ ...formData, email: value });
            if (fieldErrors.email)
              setFieldErrors({ ...fieldErrors, email: undefined });
          }}
          error={fieldErrors.email}
          disabled={status === "submitting"}
        />
      </div>

      <SearchableSelect
        name="subject"
        label={t("subjectLabel")}
        placeholder={t("subjectPlaceholder")}
        options={SUBJECT_OPTIONS}
        value={formData.subject}
        onChange={(value) => setFormData({ ...formData, subject: value ?? "" })}
        disabled={status === "submitting"}
      />

      <Textarea
        name="message"
        label={t("messageLabel")}
        placeholder={t("messagePlaceholder")}
        required
        minRows={6}
        value={formData.message}
        onChange={(e) => {
          setFormData({ ...formData, message: e.target.value });
          if (fieldErrors.message)
            setFieldErrors({ ...fieldErrors, message: undefined });
        }}
        error={fieldErrors.message}
        disabled={status === "submitting"}
      />

      <Button
        type="submit"
        className="w-full sm:w-auto"
        aria-busy={status === "submitting"}
        disabled={
          status === "submitting" ||
          !formData.name ||
          !formData.email ||
          !formData.message
        }
      >
        {status === "submitting" ? (
          <>{t("submittingButton")}</>
        ) : (
          <>
            <Send className="mr-2 h-4 w-4" />
            {t("submitButton")}
          </>
        )}
      </Button>
    </form>
  );
}
