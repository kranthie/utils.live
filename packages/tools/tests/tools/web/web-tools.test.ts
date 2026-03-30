import { describe, it, expect } from "vitest";
import { executeTool } from "../../../src/core/executor";
import {
  metaTagGenerator,
  ogGenerator,
  twitterCardGenerator,
  schemaOrgGenerator,
  robotsTxtGenerator,
  robotsTxtValidator,
  sitemapGenerator,
  sitemapValidator,
  canonicalUrlBuilder,
  hreflangGenerator,
  metaPreview,
  socialPreview,
  cspBuilder,
  cspValidator,
  corsBuilder,
  sriHashGenerator,
  securityHeadersCheck,
  hstsBuilder,
  permissionsPolicyBuilder,
  xssFilterTester,
} from "../../../src/tools/web";

// =====================================================
// Meta Tag Generator
// =====================================================
describe("Meta Tag Generator", () => {
  it("should have correct metadata", () => {
    expect(metaTagGenerator.meta.id).toBe("web/meta-tag-generator");
    expect(metaTagGenerator.meta.category).toBe("web");
  });

  it("should generate meta tags with defaults", async () => {
    const result = await executeTool(metaTagGenerator, {});
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toContain(
        '<meta charset="UTF-8">'
      );
      expect((result.data as Record<string, unknown>).output).toContain(
        "<title>"
      );
      expect((result.data as Record<string, unknown>).output).toContain(
        "description"
      );
    }
  });

  it("should include keywords when provided", async () => {
    const result = await executeTool(metaTagGenerator, {
      title: "Test Page",
      description: "A test page",
      keywords: "test, page, web",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toContain(
        "test, page, web"
      );
    }
  });

  it("should include author when provided", async () => {
    const result = await executeTool(metaTagGenerator, {
      title: "My Page",
      author: "John Doe",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toContain(
        "John Doe"
      );
    }
  });
});

// =====================================================
// OG Generator
// =====================================================
describe("OG Generator", () => {
  it("should have correct metadata", () => {
    expect(ogGenerator.meta.id).toBe("web/og-generator");
    expect(ogGenerator.meta.category).toBe("web");
  });

  it("should generate OG tags with defaults", async () => {
    const result = await executeTool(ogGenerator, {});
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toContain(
        "og:title"
      );
      expect((result.data as Record<string, unknown>).output).toContain(
        "og:description"
      );
      expect((result.data as Record<string, unknown>).output).toContain(
        "og:image"
      );
    }
  });

  it("should generate OG tags with custom data", async () => {
    const result = await executeTool(ogGenerator, {
      title: "My Article",
      description: "Great article",
      url: "https://blog.com/article",
      type: "article",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toContain(
        "My Article"
      );
      expect((result.data as Record<string, unknown>).output).toContain(
        "article"
      );
    }
  });
});

// =====================================================
// Twitter Card Generator
// =====================================================
describe("Twitter Card Generator", () => {
  it("should have correct metadata", () => {
    expect(twitterCardGenerator.meta.id).toBe("web/twitter-card-generator");
    expect(twitterCardGenerator.meta.category).toBe("web");
  });

  it("should generate Twitter card with defaults", async () => {
    const result = await executeTool(twitterCardGenerator, {});
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toContain(
        "twitter:card"
      );
      expect((result.data as Record<string, unknown>).output).toContain(
        "twitter:title"
      );
    }
  });

  it("should include site handle when provided", async () => {
    const result = await executeTool(twitterCardGenerator, {
      title: "My Page",
      site: "@mysite",
      creator: "@author",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toContain(
        "@mysite"
      );
      expect((result.data as Record<string, unknown>).output).toContain(
        "@author"
      );
    }
  });
});

// =====================================================
// Schema.org Generator (web)
// =====================================================
describe("Schema.org Generator (web)", () => {
  it("should have correct metadata", () => {
    expect(schemaOrgGenerator.meta.id).toBe("web/schema-org-generator");
    expect(schemaOrgGenerator.meta.category).toBe("web");
  });

  it("should generate Article schema with defaults", async () => {
    const result = await executeTool(schemaOrgGenerator, {});
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toContain(
        "schema.org"
      );
      expect((result.data as Record<string, unknown>).output).toContain(
        "Article"
      );
    }
  });

  it("should generate FAQ schema", async () => {
    const result = await executeTool(schemaOrgGenerator, {
      type: "FAQ",
      name: "FAQ Page",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toContain("FAQ");
    }
  });
});

// =====================================================
// Robots.txt Generator
// =====================================================
describe("Robots.txt Generator", () => {
  it("should have correct metadata", () => {
    expect(robotsTxtGenerator.meta.id).toBe("web/robots-txt-generator");
    expect(robotsTxtGenerator.meta.category).toBe("web");
  });

  it("should generate robots.txt with defaults", async () => {
    const result = await executeTool(robotsTxtGenerator, {});
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toContain(
        "User-agent: *"
      );
      expect((result.data as Record<string, unknown>).output).toContain(
        "Sitemap:"
      );
    }
  });

  it("should disallow all when allowAll is false", async () => {
    const result = await executeTool(robotsTxtGenerator, {
      allowAll: false,
      disallowPaths: "/",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toContain(
        "Disallow: /"
      );
    }
  });
});

// =====================================================
// Robots.txt Validator
// =====================================================
describe("Robots.txt Validator", () => {
  it("should have correct metadata", () => {
    expect(robotsTxtValidator.meta.id).toBe("web/robots-txt-validator");
    expect(robotsTxtValidator.meta.category).toBe("web");
  });

  it("should validate valid robots.txt", async () => {
    const robotsTxt =
      "User-agent: *\nDisallow: /admin/\nSitemap: https://example.com/sitemap.xml";
    const result = await executeTool(robotsTxtValidator, { input: robotsTxt });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).valid).toBe(true);
    }
  });

  it("should detect issues in malformed robots.txt", async () => {
    const result = await executeTool(robotsTxtValidator, {
      input: "INVALID DIRECTIVE HERE",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(
        (result.data as Record<string, unknown>).errors.length +
          (result.data as Record<string, unknown>).warnings.length
      ).toBeGreaterThan(0);
    }
  });
});

