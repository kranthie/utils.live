import type { BlogPost } from "./types";
import { base64EncodingExplained } from "./posts/base64-encoding-explained";
import { jwtDecoderGuide } from "./posts/jwt-decoder-guide";
import { regexTesterGuide } from "./posts/regex-tester-guide";
import { uuidGeneratorGuide } from "./posts/uuid-generator-guide";
import { md5HashGeneratorGuide } from "./posts/md5-hash-generator-guide";

export type { BlogPost };

export const allPosts: BlogPost[] = [
  base64EncodingExplained,
  jwtDecoderGuide,
  regexTesterGuide,
  uuidGeneratorGuide,
  md5HashGeneratorGuide,
].sort(
  (a, b) =>
    new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
);

export function getPostBySlug(slug: string): BlogPost | undefined {
  return allPosts.find((post) => post.slug === slug);
}

export function getAllSlugs(): string[] {
  return allPosts.map((post) => post.slug);
}
