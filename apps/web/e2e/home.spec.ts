import { test, expect } from "@playwright/test";

test.describe("Home Page", () => {
  test("should display the landing page", async ({ page }) => {
    await page.goto("/");

    // Check for main heading
    await expect(
      page.getByRole("heading", { name: /developer utilities,?\s*instantly/i })
    ).toBeVisible();

    // Check for utils.live branding in header
    await expect(page.getByText("utils.live").first()).toBeVisible();
  });

  test("should display categories section", async ({ page }) => {
    await page.goto("/");

    await expect(
      page.getByRole("heading", { name: /browse by category/i })
    ).toBeVisible();

    // Check for some category cards
    await expect(
      page.getByRole("link", { name: /JSON.*tools/i })
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: /Text.*tools/i })
    ).toBeVisible();
  });

  test("should display tool demo section", async ({ page }) => {
    await page.goto("/");

    await expect(
      page.getByRole("heading", { name: /see it in action/i })
    ).toBeVisible();
  });
});
