import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import { getPostBySlug, getAllSlugs } from "@/lib/blog";
import { Clock, Calendar, ArrowLeft, ExternalLink } from "lucide-react";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams(): { slug: string }[] {
  return getAllSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = getPostBySlug(slug);

  if (!post) {
    return { title: "Post Not Found" };
  }

  return {
    title: post.title,
    description: post.description,
    openGraph: {
      title: `${post.title} | utils.live`,
      description: post.description,
      type: "article",
      publishedTime: post.publishedAt,
    },
    alternates: {
      canonical: `https://utils.live/blog/${post.slug}`,
    },
  };
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default async function BlogPostPage({
  params,
}: PageProps): Promise<React.ReactElement> {
  const { slug } = await params;
  const post = getPostBySlug(slug);

  if (!post) {
    notFound();
  }

  return (
    <div className="container py-12 sm:py-20">
      <div className="mx-auto max-w-3xl">
        {/* Back link */}
        <Link
          href="/blog"
          className="text-muted-foreground hover:text-foreground mb-10 inline-flex items-center gap-2 text-sm transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          All articles
        </Link>

        {/* Post header */}
        <header className="mb-10">
          <h1 className="mb-4 text-3xl font-bold leading-tight sm:text-4xl">
            {post.title}
          </h1>
          <p className="text-muted-foreground mb-6 text-lg leading-relaxed">
            {post.description}
          </p>
          <div className="text-muted-foreground flex flex-wrap items-center gap-4 text-sm">
            <span className="flex items-center gap-1.5">
              <Calendar className="h-4 w-4" />
              {formatDate(post.publishedAt)}
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="h-4 w-4" />
              {post.readingTimeMinutes} min read
            </span>
          </div>
        </header>

        {/* Divider */}
        <hr className="border-border mb-10" />

        {/* Markdown content */}
        <div className="prose prose-neutral dark:prose-invert max-w-none">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeHighlight]}
          >
            {post.content}
          </ReactMarkdown>
        </div>

        {/* CTA section */}
        {post.ctaTools.length > 0 && (
          <div className="bg-primary/5 border-primary/20 mt-14 rounded-2xl border p-6 sm:p-8">
            <h2 className="mb-2 text-xl font-semibold">Try it on utils.live</h2>
            <p className="text-muted-foreground mb-6 text-sm leading-relaxed">
              Free, browser-based tools — no sign-up required, your data never
              leaves your device.
            </p>
            <div className="flex flex-wrap gap-3">
              {post.ctaTools.map((tool) => (
                <Link
                  key={tool.href}
                  href={tool.href}
                  className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-medium transition-colors"
                >
                  {tool.name}
                  <ExternalLink className="h-3.5 w-3.5" />
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Bottom nav */}
        <div className="mt-12 border-t pt-8">
          <Link
            href="/blog"
            className="text-muted-foreground hover:text-foreground inline-flex items-center gap-2 text-sm transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to all articles
          </Link>
        </div>
      </div>
    </div>
  );
}
