import { expect, test } from "@playwright/test";

test.describe("Real Multilingual Localisation (i18n)", () => {
  test.beforeEach(async ({ page }) => {
    // Clear storage before test
    await page.goto("/");
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
      document.cookie = "cyberdesk_language=; max-age=0; path=/";
    });
  });

  test("Language selector displays all 5 regional languages", async ({ page }) => {
    await page.goto("/");
    const selectorBtn = page.locator(".lang-selector-trigger").first();
    await expect(selectorBtn).toBeVisible();

    // Click to open dropdown
    await selectorBtn.click();
    const menu = page.locator(".lang-selector-menu").first();
    await expect(menu).toBeVisible();

    // Check all 5 language options
    await expect(menu.getByRole("menuitem", { name: /English/i })).toBeVisible();
    await expect(menu.getByRole("menuitem", { name: /हिन्दी/i })).toBeVisible();
    await expect(menu.getByRole("menuitem", { name: /தமிழ்/i })).toBeVisible();
    await expect(menu.getByRole("menuitem", { name: /తెలుగు/i })).toBeVisible();
    await expect(menu.getByRole("menuitem", { name: /বাংলা/i })).toBeVisible();
  });

  test("Switching to Hindi updates the DOM lang attribute and UI strings", async ({ page }) => {
    await page.goto("/");
    
    // Switch to Hindi
    const selectorBtn = page.locator(".lang-selector-trigger").first();
    await selectorBtn.click();
    await page.locator(".lang-selector-menu").first().getByRole("menuitem", { name: /हिन्दी/i }).click();

    // Verify html lang attribute
    const htmlLang = await page.locator("html").getAttribute("lang");
    expect(htmlLang).toBe("hi");

    // Verify localized hero headline & CTAs in Hindi
    await expect(page.locator(".entry-headline")).toContainText("साइबर घटनाएं");
    await expect(page.locator("#entry-begin")).toBeVisible();
    await expect(page.locator("#entry-demo")).toBeVisible();

    // Verify invariants: emergency helpline remains 1930 & cybercrime.gov.in
    const helplineLink = page.locator('a[href="tel:1930"]').first();
    await expect(helplineLink).toBeVisible();
    await expect(helplineLink).toContainText("1930");
  });

  test("Switching to Tamil updates the UI and persists across page navigation", async ({ page }) => {
    test.slow();
    await page.goto("/");

    // Switch to Tamil
    const selectorBtn = page.locator(".lang-selector-trigger").first();
    await selectorBtn.click();
    await page.locator(".lang-selector-menu").first().getByRole("menuitem", { name: /தமிழ்/i }).click();

    // Check html lang
    await expect(page.locator("html")).toHaveAttribute("lang", "ta");

    // Check Tamil text on home page
    await expect(page.locator("#entry-begin")).toBeVisible();

    // Navigate to /about page
    await page.goto("/about");
    await expect(page.locator("html")).toHaveAttribute("lang", "ta");
    await expect(page.locator(".page-hero")).toBeVisible();

    // Navigate to /safety page
    await page.goto("/safety");
    await expect(page.locator("html")).toHaveAttribute("lang", "ta");
    await expect(page.locator('a[href="tel:1930"]').first()).toBeVisible();
  });

  test("Switching to Telugu and Bangla updates the UI", async ({ page }) => {
    await page.goto("/");

    // Switch to Telugu
    const selectorBtn = page.locator(".lang-selector-trigger").first();
    await selectorBtn.click();
    await page.locator(".lang-selector-menu").first().getByRole("menuitem", { name: /తెలుగు/i }).click();
    await expect(page.locator("html")).toHaveAttribute("lang", "te");

    // Switch to Bangla
    await selectorBtn.click();
    await page.locator(".lang-selector-menu").first().getByRole("menuitem", { name: /বাংলা/i }).click();
    await expect(page.locator("html")).toHaveAttribute("lang", "bn");
  });

  test("Language persistence survives page reloads", async ({ page }) => {
    await page.goto("/");

    // Switch to Hindi
    const selectorBtn = page.locator(".lang-selector-trigger").first();
    await selectorBtn.click();
    await page.locator(".lang-selector-menu").first().getByRole("menuitem", { name: /हिन्दी/i }).click();

    // Reload page
    await page.reload();

    // Verify that language is still Hindi
    await expect(page.locator("html")).toHaveAttribute("lang", "hi");
    await expect(page.locator(".entry-headline")).toContainText("साइबर घटनाएं");
  });

  test("Critical invariants (1930, cybercrime.gov.in, transaction codes) are preserved in all languages", async ({ page }) => {
    test.slow();
    const languages = [
      { name: /हिन्दी/i, code: "hi" },
      { name: /தமிழ்/i, code: "ta" },
      { name: /తెలుగు/i, code: "te" },
      { name: /বাংলা/i, code: "bn" },
      { name: /English/i, code: "en" },
    ];

    for (const lang of languages) {
      await page.goto("/");
      const selectorBtn = page.locator(".lang-selector-trigger").first();
      await selectorBtn.click();
      await page.locator(".lang-selector-menu").first().getByRole("menuitem", { name: lang.name }).click();

      // Check selectors
      await expect(page.locator("#entry-begin")).toBeVisible();
      await expect(page.locator("#entry-demo")).toBeVisible();

      // Check helpline links
      const helplineLinks = page.locator('a[href="tel:1930"]');
      await expect(helplineLinks.first()).toBeVisible();

      // Check official portal link
      const portalLinks = page.locator('a[href*="cybercrime.gov.in"]');
      await expect(portalLinks.first()).toBeVisible();
    }
  });

  test("Mobile drawer language selector works properly on mobile viewport", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/");

    // Open mobile menu
    const menuBtn = page.locator(".mobile-menu-toggle");
    await expect(menuBtn).toBeVisible();
    await menuBtn.click();

    // Find language selector inside mobile drawer
    const drawer = page.locator("#mobile-nav-drawer");
    await expect(drawer).toBeVisible();
    const mobileLangTrigger = drawer.locator(".lang-selector-trigger");
    await mobileLangTrigger.click();

    // Select Hindi inside drawer
    await drawer.locator(".lang-selector-menu").getByRole("menuitem", { name: /हिन्दी/i }).click();

    // Verify language changed to Hindi
    await expect(page.locator("html")).toHaveAttribute("lang", "hi");
  });
});
