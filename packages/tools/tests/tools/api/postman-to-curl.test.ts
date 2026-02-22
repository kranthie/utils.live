import { describe, it, expect } from "vitest";
import { postmanToCurl } from "../../../src/tools/api/postman-to-curl";
import { executeTool } from "../../../src/core/executor";

const sampleCollection = {
  info: { name: "Test Collection" },
  item: [
    {
      name: "Get Users",
      request: {
        method: "GET",
        url: "https://api.example.com/users",
        header: [{ key: "Accept", value: "application/json" }],
      },
    },
    {
      name: "Create User",
      request: {
        method: "POST",
        url: "https://api.example.com/users",
        header: [
          { key: "Content-Type", value: "application/json" },
        ],
        body: {
          mode: "raw",
          raw: '{"name":"Alice"}',
        },
      },
    },
  ],
};

describe("postmanToCurl", () => {
  it("should have correct metadata", () => {
    expect(postmanToCurl.meta.id).toBe("api/postman-to-curl");
    expect(postmanToCurl.meta.category).toBe("api");
  });

  it("should convert Postman collection to cURL commands", async () => {
    const result = await executeTool(postmanToCurl, {
      input: JSON.stringify(sampleCollection),
    });
    expect(result.success).toBe(true);
    if (result.success) {
      const output = (result.data as { output: string }).output;
      expect(output).toContain("# Test Collection");
      expect(output).toContain("curl");
      expect(output).toContain("https://api.example.com/users");
    }
  });

  it("should include headers", async () => {
    const result = await executeTool(postmanToCurl, {
      input: JSON.stringify(sampleCollection),
    });
    expect(result.success).toBe(true);
    if (result.success) {
      const output = (result.data as { output: string }).output;
      expect(output).toContain("-H 'Accept: application/json'");
    }
  });

  it("should include body for POST requests", async () => {
    const result = await executeTool(postmanToCurl, {
      input: JSON.stringify(sampleCollection),
    });
    expect(result.success).toBe(true);
    if (result.success) {
      const output = (result.data as { output: string }).output;
      expect(output).toContain("-X POST");
      expect(output).toContain("-d");
      expect(output).toContain("Alice");
    }
  });

  it("should handle URL-encoded body", async () => {
    const collection = {
      info: { name: "Test" },
      item: [
        {
          name: "Form Post",
          request: {
            method: "POST",
            url: "https://api.example.com/login",
            body: {
              mode: "urlencoded",
              urlencoded: [
                { key: "username", value: "admin" },
                { key: "password", value: "secret" },
              ],
            },
          },
        },
      ],
    };
    const result = await executeTool(postmanToCurl, {
      input: JSON.stringify(collection),
    });
    expect(result.success).toBe(true);
    if (result.success) {
      const output = (result.data as { output: string }).output;
      expect(output).toContain("username=admin");
      expect(output).toContain("password=secret");
    }
  });

  it("should handle nested folders", async () => {
    const collection = {
      info: { name: "Nested" },
      item: [
        {
          name: "Auth",
          item: [
            {
              name: "Login",
              request: { method: "POST", url: "https://api.example.com/login" },
            },
          ],
        },
      ],
    };
    const result = await executeTool(postmanToCurl, {
      input: JSON.stringify(collection),
    });
    expect(result.success).toBe(true);
    if (result.success) {
      const output = (result.data as { output: string }).output;
      expect(output).toContain("Auth/Login");
    }
  });

  it("should skip disabled headers", async () => {
    const collection = {
      info: { name: "Test" },
      item: [
        {
          name: "Request",
          request: {
            method: "GET",
            url: "https://api.example.com",
            header: [
              { key: "X-Enabled", value: "yes" },
              { key: "X-Disabled", value: "no", disabled: true },
            ],
          },
        },
      ],
    };
    const result = await executeTool(postmanToCurl, {
      input: JSON.stringify(collection),
    });
    expect(result.success).toBe(true);
    if (result.success) {
      const output = (result.data as { output: string }).output;
      expect(output).toContain("X-Enabled");
      expect(output).not.toContain("X-Disabled");
    }
  });

  it("should fail on empty input", async () => {
    const result = await executeTool(postmanToCurl, { input: "" });
    expect(result.success).toBe(false);
  });

  it("should fail on invalid JSON", async () => {
    const result = await executeTool(postmanToCurl, { input: "not json" });
    expect(result.success).toBe(false);
  });

  it("should fail on empty collection", async () => {
    const result = await executeTool(postmanToCurl, {
      input: JSON.stringify({ item: [] }),
    });
    expect(result.success).toBe(false);
  });
});
