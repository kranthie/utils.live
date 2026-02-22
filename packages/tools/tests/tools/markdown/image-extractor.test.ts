import { describe, it, expect } from "vitest";
import { markdownImageExtractor } from "../../../src/tools/markdown/image-extractor";
import { executeTool } from "../../../src/core/executor";
import { ToolTier } from "../../../src/types";

describe("markdownImageExtractor", () => {
  describe("metadata", () => {
    it("should have correct metadata", () => {
      expect(markdownImageExtractor.meta.id).toBe("markdown/image-extractor");
      expect(markdownImageExtractor.meta.name).toBe("Markdown Image Extractor");
      expect(markdownImageExtractor.meta.category).toBe("markdown");
      expect(markdownImageExtractor.meta.tier).toBe(ToolTier.CLIENT);
      expect(markdownImageExtractor.meta.keywords).toContain("image");
      expect(markdownImageExtractor.meta.keywords).toContain("extract");
    });
  });

  describe("execute", () => {
    it("should extract inline image", async () => {
      const result = await executeTool(markdownImageExtractor, {
        input: "![Alt text](image.png)",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as {
          count: number;
          images: Array<{ src: string; alt: string; title: string | null }>;
        };
        expect(data.count).toBe(1);
        expect(data.images[0]).toEqual({
          src: "image.png",
          alt: "Alt text",
          title: null,
        });
      }
    });

    it("should extract image with title", async () => {
      const result = await executeTool(markdownImageExtractor, {
        input: '![Alt](image.png "Image Title")',
      });

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as {
          images: Array<{ src: string; alt: string; title: string | null }>;
        };
        expect(data.images[0]).toEqual({
          src: "image.png",
          alt: "Alt",
          title: "Image Title",
        });
      }
    });

    it("should extract multiple images", async () => {
      const result = await executeTool(markdownImageExtractor, {
        input: "![One](a.png)\n![Two](b.png)\n![Three](c.png)",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as {
          count: number;
          images: Array<{ src: string }>;
        };
        expect(data.count).toBe(3);
        expect(data.images.map((i) => i.src)).toEqual([
          "a.png",
          "b.png",
          "c.png",
        ]);
      }
    });

    it("should extract reference-style images", async () => {
      const result = await executeTool(markdownImageExtractor, {
        input: "![Alt][logo]\n\n[logo]: logo.png",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as {
          count: number;
          images: Array<{ src: string }>;
        };
        expect(data.count).toBe(1);
        expect(data.images[0]?.src).toBe("logo.png");
      }
    });

    it("should extract reference-style images with title", async () => {
      const result = await executeTool(markdownImageExtractor, {
        input: '![Alt][logo]\n\n[logo]: logo.png "Logo Title"',
      });

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as { images: Array<{ title: string | null }> };
        expect(data.images[0]?.title).toBe("Logo Title");
      }
    });

    it("should extract HTML img tags", async () => {
      const result = await executeTool(markdownImageExtractor, {
        input: '<img src="photo.jpg" alt="Photo">',
      });

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as {
          count: number;
          images: Array<{ src: string }>;
        };
        expect(data.count).toBe(1);
        expect(data.images[0]?.src).toBe("photo.jpg");
      }
    });

    it("should extract HTML img with title", async () => {
      const result = await executeTool(markdownImageExtractor, {
        input: '<img src="photo.jpg" alt="Photo" title="Photo Title">',
      });

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as { images: Array<{ src: string }> };
        expect(data.images[0]?.src).toBe("photo.jpg");
      }
    });

    it("should extract HTML img with alt before src", async () => {
      const result = await executeTool(markdownImageExtractor, {
        input: '<img alt="Alt First" src="image.jpg">',
      });

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as {
          count: number;
          images: Array<{ src: string }>;
        };
        expect(data.count).toBe(1);
        expect(data.images[0]?.src).toBe("image.jpg");
      }
    });

    it("should return unique sources", async () => {
      const result = await executeTool(markdownImageExtractor, {
        input: "![A](same.png)\n![B](same.png)\n![C](other.png)",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).count).toBe(3);
        expect((result.data as Record<string, unknown>).uniqueSrcs).toEqual([
          "same.png",
          "other.png",
        ]);
      }
    });

    it("should handle empty alt text", async () => {
      const result = await executeTool(markdownImageExtractor, {
        input: "![](no-alt.png)",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as {
          images: Array<{ src: string; alt: string }>;
        };
        expect(data.images[0]?.alt).toBe("");
        expect(data.images[0]?.src).toBe("no-alt.png");
      }
    });

    it("should handle URLs with query strings", async () => {
      const result = await executeTool(markdownImageExtractor, {
        input: "![Image](https://example.com/img.png?w=100&h=100)",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as { images: Array<{ src: string }> };
        expect(data.images[0]?.src).toBe(
          "https://example.com/img.png?w=100&h=100"
        );
      }
    });

    it("should handle document with no images", async () => {
      const result = await executeTool(markdownImageExtractor, {
        input: "# Just text\n\nNo images here.",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).count).toBe(0);
        expect((result.data as Record<string, unknown>).images).toEqual([]);
        expect((result.data as Record<string, unknown>).uniqueSrcs).toEqual([]);
      }
    });

    it("should handle empty input", async () => {
      const result = await executeTool(markdownImageExtractor, {
        input: "",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).count).toBe(0);
        expect((result.data as Record<string, unknown>).images).toEqual([]);
      }
    });

    it("should handle mixed markdown and HTML images", async () => {
      const result = await executeTool(markdownImageExtractor, {
        input: '![MD](md.png)\n<img src="html.png" alt="HTML">',
      });

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as {
          count: number;
          images: Array<{ src: string }>;
        };
        expect(data.count).toBe(2);
        expect(data.images.map((i) => i.src)).toContain("md.png");
        expect(data.images.map((i) => i.src)).toContain("html.png");
      }
    });

    it("should handle complex document", async () => {
      const markdown = `# Gallery

Here's the first image:

![Photo 1](photos/1.jpg "First photo")

And another:

![Photo 2][photo2]

<img src="photos/3.jpg" alt="Photo 3" title="Third photo">

[photo2]: photos/2.jpg "Second photo"
`;

      const result = await executeTool(markdownImageExtractor, {
        input: markdown,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).count).toBe(3);
        expect(
          (result.data as Record<string, unknown>).uniqueSrcs
        ).toHaveLength(3);
      }
    });

    it("should handle relative paths", async () => {
      const result = await executeTool(markdownImageExtractor, {
        input: "![](../images/photo.png)\n![](./local/img.jpg)",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as { images: Array<{ src: string }> };
        expect(data.images[0]?.src).toBe("../images/photo.png");
        expect(data.images[1]?.src).toBe("./local/img.jpg");
      }
    });

    it("should handle data URLs", async () => {
      const result = await executeTool(markdownImageExtractor, {
        input: "![Base64](data:image/png;base64,iVBORw0KGgo=)",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as {
          count: number;
          images: Array<{ src: string }>;
        };
        expect(data.count).toBe(1);
        expect(data.images[0]?.src).toContain("data:image/png");
      }
    });
  });
});
