import { test, expect, getEventTypes } from "./helpers";

test.describe("Navigation", () => {
  test("navigates between all pages using header nav links", async ({
    page,
  }) => {
    // Start at home page
    await page.goto("/");
    await expect(
      page.getByRole("heading", { name: "Available Event Types" })
    ).toBeVisible();

    // Click "Create Event Type" nav link
    await page.getByRole("link", { name: "Create Event Type" }).click();
    await page.waitForURL("/admin/event-types/new");
    await expect(
      page.getByRole("heading", { name: "Create Event Type" })
    ).toBeVisible();

    // Click "Upcoming Bookings" nav link
    await page.getByRole("link", { name: "Upcoming Bookings" }).click();
    await page.waitForURL("/admin/bookings");
    await expect(
      page.getByRole("heading", { name: "Upcoming Bookings" })
    ).toBeVisible();

    // Click "Event Types" nav link to go back home
    await page.getByRole("link", { name: "Event Types" }).click();
    await page.waitForURL("/");
    await expect(
      page.getByRole("heading", { name: "Available Event Types" })
    ).toBeVisible();
  });

  test("clicking Book button navigates to booking page", async ({ page }) => {
    await page.goto("/");

    // Get event types to know the expected ID
    const eventTypes = await getEventTypes();
    expect(eventTypes.length).toBeGreaterThan(0);

    // Click the first Book button
    await page.getByRole("link", { name: "Book" }).first().click();

    // Should be on a /book/:id page
    await expect(page).toHaveURL(/\/book\//);

    // Verify booking page content loads
    await expect(page.getByText("1. Pick a date")).toBeVisible();
  });

  test("'Back to Event Types' link on booking page navigates home", async ({
    page,
  }) => {
    const eventTypes = await getEventTypes();
    const eventType = eventTypes[0];

    await page.goto(`/book/${eventType.id}`);
    await expect(page.getByText("← Back to Event Types")).toBeVisible();

    await page.getByText("← Back to Event Types").click();
    await page.waitForURL("/");
    await expect(
      page.getByRole("heading", { name: "Available Event Types" })
    ).toBeVisible();
  });

  test("app logo/title link navigates to home", async ({ page }) => {
    await page.goto("/admin/bookings");

    // Click the "📞 Call Booking" brand link
    await page.getByRole("link", { name: /Call Booking/ }).click();
    await page.waitForURL("/");
    await expect(
      page.getByRole("heading", { name: "Available Event Types" })
    ).toBeVisible();
  });
});

