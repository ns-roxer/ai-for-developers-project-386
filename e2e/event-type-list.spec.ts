import { test, expect, SEED_EVENT_TYPES } from "./helpers";

test.describe("Event Type List Page", () => {
  test("displays seeded event types on the home page", async ({ page }) => {
    await page.goto("/");

    // The page title should be visible
    await expect(
      page.getByRole("heading", { name: "Available Event Types" })
    ).toBeVisible();

    // All three seeded event types should appear as cards
    for (const name of SEED_EVENT_TYPES) {
      await expect(page.getByText(name)).toBeVisible();
    }
  });

  test("each event type card has a Book button linking to /book/:id", async ({
    page,
  }) => {
    await page.goto("/");

    const bookButtons = page.getByRole("link", { name: "Book" });
    await bookButtons.first().waitFor({ timeout: 10_000 });
    const count = await bookButtons.count();
    expect(count).toBeGreaterThanOrEqual(SEED_EVENT_TYPES.length);

    // Click the first Book button and verify navigation
    const href = await bookButtons.first().getAttribute("href");
    expect(href).toMatch(/^\/book\//);
  });

  test("navigation links are present in the header", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByRole("link", { name: "Event Types" })).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Create Event Type" })
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Upcoming Bookings" })
    ).toBeVisible();
  });

  test("each event type card displays the duration in minutes", async ({
    page,
  }) => {
    await page.goto("/");

    // Wait for event types to load before checking duration text
    await page.getByRole("link", { name: "Book" }).first().waitFor({ timeout: 10_000 });

    // Seeded event types have 15, 30, and 60 min durations
    await expect(page.getByText("15 min")).toBeVisible();
    await expect(page.getByText("30 min")).toBeVisible();
    await expect(page.getByText("60 min")).toBeVisible();
  });

  test("event type cards display descriptions", async ({ page }) => {
    await page.goto("/");

    // Seeded descriptions from 002_seed.up.sql
    await expect(page.getByText("A quick check-in or intro call.")).toBeVisible();
    await expect(
      page.getByText("Standard consultation or demo session.")
    ).toBeVisible();
    await expect(
      page.getByText("In-depth discussion or workshop.")
    ).toBeVisible();
  });
});

