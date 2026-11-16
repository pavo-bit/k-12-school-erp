import { test, expect } from "@playwright/test";

test.describe("Platform Flow E2E Tests", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the web app
    await page.goto("http://localhost:3000");
  });

  test("should create organization", async ({ page }) => {
    // Navigate to organizations page
    await page.goto("http://localhost:3000/api/v1/platform/organizations");

    // Click create button
    await page.click("button:has-text('Create Organization')");

    // Fill form
    await page.fill('input[name="name"]', "Test Organization");
    await page.fill('input[name="billingEmail"]', "billing@test.com");

    // Submit form
    await page.click('button[type="submit"]');

    // Verify success
    await expect(page.locator("text=Organization created successfully")).toBeVisible();
  });

  test("should create school", async ({ page }) => {
    // Navigate to schools page
    await page.goto("http://localhost:3000/api/v1/platform/schools");

    // Click create button
    await page.click("button:has-text('Create School')");

    // Fill form
    await page.fill('input[name="name"]', "Test School");
    await page.fill('input[name="slug"]', "test-school");
    await page.selectOption('select[name="board"]', "CBSE");
    await page.selectOption('select[name="timezone"]', "Asia/Kolkata");
    await page.selectOption('select[name="locale"]', "en");

    // Submit form
    await page.click('button[type="submit"]');

    // Verify success
    await expect(page.locator("text=School created successfully")).toBeVisible();
  });

  test("should create academic year", async ({ page }) => {
    // Navigate to academic years page
    await page.goto("http://localhost:3000/api/v1/platform/academic-years");

    // Click create button
    await page.click("button:has-text('Create Academic Year')");

    // Fill form
    await page.fill('input[name="name"]', "2026-2027");
    await page.fill('input[name="startDate"]', "2026-06-01T00:00:00Z");
    await page.fill('input[name="endDate"]', "2027-05-31T23:59:59Z");
    await page.selectOption('select[name="status"]', "active");

    // Submit form
    await page.click('button[type="submit"]');

    // Verify success
    await expect(page.locator("text=Academic year created successfully")).toBeVisible();
  });

  test("should list all organizations", async ({ page }) => {
    // Navigate to organizations page
    await page.goto("http://localhost:3000/api/v1/platform/organizations");

    // Verify list is displayed
    await expect(page.locator("text=Organizations")).toBeVisible();
    await expect(page.locator("table")).toBeVisible();
  });

  test("should list all schools", async ({ page }) => {
    // Navigate to schools page
    await page.goto("http://localhost:3000/api/v1/platform/schools");

    // Verify list is displayed
    await expect(page.locator("text=Schools")).toBeVisible();
    await expect(page.locator("table")).toBeVisible();
  });

  test("should filter schools by organization", async ({ page }) => {
    // Navigate to schools page
    await page.goto("http://localhost:3000/api/v1/platform/schools?organizationId=test-org-id");

    // Verify filter is applied
    await expect(page.locator("text=Filtering by organization")).toBeVisible();
  });

  test("should handle form validation errors", async ({ page }) => {
    // Navigate to create organization page
    await page.goto("http://localhost:3000/api/v1/platform/organizations");

    // Click create button
    await page.click("button:has-text('Create Organization')");

    // Submit empty form
    await page.click('button[type="submit"]');

    // Verify validation errors
    await expect(page.locator("text=Name is required")).toBeVisible();
    await expect(page.locator("text=Invalid email address")).toBeVisible();
  });

  test("should show loading states", async ({ page }) => {
    // Navigate to organizations page
    await page.goto("http://localhost:3000/api/v1/platform/organizations");

    // Click create button
    await page.click("button:has-text('Create Organization')");

    // Verify loading state
    await expect(page.locator(".loading")).toBeVisible();

    // Wait for form to load
    await page.waitForSelector("form", { timeout: 5000 });

    // Verify loading state is gone
    await expect(page.locator(".loading")).not.toBeVisible();
  });

  test("should handle API errors gracefully", async ({ page }) => {
    // Navigate to organizations page
    await page.goto("http://localhost:3000/api/v1/platform/organizations");

    // Try to create organization with invalid data
    await page.click("button:has-text('Create Organization')");
    await page.fill('input[name="name"]', "Test");
    await page.fill('input[name="billingEmail"]', "invalid-email");
    await page.click('button[type="submit"]');

    // Verify error message
    await expect(page.locator("text=Invalid email address")).toBeVisible();
  });

  test("should persist data across page refreshes", async ({ page }) => {
    // Create organization
    await page.goto("http://localhost:3000/api/v1/platform/organizations");
    await page.click("button:has-text('Create Organization')");
    await page.fill('input[name="name"]', "Persistent Test Org");
    await page.fill('input[name="billingEmail"]', "persistent@test.com");
    await page.click('button[type="submit"]');

    // Wait for success
    await expect(page.locator("text=Organization created successfully")).toBeVisible();

    // Refresh page
    await page.reload();

    // Verify organization is still listed
    await expect(page.locator("text=Persistent Test Org")).toBeVisible();
  });

  test("should handle concurrent operations", async ({ page }) => {
    // Create organization 1
    await page.goto("http://localhost:3000/api/v1/platform/organizations");
    await page.click("button:has-text('Create Organization')");
    await page.fill('input[name="name"]', "Concurrent Org 1");
    await page.fill('input[name="billingEmail"]', "concurrent1@test.com");
    await page.click('button[type="submit"]');

    // Create organization 2
    await page.click("button:has-text('Create Organization')");
    await page.fill('input[name="name"]', "Concurrent Org 2");
    await page.fill('input[name="billingEmail"]', "concurrent2@test.com");
    await page.click('button[type="submit"]');

    // Verify both organizations were created
    await expect(page.locator("text=Concurrent Org 1")).toBeVisible();
    await expect(page.locator("text=Concurrent Org 2")).toBeVisible();
  });
});
