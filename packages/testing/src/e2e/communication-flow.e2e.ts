import { test, expect } from "@playwright/test";

test.describe("Communication Flow E2E Tests", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("http://localhost:3000");
  });

  test("should create announcement", async ({ page }) => {
    await page.goto("http://localhost:3000/api/v1/communication/announcements");

    await page.click("button:has-text('Create Announcement')");

    await page.fill('input[name="title"]', "School Holiday Notice");
    await page.fill('textarea[name="body"]', "School will be closed on Monday");
    await page.selectOption('select[name="audience"]', "all");
    await page.selectOption('select[name="status"]', "draft");

    await page.click('button[type="submit"]');

    await expect(page.locator("text=Announcement created successfully")).toBeVisible();
  });

  test("should create notification template", async ({ page }) => {
    await page.goto("http://localhost:3000/api/v1/communication/templates");

    await page.click("button:has-text('Create Template')");

    await page.fill('input[name="key"]', "welcome_email");
    await page.selectOption('select[name="channel"]', "email");
    await page.fill('input[name="language"]', "en");
    await page.fill('input[name="subject"]', "Welcome to School");
    await page.fill('textarea[name="body"]', "Welcome {{studentName}} to our school");
    await page.selectOption('select[name="status"]', "active");

    await page.click('button[type="submit"]');

    await expect(page.locator("text=Template created successfully")).toBeVisible();
  });

  test("should list announcements", async ({ page }) => {
    await page.goto("http://localhost:3000/api/v1/communication/announcements");

    await expect(page.locator("text=Announcements")).toBeVisible();
    await expect(page.locator("table")).toBeVisible();

    await expect(page.locator("th:has-text('Title')")).toBeVisible();
    await expect(page.locator("th:has-text('Audience')")).toBeVisible();
    await expect(page.locator("th:has-text('Status')")).toBeVisible();
  });

  test("should filter announcements by status", async ({ page }) => {
    await page.goto("http://localhost:3000/api/v1/communication/announcements?status=sent");

    await expect(page.locator("text=Filtering by status: Sent")).toBeVisible();
  });

  test("should show announcement details", async ({ page }) => {
    await page.goto("http://localhost:3000/api/v1/communication/announcements");

    await page.click("table tbody tr:first-child");

    await expect(page.locator("text=Announcement Details")).toBeVisible();
    await expect(page.locator("text=Title")).toBeVisible();
    await expect(page.locator("text=Body")).toBeVisible();
    await expect(page.locator("text=Audience")).toBeVisible();
    await expect(page.locator("text=Status")).toBeVisible();
  });

  test("should handle form validation errors", async ({ page }) => {
    await page.goto("http://localhost:3000/api/v1/communication/announcements");

    await page.click("button:has-text('Create Announcement')");

    await page.click('button[type="submit"]');

    await expect(page.locator("text=Title is required")).toBeVisible();
    await expect(page.locator("text=Body is required")).toBeVisible();
  });

  test("should handle announcement status transitions", async ({ page }) => {
    await page.goto("http://localhost:3000/api/v1/communication/announcements");

    await page.click("table tbody tr:first-child");

    await page.selectOption('select[name="status"]', "sent");

    await page.click('button[type="submit"]');

    await expect(page.locator("text=Announcement updated successfully")).toBeVisible();
  });

  test("should handle different audience types", async ({ page }) => {
    await page.goto("http://localhost:3000/api/v1/communication/announcements");

    const audiences = ["all", "staff", "parents", "students"];

    for (const audience of audiences) {
      await page.click("button:has-text('Create Announcement')");
      await page.fill('input[name="title"]', `Announcement for ${audience}`);
      await page.fill('textarea[name="body"]', `This is for ${audience}`);
      await page.selectOption('select[name="audience"]', audience);
      await page.selectOption('select[name="status"]', "draft");
      await page.click('button[type="submit"]');

      await expect(page.locator("text=Announcement created successfully")).toBeVisible();

      await page.goto("http://localhost:3000/api/v1/communication/announcements");
    }
  });

  test("should handle different announcement statuses", async ({ page }) => {
    await page.goto("http://localhost:3000/api/v1/communication/announcements");

    const statuses = ["draft", "scheduled", "sent", "cancelled"];

    for (const status of statuses) {
      await page.click("button:has-text('Create Announcement')");
      await page.fill('input[name="title"]', `Announcement ${status}`);
      await page.fill('textarea[name="body"]', `This is ${status}`);
      await page.selectOption('select[name="audience"]', "all");
      await page.selectOption('select[name="status"]', status);
      await page.click('button[type="submit"]');

      await expect(page.locator("text=Announcement created successfully")).toBeVisible();

      await page.goto("http://localhost:3000/api/v1/communication/announcements");
    }
  });

  test("should handle scheduled announcements", async ({ page }) => {
    await page.goto("http://localhost:3000/api/v1/communication/announcements");

    await page.click("button:has-text('Create Announcement')");
    await page.fill('input[name="title"]', "Scheduled Announcement");
    await page.fill('textarea[name="body"]', "This is scheduled");
    await page.selectOption('select[name="audience"]', "all");
    await page.selectOption('select[name="status"]', "scheduled");
    await page.fill('input[name="scheduledAt"]', "2026-11-25");

    await page.click('button[type="submit"]');

    await expect(page.locator("text=Announcement created successfully")).toBeVisible();
  });

  test("should show communication summary", async ({ page }) => {
    await page.goto("http://localhost:3000/api/v1/communication/announcements");

    await expect(page.locator("text=Communication Summary")).toBeVisible();
    await expect(page.locator("text=Total Announcements")).toBeVisible();
    await expect(page.locator("text=Sent")).toBeVisible();
    await expect(page.locator("text=Scheduled")).toBeVisible();
    await expect(page.locator("text=Drafts")).toBeVisible();
  });

  test("should persist data across page refreshes", async ({ page }) => {
    await page.goto("http://localhost:3000/api/v1/communication/announcements");
    await page.click("button:has-text('Create Announcement')");
    await page.fill('input[name="title"]', "Persistent Announcement");
    await page.fill('textarea[name="body"]', "This should persist");
    await page.selectOption('select[name="audience"]', "all");
    await page.selectOption('select[name="status"]', "draft");
    await page.click('button[type="submit"]');

    await expect(page.locator("text=Announcement created successfully")).toBeVisible();

    await page.reload();

    await expect(page.locator("text=Persistent Announcement")).toBeVisible();
  });

  test("should handle concurrent operations", async ({ page }) => {
    await page.goto("http://localhost:3000/api/v1/communication/announcements");

    await page.click("button:has-text('Create Announcement')");
    await page.fill('input[name="title"]', "Announcement 1");
    await page.fill('textarea[name="body"]', "Body 1");
    await page.selectOption('select[name="audience"]', "all");
    await page.selectOption('select[name="status"]', "draft");
    await page.click('button[type="submit"]');

    await page.click("button:has-text('Create Announcement')");
    await page.fill('input[name="title"]', "Announcement 2");
    await page.fill('textarea[name="body"]', "Body 2");
    await page.selectOption('select[name="audience"]', "staff");
    await page.selectOption('select[name="status"]', "draft");
    await page.click('button[type="submit"]');

    await expect(page.locator("text=Announcement 1")).toBeVisible();
    await expect(page.locator("text=Announcement 2")).toBeVisible();
  });
});
