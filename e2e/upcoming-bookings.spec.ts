import {
  test,
  expect,
  getEventTypes,
  getAvailableSlots,
  createBookingAPI,
  getTomorrowDate,
  getDatePlusDays,
  TEST_GUEST,
} from "./helpers";

test.describe("Upcoming Bookings (Admin)", () => {
  test("displays a booking created via the API", async ({ page }) => {
    // 1. Create a booking directly through the API
    const eventTypes = await getEventTypes();
    expect(eventTypes.length).toBeGreaterThan(0);
    const eventType = eventTypes[0];

    const tomorrow = getTomorrowDate();
    const slots = await getAvailableSlots(eventType.id, tomorrow);
    expect(slots.length).toBeGreaterThan(0);

    // Pick the last available slot to reduce conflict with other tests
    const slot = slots[slots.length - 1];
    const guestName = `Admin Test ${Date.now()}`;

    await createBookingAPI({
      eventTypeId: eventType.id,
      startTime: slot.startTime,
      guestName,
      guestEmail: TEST_GUEST.email,
    });

    // 2. Navigate to the upcoming bookings admin page
    await page.goto("/admin/bookings");

    // 3. Verify the page heading
    await expect(
      page.getByRole("heading", { name: "Upcoming Bookings" })
    ).toBeVisible();

    // 4. The table should show the booking we just created
    await expect(page.getByText(guestName)).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText(TEST_GUEST.email)).toBeVisible();
    await expect(page.getByText(eventType.name)).toBeVisible();
  });

  test("shows table headers correctly", async ({ page }) => {
    await page.goto("/admin/bookings");

    await expect(
      page.getByRole("heading", { name: "Upcoming Bookings" })
    ).toBeVisible();

    // Wait for table or "No upcoming bookings" message
    const hasTable = await page.locator("table").isVisible().catch(() => false);
    const hasEmpty = await page
      .getByText("No upcoming bookings")
      .isVisible()
      .catch(() => false);

    if (hasTable) {
      await expect(page.getByRole("columnheader", { name: "Event Type" })).toBeVisible();
      await expect(page.getByRole("columnheader", { name: "Guest Name" })).toBeVisible();
      await expect(page.getByRole("columnheader", { name: "Guest Email" })).toBeVisible();
      await expect(page.getByRole("columnheader", { name: "Start" })).toBeVisible();
      await expect(page.getByRole("columnheader", { name: "End" })).toBeVisible();
    } else {
      // It's fine if there are no bookings yet
      expect(hasEmpty).toBeTruthy();
    }
  });

  test("bookings are sorted by start time (earliest first)", async ({
    page,
  }) => {
    const eventTypes = await getEventTypes();
    const eventType = eventTypes[0];

    // Create a booking for day+6 (later)
    const laterDate = getDatePlusDays(6);
    const laterSlots = await getAvailableSlots(eventType.id, laterDate);
    expect(laterSlots.length).toBeGreaterThan(0);
    const laterGuestName = `Later Booking ${Date.now()}`;
    await createBookingAPI({
      eventTypeId: eventType.id,
      startTime: laterSlots[0].startTime,
      guestName: laterGuestName,
      guestEmail: "later@test.example",
    });

    // Create a booking for day+5 (earlier)
    const earlierDate = getDatePlusDays(5);
    const earlierSlots = await getAvailableSlots(eventType.id, earlierDate);
    expect(earlierSlots.length).toBeGreaterThan(0);
    const earlierGuestName = `Earlier Booking ${Date.now()}`;
    await createBookingAPI({
      eventTypeId: eventType.id,
      startTime: earlierSlots[0].startTime,
      guestName: earlierGuestName,
      guestEmail: "earlier@test.example",
    });

    // Navigate to upcoming bookings
    await page.goto("/admin/bookings");
    await expect(page.locator("table")).toBeVisible({ timeout: 10_000 });

    // Get all rows and find positions of our two bookings
    const rows = page.locator("tbody tr");
    const allText = await rows.allTextContents();

    const earlierIndex = allText.findIndex((t) =>
      t.includes(earlierGuestName)
    );
    const laterIndex = allText.findIndex((t) => t.includes(laterGuestName));

    // Both should exist
    expect(earlierIndex).toBeGreaterThanOrEqual(0);
    expect(laterIndex).toBeGreaterThanOrEqual(0);

    // Earlier booking should appear before later booking
    expect(earlierIndex).toBeLessThan(laterIndex);
  });

  test("displays event type name column correctly for each booking", async ({
    page,
  }) => {
    const eventTypes = await getEventTypes();
    // Use second event type (30 min) to differentiate
    const eventType = eventTypes.length > 1 ? eventTypes[1] : eventTypes[0];

    const date = getDatePlusDays(7);
    const slots = await getAvailableSlots(eventType.id, date);
    expect(slots.length).toBeGreaterThan(0);

    const guestName = `EventName Check ${Date.now()}`;
    await createBookingAPI({
      eventTypeId: eventType.id,
      startTime: slots[0].startTime,
      guestName,
      guestEmail: "namecheck@test.example",
    });

    await page.goto("/admin/bookings");
    await expect(page.getByText(guestName)).toBeVisible({ timeout: 10_000 });

    // The row with our guest should also show the event type name
    const row = page.locator("tbody tr", { hasText: guestName });
    await expect(row.getByText(eventType.name)).toBeVisible();
  });
});

