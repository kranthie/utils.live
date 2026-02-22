import type { Page } from "@playwright/test";
import { test, expect } from "@playwright/test";

/**
 * E2E tests for tool execution.
 *
 * All tested tools are CLIENT tier with auto-execution on a 300ms debounce.
 * Input is provided via the Monaco editor (contenteditable lines within
 * a div[role="textbox"]).  Output appears in a second Monaco editor inside
 * the output panel after the debounce fires and execution completes.
 */

/** Helper: type text into the Monaco input editor and wait for output. */
async function typeInputAndWaitForOutput(
  page: Page,
  text: string
): Promise<void> {
  // The input panel's Monaco editor is wrapped in a div with role="textbox"
  // whose aria-label starts with "Enter".  The output editor is read-only
  // and its wrapper has aria-readonly="true".
  const inputEditor = page
    .locator(
      '[role="textbox"][aria-readonly="false"], [role="textbox"]:not([aria-readonly])'
    )
    .first();

  // Click into the input editor to focus it.
  // force: true is needed because Monaco's view-lines and the sticky header
  // can intercept pointer events during Playwright's actionability checks.
  await inputEditor.click({ force: true });

  // Select all existing text and replace it
  await page.keyboard.press("ControlOrMeta+a");
  await page.keyboard.type(text, { delay: 5 });

  // Wait for the debounce (300ms) + execution time.  We detect completion
  // by looking for the "Success" status badge in the output panel header.
  await expect(page.locator("text=Success").first()).toBeVisible({
    timeout: 10000,
  });
}

/** Helper: extract the text content visible in the output Monaco editor. */
async function getOutputText(page: Page): Promise<string | null> {
  // The output panel is the second editor-wrapper; its Monaco view-lines
  // hold the rendered output.  We grab all visible lines.
  const outputWrapper = page.locator(".editor-wrapper").nth(1);
  const viewLines = outputWrapper.locator(".view-lines");
  await expect(viewLines).toBeVisible({ timeout: 10000 });
  return viewLines.textContent();
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

test.describe("Tool Execution", () => {
  test("JSON Formatter: pretty-prints minified JSON", async ({ page }) => {
    await page.goto("/tools/json/formatter");

    // Wait for the Monaco editor to load
    await expect(page.locator('[role="textbox"]').first()).toBeVisible({
      timeout: 15000,
    });

    await typeInputAndWaitForOutput(page, '{"name":"test","value":123}');

    const output = await getOutputText(page);

    // The formatted output should contain the keys on separate lines with indentation
    expect(output).toContain('"name"');
    expect(output).toContain('"test"');
    expect(output).toContain('"value"');
    expect(output).toContain("123");
  });

  test("Base64 Encode: encodes text to base64", async ({ page }) => {
    await page.goto("/tools/encoding/base64-encode");

    await expect(page.locator('[role="textbox"]').first()).toBeVisible({
      timeout: 15000,
    });

    await typeInputAndWaitForOutput(page, "Hello World");

    const output = await getOutputText(page);

    expect(output).toContain("SGVsbG8gV29ybGQ=");
  });

  test("Text Statistics: counts words correctly", async ({ page }) => {
    await page.goto("/tools/text/statistics");

    await expect(page.locator('[role="textbox"]').first()).toBeVisible({
      timeout: 15000,
    });

    await typeInputAndWaitForOutput(
      page,
      "The quick brown fox jumps over the lazy dog"
    );

    const output = await getOutputText(page);

    // Should report 9 words somewhere in the JSON output
    expect(output).toContain("9");
  });

  test("URL Encode: encodes special characters", async ({ page }) => {
    await page.goto("/tools/encoding/url-encode");

    await expect(page.locator('[role="textbox"]').first()).toBeVisible({
      timeout: 15000,
    });

    await typeInputAndWaitForOutput(page, "hello world & foo=bar");

    const output = await getOutputText(page);

    // URL encoding should convert spaces, ampersand, and equals sign
    expect(output).toContain("hello%20world");
    expect(output).toContain("%26");
    expect(output).toContain("%3D");
  });
});
