import type { Metadata } from "next";
import Link from "next/link";
import { allPosts } from "@/lib/blog";
import { Clock, Calendar, ArrowRight } from "lucide-react";

export const metadata: Metadata = {
  title: "Developer Tools Blog | utils.live",
  description:
    "Learn about developer tools concepts — Base64, JWTs, regex, UUIDs, hashing, and more. Practical guides with live examples.",
  openGraph: {
    title: "Developer Tools Blog | utils.live",
    description:
      "Learn about developer tools concepts — Base64, JWTs, regex, UUIDs, hashing, and more. Practical guides with live examples.",
  },
  alternates: {
    canonical: "https://utils.live/blog",
  },
};

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default function BlogPage(): React.ReactElement {
  return (
    <div className="container py-16 sm:py-24">
      {/* Hero */}
      <div className="mx-auto mb-16 max-w-3xl text-center">
        <h1 className="mb-6 text-3xl font-bold sm:text-4xl lg:text-5xl">
          Developer Tools{" "}
          <span className="from-primary to-primary/60 bg-gradient-to-r bg-clip-text text-transparent">
            Blog
          </span>
        </h1>
        <p className="text-muted-foreground text-lg leading-relaxed">
          Practical guides on encoding, hashing, tokens, and more. Understand
          the tools you use every day.
        </p>
      </div>

      {/* Post list */}
      <div className="mx-auto max-w-3xl space-y-6">
        {allPosts.map((post) => (
          <article
            key={post.slug}
            className="bg-card border-border rounded-2xl border p-6 transition-shadow hover:shadow-md sm:p-8"
          >
            <Link href={`/blog/${post.slug}`} className="group block">
              <h2 className="group-hover:text-primary mb-3 text-xl font-semibold transition-colors sm:text-2xl">
                {post.title}
              </h2>
            </Link>
            <p className="text-muted-foreground mb-5 leading-relaxed">
              {post.description}
            </p>
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="text-muted-foreground flex items-center gap-4 text-sm">
                <span className="flex items-center gap-1.5">
                  <Calendar className="h-4 w-4" />
                  {formatDate(post.publishedAt)}
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock className="h-4 w-4" />
                  {post.readingTimeMinutes} min read
                </span>
              </div>
              <Link
                href={`/blog/${post.slug}`}
                className="text-primary flex items-center gap-1.5 text-sm font-medium transition-gap hover:gap-2.5"
              >
                Read article
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
