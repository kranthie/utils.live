import type { BlogPost } from "./types";
import { base64EncodingExplained } from "./posts/base64-encoding-explained";
import { jwtDecoderGuide } from "./posts/jwt-decoder-guide";
import { regexTesterGuide } from "./posts/regex-tester-guide";
import { uuidGeneratorGuide } from "./posts/uuid-generator-guide";
import { md5HashGeneratorGuide } from "./posts/md5-hash-generator-guide";
import { urlEncoderDecoderGuide } from "./posts/url-encoder-decoder-guide";
import { sha256HashGeneratorGuide } from "./posts/sha256-hash-generator-guide";
import { jsonFormatterValidatorGuide } from "./posts/json-formatter-validator-guide";
import { unixTimestampConverterGuide } from "./posts/unix-timestamp-converter-guide";
import { sha1VsSha256VsSha512 } from "./posts/sha1-vs-sha256-vs-sha512";
import { hmacGeneratorGuide } from "./posts/hmac-generator-guide";
import { htmlEncoderDecoderGuide } from "./posts/html-encoder-decoder-guide";
import { aesEncryptionGuide } from "./posts/aes-encryption-guide";
import { bcryptHashGeneratorGuide } from "./posts/bcrypt-hash-generator-guide";
import { colorPickerConverterGuide } from "./posts/color-picker-converter-guide";

export type { BlogPost };

export const allPosts: BlogPost[] = [
  base64EncodingExplained,
  jwtDecoderGuide,
  regexTesterGuide,
  uuidGeneratorGuide,
  md5HashGeneratorGuide,
  urlEncoderDecoderGuide,
  sha256HashGeneratorGuide,
  jsonFormatterValidatorGuide,
  unixTimestampConverterGuide,
  sha1VsSha256VsSha512,
  hmacGeneratorGuide,
  htmlEncoderDecoderGuide,
  aesEncryptionGuide,
  bcryptHashGeneratorGuide,
  colorPickerConverterGuide,
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