// =====================================================
// Sitemap Generator
// =====================================================
describe("Sitemap Generator", () => {
  it("should have correct metadata", () => {
    expect(sitemapGenerator.meta.id).toBe("web/sitemap-generator");
    expect(sitemapGenerator.meta.category).toBe("web");
  });

  it("should generate sitemap with defaults", async () => {
    const result = await executeTool(sitemapGenerator, {});
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toContain(
        '<?xml version="1.0"'
      );
      expect((result.data as Record<string, unknown>).output).toContain(
        "<urlset"
      );
      expect((result.data as Record<string, unknown>).output).toContain(
        "example.com"
      );
    }
  });

  it("should generate sitemap with custom URLs", async () => {
    const result = await executeTool(sitemapGenerator, {
      urls: "https://mysite.com/\nhttps://mysite.com/about",
      changefreq: "daily",
      priority: 0.9,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toContain(
        "mysite.com"
      );
      expect((result.data as Record<string, unknown>).output).toContain(
        "daily"
      );
    }
  });
});

// =====================================================
// Sitemap Validator
// =====================================================
describe("Sitemap Validator", () => {
  it("should have correct metadata", () => {
    expect(sitemapValidator.meta.id).toBe("web/sitemap-validator");
    expect(sitemapValidator.meta.category).toBe("web");
  });

  it("should validate valid sitemap", async () => {
    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>https://example.com/</loc></url>
  <url><loc>https://example.com/about</loc></url>
</urlset>`;
    const result = await executeTool(sitemapValidator, { input: sitemap });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).valid).toBe(true);
      expect((result.data as Record<string, unknown>).urlCount).toBe(2);
    }
  });

  it("should detect invalid sitemap", async () => {
    const result = await executeTool(sitemapValidator, { input: "not xml" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).valid).toBe(false);
    }
  });
});

// =====================================================
// Canonical URL Builder
// =====================================================
describe("Canonical URL Builder", () => {
  it("should have correct metadata", () => {
    expect(canonicalUrlBuilder.meta.id).toBe("web/canonical-url-builder");
    expect(canonicalUrlBuilder.meta.category).toBe("web");
  });

  it("should generate canonical link tag with defaults", async () => {
    const result = await executeTool(canonicalUrlBuilder, {});
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toContain(
        'rel="canonical"'
      );
      expect((result.data as Record<string, unknown>).output).toContain(
        "example.com"
      );
    }
  });

  it("should generate with custom URL", async () => {
    const result = await executeTool(canonicalUrlBuilder, {
      url: "https://mysite.com/page",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toContain(
        "https://mysite.com/page"
      );
    }
  });
});

// =====================================================
// Hreflang Generator
// =====================================================
describe("Hreflang Generator", () => {
  it("should have correct metadata", () => {
    expect(hreflangGenerator.meta.id).toBe("web/hreflang-generator");
    expect(hreflangGenerator.meta.category).toBe("web");
  });

  it("should generate hreflang tags with defaults", async () => {
    const result = await executeTool(hreflangGenerator, {});
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toContain(
        "hreflang"
      );
      expect((result.data as Record<string, unknown>).output).toContain(
        "x-default"
      );
    }
  });

  it("should generate hreflang with custom URLs", async () => {
    const result = await executeTool(hreflangGenerator, {
      urls: "en:https://site.com/\nfr:https://site.com/fr/",
      defaultLang: "en",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toContain(
        'hreflang="en"'
      );
      expect((result.data as Record<string, unknown>).output).toContain(
        'hreflang="fr"'
      );
    }
  });
});

// =====================================================
// Meta Preview
// =====================================================
describe("Meta Preview", () => {
  it("should have correct metadata", () => {
    expect(metaPreview.meta.id).toBe("web/meta-preview");
    expect(metaPreview.meta.category).toBe("web");
  });

  it("should generate preview from HTML with meta tags", async () => {
    const html = `<head>
      <title>My Page</title>
      <meta name="description" content="A great page">
    </head>`;
    const result = await executeTool(metaPreview, { input: html });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toContain(
        "My Page"
      );
    }
  });

  it("should handle HTML without meta tags", async () => {
    const result = await executeTool(metaPreview, {
      input: "<html><body>Hello</body></html>",
    });
    expect(result.success).toBe(true);
  });
});

// =====================================================
// Social Preview
// =====================================================
describe("Social Preview", () => {
  it("should have correct metadata", () => {
    expect(socialPreview.meta.id).toBe("web/social-preview");
    expect(socialPreview.meta.category).toBe("web");
  });

  it("should generate social preview from OG tags", async () => {
    const html = `<head>
      <meta property="og:title" content="My Article">
      <meta property="og:description" content="Great content">
      <meta property="og:image" content="https://example.com/img.jpg">
    </head>`;
    const result = await executeTool(socialPreview, { input: html });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toContain(
        "My Article"
      );
    }
  });

  it("should not append ellipsis to og:description under 60 chars", async () => {
    const html = `<head>
      <meta property="og:title" content="Short">
      <meta property="og:description" content="Short desc">
    </head>`;
    const result = await executeTool(socialPreview, { input: html });
    expect(result.success).toBe(true);
    if (result.success) {
      const output = String((result.data as Record<string, unknown>).output);
      expect(output).toContain("Short desc");
      expect(output).not.toContain("Short desc...");
    }
  });
});

// =====================================================
// CSP Builder
// =====================================================
describe("CSP Builder", () => {
  it("should have correct metadata", () => {
    expect(cspBuilder.meta.id).toBe("web/csp-builder");
    expect(cspBuilder.meta.category).toBe("web");
  });

  it("should generate CSP header with defaults", async () => {
    const result = await executeTool(cspBuilder, {});
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toContain(
        "default-src"
      );
      expect((result.data as Record<string, unknown>).output).toContain(
        "script-src"
      );
      expect((result.data as Record<string, unknown>).output).toContain(
        "'self'"
      );
    }
  });

  it("should include upgrade-insecure-requests by default", async () => {
    const result = await executeTool(cspBuilder, {});
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toContain(
        "upgrade-insecure-requests"
      );
    }
  });
});

// =====================================================
// CSP Validator
// =====================================================
describe("CSP Validator", () => {
  it("should have correct metadata", () => {
    expect(cspValidator.meta.id).toBe("web/csp-validator");
    expect(cspValidator.meta.category).toBe("web");
  });

  it("should validate a valid CSP header", async () => {
    const result = await executeTool(cspValidator, {
      input:
        "default-src 'self'; script-src 'self' https://cdn.example.com; style-src 'self' 'unsafe-inline'",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).valid).toBe(true);
      expect(
        (result.data as Record<string, unknown>).directives
      ).toBeGreaterThan(0);
    }
  });

  it("should detect unsafe-inline warnings", async () => {
    const result = await executeTool(cspValidator, {
      input: "default-src 'self'; script-src 'unsafe-inline' 'unsafe-eval'",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(
        (result.data as Record<string, unknown>).warnings.length
      ).toBeGreaterThan(0);
    }
  });
});

// =====================================================
// CORS Builder
// =====================================================
describe("CORS Builder", () => {
  it("should have correct metadata", () => {
    expect(corsBuilder.meta.id).toBe("web/cors-builder");
    expect(corsBuilder.meta.category).toBe("web");
  });

  it("should generate CORS headers with defaults", async () => {
    const result = await executeTool(corsBuilder, {});
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toContain(
        "Access-Control-Allow-Origin"
      );
      expect((result.data as Record<string, unknown>).output).toContain("*");
    }
  });

  it("should generate with specific origin", async () => {
    const result = await executeTool(corsBuilder, {
      allowOrigin: "https://myapp.com",
      allowCredentials: true,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toContain(
        "https://myapp.com"
      );
    }
  });
});

// =====================================================
// SRI Hash Generator
// =====================================================
describe("SRI Hash Generator", () => {
  it("should have correct metadata", () => {
    expect(sriHashGenerator.meta.id).toBe("web/sri-hash-generator");
    expect(sriHashGenerator.meta.category).toBe("web");
  });

  it("should generate SRI hashes for content", async () => {
    const result = await executeTool(sriHashGenerator, {
      input: "console.log('hello');",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).hash256).toBeDefined();
      expect((result.data as Record<string, unknown>).hash384).toBeDefined();
      expect((result.data as Record<string, unknown>).hash512).toBeDefined();
      expect((result.data as Record<string, unknown>).output).toContain(
        "integrity"
      );
    }
  });

  it("should produce different hashes for different content", async () => {
    const r1 = await executeTool(sriHashGenerator, { input: "alert(1)" });
    const r2 = await executeTool(sriHashGenerator, { input: "alert(2)" });
    expect(r1.success).toBe(true);
    expect(r2.success).toBe(true);
    if (r1.success && r2.success) {
      expect((r1.data as Record<string, unknown>).hash256).not.toBe(
        (r2.data as Record<string, unknown>).hash256
      );
    }
  });
});

// =====================================================
// Security Headers Check
// =====================================================
describe("Security Headers Check", () => {
  it("should have correct metadata", () => {
    expect(securityHeadersCheck.meta.id).toBe("web/security-headers-check");
    expect(securityHeadersCheck.meta.category).toBe("web");
  });

  it("should analyze headers with good security", async () => {
    const headers = `Content-Security-Policy: default-src 'self'
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
Strict-Transport-Security: max-age=31536000`;
    const result = await executeTool(securityHeadersCheck, { input: headers });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).score).toBeGreaterThan(0);
      expect(
        (result.data as Record<string, unknown>).present.length
      ).toBeGreaterThan(0);
    }
  });

  it("should detect missing security headers", async () => {
    const result = await executeTool(securityHeadersCheck, {
      input: "Content-Type: text/html",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(
        (result.data as Record<string, unknown>).missing.length
      ).toBeGreaterThan(0);
    }
  });
});

// =====================================================
// HSTS Builder
// =====================================================
describe("HSTS Builder", () => {
  it("should have correct metadata", () => {
    expect(hstsBuilder.meta.id).toBe("web/hsts-builder");
    expect(hstsBuilder.meta.category).toBe("web");
  });

  it("should generate HSTS header with defaults", async () => {
    const result = await executeTool(hstsBuilder, {});
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toContain(
        "max-age=31536000"
      );
      expect((result.data as Record<string, unknown>).output).toContain(
        "includeSubDomains"
      );
    }
  });

  it("should include preload when enabled", async () => {
    const result = await executeTool(hstsBuilder, { preload: true });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toContain(
        "preload"
      );
    }
  });
});

// =====================================================
// Permissions Policy Builder
// =====================================================
describe("Permissions Policy Builder", () => {
  it("should have correct metadata", () => {
    expect(permissionsPolicyBuilder.meta.id).toBe(
      "web/permissions-policy-builder"
    );
    expect(permissionsPolicyBuilder.meta.category).toBe("web");
  });

  it("should generate permissions policy with defaults", async () => {
    const result = await executeTool(permissionsPolicyBuilder, {});
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toContain(
        "camera"
      );
      expect((result.data as Record<string, unknown>).output).toContain(
        "microphone"
      );
    }
  });

  it("should allow camera for self", async () => {
    const result = await executeTool(permissionsPolicyBuilder, {
      camera: "self",
      microphone: "none",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toContain(
        "camera"
      );
    }
  });
});

// =====================================================
// XSS Filter Tester
// =====================================================
describe("XSS Filter Tester", () => {
  it("should have correct metadata", () => {
    expect(xssFilterTester.meta.id).toBe("web/xss-filter-tester");
    expect(xssFilterTester.meta.category).toBe("web");
  });

  it("should detect script tag XSS", async () => {
    const result = await executeTool(xssFilterTester, {
      input: '<script>alert("xss")</script>',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).safe).toBe(false);
      expect(
        (result.data as Record<string, unknown>).threats.length
      ).toBeGreaterThan(0);
      expect((result.data as Record<string, unknown>).sanitized).toBeDefined();
    }
  });

  it("should mark safe text as safe", async () => {
    const result = await executeTool(xssFilterTester, { input: "Hello world" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).safe).toBe(true);
      expect((result.data as Record<string, unknown>).threats).toHaveLength(0);
    }
  });

  it("should detect event handler XSS", async () => {
    const result = await executeTool(xssFilterTester, {
      input: '<img src="x" onerror="alert(1)">',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).safe).toBe(false);
    }
  });
});
