import { test, expect } from "@playwright/test";

test.describe("Reports Flow E2E Tests", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("http://localhost:3000");
  });

  test("should create report", async ({ page }) => {
    await page.goto("http://localhost:3000/api/v1/reports");

    await page.click("button:has-text('Create Report')");

    await page.selectOption('select[name="type"]', "attendance");
    await page.fill('input[name="name"]', "Attendance Report");
    await page.fill('textarea[name="description"]', "Monthly attendance report");
    await page.selectOption('select[name="schedule"]', "none");

    await page.click('button[type="submit"]');

    await expect(page.locator("text=Report created successfully")).toBeVisible();
  });

  test("should create report export", async ({ page }) => {
    await page.goto("http://localhost:3000/api/v1/reports/exports");

    await page.click("button:has-text('Create Export')");

    await page.selectOption('select[name="reportId"]', "test-report-id");
    await page.selectOption('select[name="format"]', "csv");
    await page.fill('input[name="startDate"]', "2026-11-01");
    await page.fill('input[name="endDate"]', "2026-11-30");

    await page.click('button[type="submit"]');

    await expect(page.locator("text=Export created successfully")).toBeVisible();
  });

  test("should create scheduled report", async ({ page }) => {
    await page.goto("http://localhost:3000/api/v1/reports/scheduled-reports");

    await page.click("button:has-text('Create Scheduled Report')");

    await page.selectOption('select[name="reportId"]', "test-report-id");
    await page.fill('input[name="recipients"]', "admin@school.com");
    await page.selectOption('select[name="frequency"]', "weekly");
    await page.fill('input[name="dayOfWeek"]', "1");
    await page.fill('input[name="time"]', "09:00");

    await page.click('button[type="submit"]');

    await expect(page.locator("text=Scheduled report created successfully")).toBeVisible();
  });

  test("should create dashboard", async ({ page }) => {
    await page.goto("http://localhost:3000/api/v1/reports/dashboards");

    await page.click("button:has-text('Create Dashboard')");

    await page.fill('input[name="name"]', "Main Dashboard");

    await page.click('button[type="submit"]');

    await expect(page.locator("text=Dashboard created successfully")).toBeVisible();
  });

  test("should create dashboard widget", async ({ page }) => {
    await page.goto("http://localhost:3000/api/v1/reports/dashboards/widgets");

    await page.click("button:has-text('Create Widget')");

    await page.selectOption('select[name="dashboardId"]', "test-dashboard-id");
    await page.selectOption('select[name="type"]', "stat_card");
    await page.fill('input[name="title"]', "Total Students");
    await page.fill('input[name="dataSource"]', "enrollment");

    await page.click('button[type="submit"]');

    await expect(page.locator("text=Widget created successfully")).toBeVisible();
  });

  test("should list reports", async ({ page }) => {
    await page.goto("http://localhost:3000/api/v1/reports");

    await expect(page.locator("text=Reports")).toBeVisible();
    await expect(page.locator("table")).toBeVisible();

    await expect(page.locator("th:has-text('Name')")).toBeVisible();
    await expect(page.locator("th:has-text('Type')")).toBeVisible();
    await expect(page.locator("th:has-text('Schedule')")).toBeVisible();
  });

  test("should list report exports", async ({ page }) => {
    await page.goto("http://localhost:3000/api/v1/reports/exports");

    await expect(page.locator("text=Report Exports")).toBeVisible();
    await expect(page.locator("table")).toBeVisible();

    await expect(page.locator("th:has-text('Format')")).toBeVisible();
    await expect(page.locator("th:has-text('Status')")).toBeVisible();
    await expect(page.locator("th:has-text('Start Date')")).toBeVisible();
    await expect(page.locator("th:has-text('End Date')")).toBeVisible();
  });

  test("should list scheduled reports", async ({ page }) => {
    await page.goto("http://localhost:3000/api/v1/reports/scheduled-reports");

    await expect(page.locator("text=Scheduled Reports")).toBeVisible();
    await expect(page.locator("table")).toBeVisible();

    await expect(page.locator("th:has-text('Frequency')")).toBeVisible();
    await expect(page.locator("th:has-text('Recipients')")).toBeVisible();
    await expect(page.locator("th:has-text('Next Run')")).toBeVisible();
  });

  test("should list dashboards", async ({ page }) => {
    await page.goto("http://localhost:3000/api/v1/reports/dashboards");

    await expect(page.locator("text=Dashboards")).toBeVisible();
    await expect(page.locator("table")).toBeVisible();

    await expect(page.locator("th:has-text('Name')")).toBeVisible();
    await expect(page.locator("th:has-text('Widgets')")).toBeVisible();
  });

  test("should filter reports by type", async ({ page }) => {
    await page.goto("http://localhost:3000/api/v1/reports?type=attendance");

    await expect(page.locator("text=Filtering by type: Attendance")).toBeVisible();
  });

  test("should show report details", async ({ page }) => {
    await page.goto("http://localhost:3000/api/v1/reports");

    await page.click("table tbody tr:first-child");

    await expect(page.locator("text=Report Details")).toBeVisible();
    await expect(page.locator("text=Name")).toBeVisible();
    await expect(page.locator("text=Type")).toBeVisible();
    await expect(page.locator("text=Schedule")).toBeVisible();
  });

  test("should handle form validation errors", async ({ page }) => {
    await page.goto("http://localhost:3000/api/v1/reports");

    await page.click("button:has-text('Create Report')");

    await page.click('button[type="submit"]');

    await expect(page.locator("text=Type is required")).toBeVisible();
    await expect(page.locator("text=Name is required")).toBeVisible();
  });

  test("should handle different report types", async ({ page }) => {
    await page.goto("http://localhost:3000/api/v1/reports");

    const types = ["attendance", "fee_collection", "enrollment", "exam_results", "student_list", "custom"];

    for (const type of types) {
      await page.click("button:has-text('Create Report')");
      await page.selectOption('select[name="type"]', type);
      await page.fill('input[name="name"]', `Report ${type}`);
      await page.selectOption('select[name="schedule"]', "none");
      await page.click('button[type="submit"]');

      await expect(page.locator("text=Report created successfully")).toBeVisible();

      await page.goto("http://localhost:3000/api/v1/reports");
    }
  });

  test("should handle different export formats", async ({ page }) => {
    await page.goto("http://localhost:3000/api/v1/reports/exports");

    const formats = ["csv", "xlsx", "pdf"];

    for (const format of formats) {
      await page.click("button:has-text('Create Export')");
      await page.selectOption('select[name="reportId"]', "test-report-id");
      await page.selectOption('select[name="format"]', format);
      await page.fill('input[name="startDate"]', "2026-11-01");
      await page.fill('input[name="endDate"]', "2026-11-30");
      await page.click('button[type="submit"]');

      await expect(page.locator("text=Export created successfully")).toBeVisible();

      await page.goto("http://localhost:3000/api/v1/reports/exports");
    }
  });

  test("should handle different scheduled report frequencies", async ({ page }) => {
    await page.goto("http://localhost:3000/api/v1/reports/scheduled-reports");

    const frequencies = ["daily", "weekly", "monthly"];

    for (const frequency of frequencies) {
      await page.click("button:has-text('Create Scheduled Report')");
      await page.selectOption('select[name="reportId"]', "test-report-id");
      await page.fill('input[name="recipients"]', "admin@school.com");
      await page.selectOption('select[name="frequency"]', frequency);
      await page.click('button[type="submit"]');

      await expect(page.locator("text=Scheduled report created successfully")).toBeVisible();

      await page.goto("http://localhost:3000/api/v1/reports/scheduled-reports");
    }
  });

  test("should handle different widget types", async ({ page }) => {
    await page.goto("http://localhost:3000/api/v1/reports/dashboards/widgets");

    const types = ["stat_card", "line_chart", "bar_chart", "pie_chart", "table", "kpi"];

    for (const type of types) {
      await page.click("button:has-text('Create Widget')");
      await page.selectOption('select[name="dashboardId"]', "test-dashboard-id");
      await page.selectOption('select[name="type"]', type);
      await page.fill('input[name="title"]', `Widget ${type}`);
      await page.fill('input[name="dataSource"]', "enrollment");
      await page.click('button[type="submit"]');

      await expect(page.locator("text=Widget created successfully")).toBeVisible();

      await page.goto("http://localhost:3000/api/v1/reports/dashboards/widgets");
    }
  });

  test("should show reports summary", async ({ page }) => {
    await page.goto("http://localhost:3000/api/v1/reports");

    await expect(page.locator("text=Reports Summary")).toBeVisible();
    await expect(page.locator("text=Total Reports")).toBeVisible();
    await expect(page.locator("text=Scheduled Reports")).toBeVisible();
    await expect(page.locator("text=Recent Exports")).toBeVisible();
  });

  test("should persist data across page refreshes", async ({ page }) => {
    await page.goto("http://localhost:3000/api/v1/reports");
    await page.click("button:has-text('Create Report')");
    await page.selectOption('select[name="type"]', "enrollment");
    await page.fill('input[name="name"]', "Enrollment Report");
    await page.selectOption('select[name="schedule"]', "none");
    await page.click('button[type="submit"]');

    await expect(page.locator("text=Report created successfully")).toBeVisible();

    await page.reload();

    await expect(page.locator("text=Enrollment Report")).toBeVisible();
  });

  test("should handle concurrent operations", async ({ page }) => {
    await page.goto("http://localhost:3000/api/v1/reports");

    await page.click("button:has-text('Create Report')");
    await page.selectOption('select[name="type"]', "attendance");
    await page.fill('input[name="name"]', "Report 1");
    await page.selectOption('select[name="schedule"]', "none");
    await page.click('button[type="submit"]');

    await page.click("button:has-text('Create Report')");
    await page.selectOption('select[name="type"]', "fee_collection");
    await page.fill('input[name="name"]', "Report 2");
    await page.selectOption('select[name="schedule"]', "none");
    await page.click('button[type="submit"]');

    await expect(page.locator("text=Report 1")).toBeVisible();
    await expect(page.locator("text=Report 2")).toBeVisible();
  });

  test("should handle report update", async ({ page }) => {
    await page.goto("http://localhost:3000/api/v1/reports");

    await page.click("table tbody tr:first-child");

    await page.fill('input[name="name"]', "Updated Report Name");

    await page.click('button[type="submit"]');

    await expect(page.locator("text=Report updated successfully")).toBeVisible();
  });
});
