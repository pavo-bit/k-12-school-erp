import { test, expect } from "@playwright/test";

test.describe("Attendance Flow E2E Tests", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("http://localhost:3000");
  });

  test("should create attendance session", async ({ page }) => {
    await page.goto("http://localhost:3000/api/v1/attendance/sessions");

    await page.click("button:has-text('Create Session')");

    await page.selectOption('select[name="sectionId"]', "test-section-id");
    await page.fill('input[name="date"]', "2026-11-15");
    await page.selectOption('select[name="status"]', "open");

    await page.click('button[type="submit"]');

    await expect(page.locator("text=Session created successfully")).toBeVisible();
  });

  test("should mark attendance", async ({ page }) => {
    await page.goto("http://localhost:3000/api/v1/attendance/records");

    await page.click("button:has-text('Mark Attendance')");

    await page.selectOption('select[name="sessionId"]', "test-session-id");
    await page.selectOption('select[name="studentId"]', "test-student-id");
    await page.selectOption('select[name="status"]', "present");

    await page.click('button[type="submit"]');

    await expect(page.locator("text=Attendance marked successfully")).toBeVisible();
  });

  test("should list attendance sessions", async ({ page }) => {
    await page.goto("http://localhost:3000/api/v1/attendance/sessions");

    await expect(page.locator("text=Attendance Sessions")).toBeVisible();
    await expect(page.locator("table")).toBeVisible();

    await expect(page.locator("th:has-text('Section')")).toBeVisible();
    await expect(page.locator("th:has-text('Date')")).toBeVisible();
    await expect(page.locator("th:has-text('Status')")).toBeVisible();
  });

  test("should filter sessions by date", async ({ page }) => {
    await page.goto("http://localhost:3000/api/v1/attendance/sessions?date=2026-11-15");

    await expect(page.locator("text=Filtering by date")).toBeVisible();
  });

  test("should show attendance records", async ({ page }) => {
    await page.goto("http://localhost:3000/api/v1/attendance/records?sessionId=test-session-id");

    await expect(page.locator("text=Attendance Records")).toBeVisible();
    await expect(page.locator("table")).toBeVisible();

    await expect(page.locator("th:has-text('Student')")).toBeVisible();
    await expect(page.locator("th:has-text('Status')")).toBeVisible();
    await expect(page.locator("th:has-text('Time')")).toBeVisible();
  });

  test("should handle form validation errors", async ({ page }) => {
    await page.goto("http://localhost:3000/api/v1/attendance/sessions");

    await page.click("button:has-text('Create Session')");

    await page.click('button[type="submit"]');

    await expect(page.locator("text=Section is required")).toBeVisible();
    await expect(page.locator("text=Date is required")).toBeVisible();
  });

  test("should handle different attendance statuses", async ({ page }) => {
    await page.goto("http://localhost:3000/api/v1/attendance/records");

    const statuses = ["present", "absent", "late", "excused"];

    for (const status of statuses) {
      await page.click("button:has-text('Mark Attendance')");
      await page.selectOption('select[name="sessionId"]', "test-session-id");
      await page.selectOption('select[name="studentId"]', "test-student-id");
      await page.selectOption('select[name="status"]', status);
      await page.click('button[type="submit"]');

      await expect(page.locator("text=Attendance marked successfully")).toBeVisible();

      await page.goto("http://localhost:3000/api/v1/attendance/records");
    }
  });

  test("should show attendance summary", async ({ page }) => {
    await page.goto("http://localhost:3000/api/v1/attendance/sessions");

    await expect(page.locator("text=Attendance Summary")).toBeVisible();
    await expect(page.locator("text=Total Present")).toBeVisible();
    await expect(page.locator("text=Total Absent")).toBeVisible();
    await expect(page.locator("text=Attendance Rate")).toBeVisible();
  });

  test("should persist data across page refreshes", async ({ page }) => {
    await page.goto("http://localhost:3000/api/v1/attendance/sessions");
    await page.click("button:has-text('Create Session')");
    await page.selectOption('select[name="sectionId"]', "test-section-id");
    await page.fill('input[name="date"]', "2026-11-16");
    await page.selectOption('select[name="status"]', "open");
    await page.click('button[type="submit"]');

    await expect(page.locator("text=Session created successfully")).toBeVisible();

    await page.reload();

    await expect(page.locator("text=2026-11-16")).toBeVisible();
  });

  test("should handle concurrent operations", async ({ page }) => {
    await page.goto("http://localhost:3000/api/v1/attendance/records");

    await page.click("button:has-text('Mark Attendance')");
    await page.selectOption('select[name="sessionId"]', "test-session-id");
    await page.selectOption('select[name="studentId"]', "test-student-1");
    await page.selectOption('select[name="status"]', "present");
    await page.click('button[type="submit"]');

    await page.click("button:has-text('Mark Attendance')");
    await page.selectOption('select[name="sessionId"]', "test-session-id");
    await page.selectOption('select[name="studentId"]', "test-student-2");
    await page.selectOption('select[name="status"]', "absent");
    await page.click('button[type="submit"]');

    await expect(page.locator("text=Attendance marked successfully")).toBeVisible();
  });
});
