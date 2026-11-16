import { test, expect } from "@playwright/test";

test.describe("Admissions Flow E2E Tests", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("http://localhost:3000");
  });

  test("should create enquiry", async ({ page }) => {
    await page.goto("http://localhost:3000/api/v1/admissions/enquiries");

    await page.click("button:has-text('Create Enquiry')");

    await page.fill('input[name="studentName"]', "John Doe");
    await page.fill('input[name="guardianPhone"]', "+919876543210");
    await page.fill('input[name="classSought"]', "Class 10");
    await page.selectOption('select[name="source"]', "website");
    await page.selectOption('select[name="status"]', "new");

    await page.click('button[type="submit"]');

    await expect(page.locator("text=Enquiry created successfully")).toBeVisible();
  });

  test("should create application", async ({ page }) => {
    await page.goto("http://localhost:3000/api/v1/admissions/applications");

    await page.click("button:has-text('Create Application')");

    await page.selectOption('select[name="enquiryId"]', "test-enquiry-id");
    await page.selectOption('select[name="academicYearId"]', "test-academic-year-id");
    await page.selectOption('select[name="status"]', "draft");

    await page.click('button[type="submit"]');

    await expect(page.locator("text=Application created successfully")).toBeVisible();
  });

  test("should create conversion", async ({ page }) => {
    await page.goto("http://localhost:3000/api/v1/admissions/conversions");

    await page.click("button:has-text('Create Conversion')");

    await page.selectOption('select[name="applicationId"]', "test-application-id");
    await page.selectOption('select[name="convertedStudentId"]', "test-student-id");
    await page.fill('input[name="convertedAt"]', "2026-11-15");

    await page.click('button[type="submit"]');

    await expect(page.locator("text=Conversion created successfully")).toBeVisible();
  });

  test("should list enquiries", async ({ page }) => {
    await page.goto("http://localhost:3000/api/v1/admissions/enquiries");

    await expect(page.locator("text=Enquiries")).toBeVisible();
    await expect(page.locator("table")).toBeVisible();

    await expect(page.locator("th:has-text('Student Name')")).toBeVisible();
    await expect(page.locator("th:has-text('Guardian Phone')")).toBeVisible();
    await expect(page.locator("th:has-text('Class Sought')")).toBeVisible();
    await expect(page.locator("th:has-text('Status')")).toBeVisible();
  });

  test("should list applications", async ({ page }) => {
    await page.goto("http://localhost:3000/api/v1/admissions/applications");

    await expect(page.locator("text=Applications")).toBeVisible();
    await expect(page.locator("table")).toBeVisible();

    await expect(page.locator("th:has-text('Enquiry')")).toBeVisible();
    await expect(page.locator("th:has-text('Academic Year')")).toBeVisible();
    await expect(page.locator("th:has-text('Status')")).toBeVisible();
  });

  test("should filter enquiries by status", async ({ page }) => {
    await page.goto("http://localhost:3000/api/v1/admissions/enquiries?status=new");

    await expect(page.locator("text=Filtering by status: New")).toBeVisible();
  });

  test("should filter applications by status", async ({ page }) => {
    await page.goto("http://localhost:3000/api/v1/admissions/applications?status=draft");

    await expect(page.locator("text=Filtering by status: Draft")).toBeVisible();
  });

  test("should show enquiry details", async ({ page }) => {
    await page.goto("http://localhost:3000/api/v1/admissions/enquiries");

    await page.click("table tbody tr:first-child");

    await expect(page.locator("text=Enquiry Details")).toBeVisible();
    await expect(page.locator("text=Student Name")).toBeVisible();
    await expect(page.locator("text=Guardian Phone")).toBeVisible();
    await expect(page.locator("text=Class Sought")).toBeVisible();
    await expect(page.locator("text=Source")).toBeVisible();
  });

  test("should handle form validation errors", async ({ page }) => {
    await page.goto("http://localhost:3000/api/v1/admissions/enquiries");

    await page.click("button:has-text('Create Enquiry')");

    await page.click('button[type="submit"]');

    await expect(page.locator("text=Student Name is required")).toBeVisible();
    await expect(page.locator("text=Guardian Phone is required")).toBeVisible();
    await expect(page.locator("text=Class Sought is required")).toBeVisible();
  });

  test("should handle enquiry status transitions", async ({ page }) => {
    await page.goto("http://localhost:3000/api/v1/admissions/enquiries");

    await page.click("table tbody tr:first-child");

    await page.selectOption('select[name="status"]', "contacted");

    await page.click('button[type="submit"]');

    await expect(page.locator("text=Enquiry updated successfully")).toBeVisible();
  });

  test("should handle application status transitions", async ({ page }) => {
    await page.goto("http://localhost:3000/api/v1/admissions/applications");

    await page.click("table tbody tr:first-child");

    await page.selectOption('select[name="status"]', "submitted");

    await page.click('button[type="submit"]');

    await expect(page.locator("text=Application updated successfully")).toBeVisible();
  });

  test("should show admissions summary", async ({ page }) => {
    await page.goto("http://localhost:3000/api/v1/admissions/enquiries");

    await expect(page.locator("text=Admissions Summary")).toBeVisible();
    await expect(page.locator("text=Total Enquiries")).toBeVisible();
    await expect(page.locator("text=New Enquiries")).toBeVisible();
    await expect(page.locator("text=Converted")).toBeVisible();
  });

  test("should handle different enquiry sources", async ({ page }) => {
    await page.goto("http://localhost:3000/api/v1/admissions/enquiries");

    const sources = ["website", "walk_in", "referral", "advertisement", "other"];

    for (const source of sources) {
      await page.click("button:has-text('Create Enquiry')");
      await page.fill('input[name="studentName"]', `Student ${source}`);
      await page.fill('input[name="guardianPhone"]', "+919876543211");
      await page.fill('input[name="classSought"]', "Class 9");
      await page.selectOption('select[name="source"]', source);
      await page.selectOption('select[name="status"]', "new");
      await page.click('button[type="submit"]');

      await expect(page.locator("text=Enquiry created successfully")).toBeVisible();

      await page.goto("http://localhost:3000/api/v1/admissions/enquiries");
    }
  });

  test("should handle different application statuses", async ({ page }) => {
    await page.goto("http://localhost:3000/api/v1/admissions/applications");

    const statuses = ["draft", "submitted", "review", "interview", "selected", "rejected"];

    for (const status of statuses) {
      await page.click("button:has-text('Create Application')");
      await page.selectOption('select[name="enquiryId"]', "test-enquiry-id");
      await page.selectOption('select[name="academicYearId"]', "test-academic-year-id");
      await page.selectOption('select[name="status"]', status);
      await page.click('button[type="submit"]');

      await expect(page.locator("text=Application created successfully")).toBeVisible();

      await page.goto("http://localhost:3000/api/v1/admissions/applications");
    }
  });

  test("should persist data across page refreshes", async ({ page }) => {
    await page.goto("http://localhost:3000/api/v1/admissions/enquiries");
    await page.click("button:has-text('Create Enquiry')");
    await page.fill('input[name="studentName"]', "Jane Smith");
    await page.fill('input[name="guardianPhone"]', "+919876543212");
    await page.fill('input[name="classSought"]', "Class 8");
    await page.selectOption('select[name="source"]', "referral");
    await page.selectOption('select[name="status"]', "new");
    await page.click('button[type="submit"]');

    await expect(page.locator("text=Enquiry created successfully")).toBeVisible();

    await page.reload();

    await expect(page.locator("text=Jane Smith")).toBeVisible();
  });

  test("should handle concurrent operations", async ({ page }) => {
    await page.goto("http://localhost:3000/api/v1/admissions/enquiries");

    await page.click("button:has-text('Create Enquiry')");
    await page.fill('input[name="studentName"]', "Alice Johnson");
    await page.fill('input[name="guardianPhone"]', "+919876543213");
    await page.fill('input[name="classSought"]', "Class 7");
    await page.selectOption('select[name="source"]', "website");
    await page.selectOption('select[name="status"]', "new");
    await page.click('button[type="submit"]');

    await page.click("button:has-text('Create Enquiry')");
    await page.fill('input[name="studentName"]', "Bob Wilson");
    await page.fill('input[name="guardianPhone"]', "+919876543214");
    await page.fill('input[name="classSought"]', "Class 6");
    await page.selectOption('select[name="source"]', "walk_in");
    await page.selectOption('select[name="status"]', "new");
    await page.click('button[type="submit"]');

    await expect(page.locator("text=Alice Johnson")).toBeVisible();
    await expect(page.locator("text=Bob Wilson")).toBeVisible();
  });

  test("should show enquiry conversion flow", async ({ page }) => {
    await page.goto("http://localhost:3000/api/v1/admissions/enquiries");

    await page.click("table tbody tr:first-child");

    await page.selectOption('select[name="status"]', "converted");

    await page.click('button[type="submit"]');

    await expect(page.locator("text=Enquiry updated successfully")).toBeVisible();
  });
});
