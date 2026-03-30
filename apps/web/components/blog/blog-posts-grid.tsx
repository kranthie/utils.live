"use client";

import { useState } from "react";
import Link from "next/link";
import { Clock, Calendar, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { BlogPost } from "@/lib/blog";

const POSTS_PER_PAGE = 6;

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

interface BlogPostsGridProps {
  posts: BlogPost[];
}

export function BlogPostsGrid({
  posts,
}: BlogPostsGridProps): React.ReactElement {
  const [visibleCount, setVisibleCount] = useState(POSTS_PER_PAGE);
  const visiblePosts = posts.slice(0, visibleCount);
  const hasMore = visibleCount < posts.length;

  return (
    <div>
      <div className="grid gap-6 sm:grid-cols-2">
        {visiblePosts.map((post) => (
          <article
            key={post.slug}
            className="bg-card border-border overflow-hidden rounded-2xl border transition-shadow hover:shadow-md"
          >
            <div className="from-primary to-primary/40 h-1 bg-gradient-to-r" />
            <Link href={`/blog/${post.slug}`} className="group block p-6">
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <span className="bg-primary/10 text-primary rounded-full px-2.5 py-0.5 text-xs font-semibold">
                  {post.category}
                </span>
                <span className="text-muted-foreground flex items-center gap-1 text-xs">
                  <Clock className="h-3 w-3" />
                  {post.readingTimeMinutes} min read
                </span>
              </div>
              <h2 className="group-hover:text-primary mb-2 text-lg font-semibold leading-snug transition-colors">
                {post.title}
              </h2>
              <p className="text-muted-foreground mb-4 line-clamp-2 text-sm leading-relaxed">
                {post.description}
              </p>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground flex items-center gap-1 text-xs">
                  <Calendar className="h-3 w-3" />
                  {formatDate(post.publishedAt)}
                </span>
                <span className="text-primary flex items-center gap-1 text-xs font-medium">
                  Read article
                  <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
                </span>
              </div>
            </Link>
          </article>
        ))}
      </div>

      {hasMore && (
        <div className="mt-10 flex justify-center">
          <Button
            variant="outline"
            onClick={() => setVisibleCount((c) => c + POSTS_PER_PAGE)}
          >
            Load more articles
          </Button>
        </div>
      )}
    </div>
  );
}
