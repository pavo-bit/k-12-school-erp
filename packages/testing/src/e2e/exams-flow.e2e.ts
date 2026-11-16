import { test, expect } from "@playwright/test";

test.describe("Exams Flow E2E Tests", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("http://localhost:3000");
  });

  test("should create exam term", async ({ page }) => {
    await page.goto("http://localhost:3000/api/v1/exams/terms");

    await page.click("button:has-text('Create Exam Term')");

    await page.fill('input[name="name"]', "Term 1");
    await page.fill('input[name="startDate"]', "2026-09-01");
    await page.fill('input[name="endDate"]', "2026-12-15");
    await page.selectOption('select[name="status"]', "active");

    await page.click('button[type="submit"]');

    await expect(page.locator("text=Exam term created successfully")).toBeVisible();
  });

  test("should create exam", async ({ page }) => {
    await page.goto("http://localhost:3000/api/v1/exams");

    await page.click("button:has-text('Create Exam')");

    await page.selectOption('select[name="termId"]', "test-term-id");
    await page.fill('input[name="name"]', "Mid Term Exam");
    await page.selectOption('select[name="type"]', "theory");
    await page.selectOption('select[name="status"]', "draft");

    await page.click('button[type="submit"]');

    await expect(page.locator("text=Exam created successfully")).toBeVisible();
  });

  test("should create exam subject", async ({ page }) => {
    await page.goto("http://localhost:3000/api/v1/exams/subjects");

    await page.click("button:has-text('Create Exam Subject')");

    await page.selectOption('select[name="examId"]', "test-exam-id");
    await page.selectOption('select[name="classId"]', "test-class-id");
    await page.selectOption('select[name="subjectId"]', "test-subject-id");
    await page.fill('input[name="maxMarks"]', "100");
    await page.fill('input[name="passMarks"]', "40");

    await page.click('button[type="submit"]');

    await expect(page.locator("text=Exam subject created successfully")).toBeVisible();
  });

  test("should enter marks", async ({ page }) => {
    await page.goto("http://localhost:3000/api/v1/exams/marks");

    await page.click("button:has-text('Enter Marks')");

    await page.selectOption('select[name="examSubjectId"]', "test-exam-subject-id");
    await page.selectOption('select[name="studentId"]', "test-student-id");
    await page.fill('input[name="theoryMarks"]', "85");
    await page.fill('input[name="practicalMarks"]', "15");

    await page.click('button[type="submit"]');

    await expect(page.locator("text=Marks entered successfully")).toBeVisible();
  });

  test("should list exam terms", async ({ page }) => {
    await page.goto("http://localhost:3000/api/v1/exams/terms");

    await expect(page.locator("text=Exam Terms")).toBeVisible();
    await expect(page.locator("table")).toBeVisible();

    await expect(page.locator("th:has-text('Name')")).toBeVisible();
    await expect(page.locator("th:has-text('Start Date')")).toBeVisible();
    await expect(page.locator("th:has-text('End Date')")).toBeVisible();
    await expect(page.locator("th:has-text('Status')")).toBeVisible();
  });

  test("should list exams", async ({ page }) => {
    await page.goto("http://localhost:3000/api/v1/exams");

    await expect(page.locator("text=Exams")).toBeVisible();
    await expect(page.locator("table")).toBeVisible();

    await expect(page.locator("th:has-text('Name')")).toBeVisible();
    await expect(page.locator("th:has-text('Type')")).toBeVisible();
    await expect(page.locator("th:has-text('Status')")).toBeVisible();
  });

  test("should filter exams by term", async ({ page }) => {
    await page.goto("http://localhost:3000/api/v1/exams?termId=test-term-id");

    await expect(page.locator("text=Filtering by term")).toBeVisible();
  });

  test("should show exam details", async ({ page }) => {
    await page.goto("http://localhost:3000/api/v1/exams");

    await page.click("table tbody tr:first-child");

    await expect(page.locator("text=Exam Details")).toBeVisible();
    await expect(page.locator("text=Name")).toBeVisible();
    await expect(page.locator("text=Type")).toBeVisible();
    await expect(page.locator("text=Status")).toBeVisible();
  });

  test("should handle form validation errors", async ({ page }) => {
    await page.goto("http://localhost:3000/api/v1/exams/terms");

    await page.click("button:has-text('Create Exam Term')");

    await page.click('button[type="submit"]');

    await expect(page.locator("text=Name is required")).toBeVisible();
    await expect(page.locator("text=Start Date is required")).toBeVisible();
    await expect(page.locator("text=End Date is required")).toBeVisible();
  });

  test("should handle exam status transitions", async ({ page }) => {
    await page.goto("http://localhost:3000/api/v1/exams");

    await page.click("table tbody tr:first-child");

    await page.selectOption('select[name="status"]', "scheduled");

    await page.click('button[type="submit"]');

    await expect(page.locator("text=Exam updated successfully")).toBeVisible();
  });

  test("should show marks list", async ({ page }) => {
    await page.goto("http://localhost:3000/api/v1/exams/marks?examSubjectId=test-exam-subject-id");

    await expect(page.locator("text=Marks")).toBeVisible();
    await expect(page.locator("table")).toBeVisible();

    await expect(page.locator("th:has-text('Student')")).toBeVisible();
    await expect(page.locator("th:has-text('Theory Marks')")).toBeVisible();
    await expect(page.locator("th:has-text('Total Marks')")).toBeVisible();
    await expect(page.locator("th:has-text('Grade')")).toBeVisible();
  });

  test("should show results list", async ({ page }) => {
    await page.goto("http://localhost:3000/api/v1/exams/marks?examId=test-exam-id");

    await expect(page.locator("text=Results")).toBeVisible();
    await expect(page.locator("table")).toBeVisible();

    await expect(page.locator("th:has-text('Student')")).toBeVisible();
    await expect(page.locator("th:has-text('Total Marks')")).toBeVisible();
    await expect(page.locator("th:has-text('Percentage')")).toBeVisible();
    await expect(page.locator("th:has-text('Grade')")).toBeVisible();
    await expect(page.locator("th:has-text('Status')")).toBeVisible();
  });

  test("should create report card", async ({ page }) => {
    await page.goto("http://localhost:3000/api/v1/exams/report-cards");

    await page.click("button:has-text('Create Report Card')");

    await page.selectOption('select[name="examId"]', "test-exam-id");
    await page.selectOption('select[name="studentId"]', "test-student-id");
    await page.selectOption('select[name="templateId"]', "test-template-id");
    await page.fill('input[name="objectPath"]', "/reports/card-001.pdf");
    await page.selectOption('select[name="status"]', "draft");

    await page.click('button[type="submit"]');

    await expect(page.locator("text=Report card created successfully")).toBeVisible();
  });

  test("should handle different exam types", async ({ page }) => {
    await page.goto("http://localhost:3000/api/v1/exams");

    const types = ["theory", "practical", "both", "internal", "external"];

    for (const type of types) {
      await page.click("button:has-text('Create Exam')");
      await page.selectOption('select[name="termId"]', "test-term-id");
      await page.fill('input[name="name"]', `Exam ${type}`);
      await page.selectOption('select[name="type"]', type);
      await page.selectOption('select[name="status"]', "draft");
      await page.click('button[type="submit"]');

      await expect(page.locator("text=Exam created successfully")).toBeVisible();

      await page.goto("http://localhost:3000/api/v1/exams");
    }
  });

  test("should handle different mark statuses", async ({ page }) => {
    await page.goto("http://localhost:3000/api/v1/exams/marks");

    const statuses = ["draft", "submitted", "approved"];

    for (const status of statuses) {
      await page.click("button:has-text('Enter Marks')");
      await page.selectOption('select[name="examSubjectId"]', "test-exam-subject-id");
      await page.selectOption('select[name="studentId"]', "test-student-id");
      await page.fill('input[name="theoryMarks"]', "75");
      await page.selectOption('select[name="status"]', status);
      await page.click('button[type="submit"]');

      await expect(page.locator("text=Marks entered successfully")).toBeVisible();

      await page.goto("http://localhost:3000/api/v1/exams/marks");
    }
  });

  test("should show exam summary", async ({ page }) => {
    await page.goto("http://localhost:3000/api/v1/exams");

    await expect(page.locator("text=Exam Summary")).toBeVisible();
    await expect(page.locator("text=Total Exams")).toBeVisible();
    await expect(page.locator("text=Active Exams")).toBeVisible();
    await expect(page.locator("text=Completed Exams")).toBeVisible();
  });

  test("should persist data across page refreshes", async ({ page }) => {
    await page.goto("http://localhost:3000/api/v1/exams/terms");
    await page.click("button:has-text('Create Exam Term')");
    await page.fill('input[name="name"]', "Term 2");
    await page.fill('input[name="startDate"]', "2027-01-01");
    await page.fill('input[name="endDate"]', "2027-03-31");
    await page.selectOption('select[name="status"]', "active");
    await page.click('button[type="submit"]');

    await expect(page.locator("text=Exam term created successfully")).toBeVisible();

    await page.reload();

    await expect(page.locator("text=Term 2")).toBeVisible();
  });

  test("should handle concurrent operations", async ({ page }) => {
    await page.goto("http://localhost:3000/api/v1/exams");

    await page.click("button:has-text('Create Exam')");
    await page.selectOption('select[name="termId"]', "test-term-id");
    await page.fill('input[name="name"]', "Exam 1");
    await page.selectOption('select[name="type"]', "theory");
    await page.selectOption('select[name="status"]', "draft");
    await page.click('button[type="submit"]');

    await page.click("button:has-text('Create Exam')");
    await page.selectOption('select[name="termId"]', "test-term-id");
    await page.fill('input[name="name"]', "Exam 2");
    await page.selectOption('select[name="type"]', "practical");
    await page.selectOption('select[name="status"]', "draft");
    await page.click('button[type="submit"]');

    await expect(page.locator("text=Exam 1")).toBeVisible();
    await expect(page.locator("text=Exam 2")).toBeVisible();
  });

  test("should show grade calculation", async ({ page }) => {
    await page.goto("http://localhost:3000/api/v1/exams/marks");

    await page.click("table tbody tr:first-child");

    await expect(page.locator("text=Grade")).toBeVisible();
    await expect(page.locator("text=Percentage")).toBeVisible();
    await expect(page.locator("text=Result Status")).toBeVisible();
  });
});
