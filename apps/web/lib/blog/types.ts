export interface BlogPost {
  slug: string;
  title: string;
  description: string;
  publishedAt: string; // ISO date string
  readingTimeMinutes: number;
  ctaTools: { name: string; href: string }[];
  content: string; // Markdown content
}
