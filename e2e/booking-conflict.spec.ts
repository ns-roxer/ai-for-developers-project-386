import {
  test,
  expect,
  getEventTypes,
  getAvailableSlots,
  createBookingAPI,
  getDatePlusDays,
  TEST_GUEST,
  API_BASE,
} from "./helpers";

test.describe("Booking Conflict (409)", () => {
  test("UI shows a clear conflict message when the chosen slot was just taken", async ({
    page,
  }) => {
    const eventTypes = await getEventTypes();
    const eventType = eventTypes[0];

    const date = getDatePlusDays(2);
    const slots = await getAvailableSlots(eventType.id, date);
    expect(slots.length).toBeGreaterThan(0);

    const targetSlot = slots[0];
    const targetTimeHHMM = new Date(targetSlot.startTime).toLocaleTimeString(
      [],
      { hour: "2-digit", minute: "2-digit", hour12: false }
    );

    await page.goto(`/book/${eventType.id}`);

    const dayNum = new Date(date).getDate();
    await page
      .getByRole("gridcell", { name: String(dayNum) })
      .first()
      .click();

    await page.waitForSelector('button:has-text(":")', { timeout: 10_000 });

    await createBookingAPI({
      eventTypeId: eventType.id,
      startTime: targetSlot.startTime,
      guestName: "Conflict Pre-book",
      guestEmail: "prebook@test.example",
    });

    const slotButton = page
      .locator('button:has-text(":")')
      .filter({ hasText: targetTimeHHMM })
      .first();
    await expect(slotButton).toBeVisible();
    await slotButton.click();

    await page.getByLabel("Name").fill(TEST_GUEST.name);
    await page.getByLabel("Email").fill(TEST_GUEST.email);
    await page.getByRole("button", { name: "Confirm Booking" }).click();

    await expect(page.getByText(/already booked/i).first()).toBeVisible({
      timeout: 10_000,
    });

    await expect(
      page.getByRole("heading", { name: /Booking Confirmed/i })
    ).toHaveCount(0);

    await expect(
      page.getByRole("button", { name: /Confirm Booking/i })
    ).toBeEnabled();
  });

  test("booked slot is removed from the available-slots list and a duplicate POST returns 409", async ({
    page: _page,
  }) => {
    const eventTypes = await getEventTypes();
    const eventType = eventTypes[0];

    const date = getDatePlusDays(3);
    const slots = await getAvailableSlots(eventType.id, date);
    expect(slots.length).toBeGreaterThan(0);

    const targetSlot = slots[0];

    await createBookingAPI({
      eventTypeId: eventType.id,
      startTime: targetSlot.startTime,
      guestName: "First Booker",
      guestEmail: "first@test.example",
    });

    const slotsAfter = await getAvailableSlots(eventType.id, date);
    expect(
      slotsAfter.some((s) => s.startTime === targetSlot.startTime)
    ).toBe(false);

    const res = await fetch(`${API_BASE}/bookings`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        eventTypeId: eventType.id,
        startTime: targetSlot.startTime,
        guestName: "Second Booker",
        guestEmail: "second@test.example",
      }),
    });

    expect(res.status).toBe(409);
    const body = await res.json();
    expect(body).toHaveProperty("code");
    expect(body).toHaveProperty("message");
    expect(String(body.message)).toMatch(/already booked/i);
  });
});
