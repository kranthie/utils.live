import type { Metadata } from "next";
import Link from "next/link";
import { allPosts } from "@/lib/blog";
import { Clock, Calendar, ArrowRight } from "lucide-react";
import { BlogPostsGrid } from "@/components/blog/blog-posts-grid";

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
  const [featured, ...rest] = allPosts;

  return (
    <div className="container py-16 sm:py-24">
      {/* Hero */}
      <div className="mx-auto mb-12 max-w-3xl text-center">
        <h1 className="mb-4 text-3xl font-bold sm:text-4xl lg:text-5xl">
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

      {/* Featured post */}
      {featured && (
        <div className="mb-8">
          <Link href={`/blog/${featured.slug}`} className="group block">
            <article className="bg-card border-border overflow-hidden rounded-2xl border transition-shadow hover:shadow-lg">
              {/* Gradient accent bar */}
              <div className="from-primary to-primary/40 h-1 bg-gradient-to-r" />
              <div className="p-7 sm:p-10">
                {/* Category badge + meta */}
                <div className="mb-4 flex flex-wrap items-center gap-3">
                  <span className="bg-primary/10 text-primary rounded-full px-3 py-1 text-xs font-semibold">
                    {featured.category}
                  </span>
                  <span className="text-muted-foreground flex items-center gap-1.5 text-sm">
                    <Calendar className="h-3.5 w-3.5" />
                    {formatDate(featured.publishedAt)}
                  </span>
                  <span className="text-muted-foreground flex items-center gap-1.5 text-sm">
                    <Clock className="h-3.5 w-3.5" />
                    {featured.readingTimeMinutes} min read
                  </span>
                </div>
                {/* Title */}
                <h2 className="group-hover:text-primary mb-3 text-2xl leading-snug font-bold transition-colors sm:text-3xl">
                  {featured.title}
                </h2>
                <p className="text-muted-foreground mb-6 max-w-2xl text-base leading-relaxed">
                  {featured.description}
                </p>
                <span className="text-primary inline-flex items-center gap-2 text-sm font-medium">
                  Read article
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </span>
              </div>
            </article>
          </Link>
        </div>
      )}

      {/* Remaining posts — 2-col grid with pagination */}
      {rest.length > 0 && <BlogPostsGrid posts={rest} />}
    </div>
  );
}
