import { test, expect } from "@playwright/test";

test.describe("HR Flow E2E Tests", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("http://localhost:3000");
  });

  test("should create staff record", async ({ page }) => {
    // Navigate to HR page
    await page.goto("http://localhost:3000/api/v1/hr/staff");

    // Click create button
    await page.click("button:has-text('Create Staff')");

    // Fill form
    await page.fill('input[name="employeeCode"]', "EMP001");
    await page.fill('input[name="name"]', "John Doe");
    await page.selectOption('select[name="designationId"]', "test-designation");
    await page.selectOption('select[name="departmentId"]', "test-department");
    await page.fill('input[name="joiningDate"]', "2026-01-15");
    await page.selectOption('select[name="status"]', "active");

    // Submit form
    await page.click('button[type="submit"]');

    // Verify success
    await expect(page.locator("text=Staff created successfully")).toBeVisible();
  });

  test("should create leave request", async ({ page }) => {
    // Navigate to leave requests page
    await page.goto("http://localhost:3000/api/v1/hr/leave-requests");

    // Click create button
    await page.click("button:has-text('Create Leave Request')");

    // Fill form
    await page.fill('input[name="leaveTypeId"]', "test-leave-type");
    await page.fill('input[name="fromDate"]', "2026-11-20");
    await page.fill('input[name="toDate"]', "2026-11-25");
    await page.fill('input[name="daysRequested"]', "5");
    await page.fill('input[name="reason"]', "Medical leave");
    await page.selectOption('select[name="status"]', "pending");

    // Submit form
    await page.click('button[type="submit"]');

    // Verify success
    await expect(page.locator("text=Leave request created successfully")).toBeVisible();
  });

  test("should create salary structure", async ({ page }) => {
    // Navigate to salary structures page
    await page.goto("http://localhost:3000/api/v1/hr/salary-structures");

    // Click create button
    await page.click("button:has-text('Create Salary Structure')");

    // Fill form
    await page.fill('input[name="staffId"]', "test-staff-id");
    await page.fill('input[name="effectiveFrom"]', "2026-01-01");
    await page.selectOption('select[name="status"]', "active");

    // Add salary components
    await page.click('button:has-text("Add Component")');
    await page.selectOption('select[name="componentId"]', "test-component");
    await page.fill('input[name="amountPaise"]', "50000");
    await page.selectOption('select[name="type"]', "earning");

    // Submit form
    await page.click('button[type="submit"]');

    // Verify success
    await expect(page.locator("text=Salary structure created successfully")).toBeVisible();
  });

  test("should create payroll run", async ({ page }) => {
    // Navigate to payroll runs page
    await page.goto("http://localhost:3000/api/v1/hr/payroll-runs");

    // Click create button
    await page.click("button:has-text('Create Payroll Run')");

    // Fill form
    await page.fill('input[name="month"]', "11");
    await page.fill('input[name="year"]', "2026");
    await page.selectOption('select[name="status"]', "draft");
    await page.fill('input[name="preparedBy"]', "test-user-id");

    // Submit form
    await page.click('button[type="submit"]');

    // Verify success
    await expect(page.locator("text=Payroll run created successfully")).toBeVisible();
  });

  test("should list staff", async ({ page }) => {
    // Navigate to staff page
    await page.goto("http://localhost:3000/api/v1/hr/staff");

    // Verify list is displayed
    await expect(page.locator("text=Staff")).toBeVisible();
    await expect(page.locator("table")).toBeVisible();

    // Verify staff columns
    await expect(page.locator("th:has-text('Employee Code')")).toBeVisible();
    await expect(page.locator("th:has-text('Name')")).toBeVisible();
    await expect(page.locator("th:has-text('Status')")).toBeVisible();
    await expect(page.locator("th:has-text('Department')")).toBeVisible();
  });

  test("should list leave requests", async ({ page }) => {
    // Navigate to leave requests page
    await page.goto("http://localhost:3000/api/v1/hr/leave-requests");

    // Verify list is displayed
    await expect(page.locator("text=Leave Requests")).toBeVisible();
    await expect(page.locator("table")).toBeVisible();

    // Verify leave request columns
    await expect(page.locator("th:has-text('Leave Type')")).toBeVisible();
    await expect(page.locator("th:has-text('From Date')")).toBeVisible();
    await expect(page.locator("th:has-text('To Date')")).toBeVisible();
    await expect(page.locator("th:has-text('Status')")).toBeVisible();
  });

  test("should list payroll runs", async ({ page }) => {
    // Navigate to payroll runs page
    await page.goto("http://localhost:3000/api/v1/hr/payroll-runs");

    // Verify list is displayed
    await expect(page.locator("text=Payroll Runs")).toBeVisible();
    await expect(page.locator("table")).toBeVisible();

    // Verify payroll run columns
    await expect(page.locator("th:has-text('Month')")).toBeVisible();
    await expect(page.locator("th:has-text('Year')")).toBeVisible();
    await expect(page.locator("th:has-text('Status')")).toBeVisible();
  });

  test("should filter staff by status", async ({ page }) => {
    // Navigate to staff page
    await page.goto("http://localhost:3000/api/v1/hr/staff?status=active");

    // Verify filter is applied
    await expect(page.locator("text=Filtering by status: Active")).toBeVisible();
  });

  test("should filter payroll runs by month", async ({ page }) => {
    // Navigate to payroll runs page
    await page.goto("http://localhost:3000/api/v1/hr/payroll-runs?month=11");

    // Verify filter is applied
    await expect(page.locator("text=Filtering by month: 11")).toBeVisible();
  });

  test("should show staff details", async ({ page }) => {
    // Navigate to staff page
    await page.goto("http://localhost:3000/api/v1/hr/staff");

    // Click on first staff
    await page.click("table tbody tr:first-child");

    // Verify details are shown
    await expect(page.locator("text=Staff Details")).toBeVisible();
    await expect(page.locator("text=Employee Code")).toBeVisible();
    await expect(page.locator("text=Name")).toBeVisible();
    await expect(page.locator("text=Department")).toBeVisible();
  });

  test("should handle form validation errors", async ({ page }) => {
    // Navigate to create staff page
    await page.goto("http://localhost:3000/api/v1/hr/staff");

    // Click create button
    await page.click("button:has-text('Create Staff')");

    // Submit empty form
    await page.click('button[type="submit"]');

    // Verify validation errors
    await expect(page.locator("text=Employee Code is required")).toBeVisible();
    await expect(page.locator("text=Name is required")).toBeVisible();
    await expect(page.locator("text=Joining Date is required")).toBeVisible();
  });

  test("should show loading states", async ({ page }) => {
    // Navigate to staff page
    await page.goto("http://localhost:3000/api/v1/hr/staff");

    // Click create button
    await page.click("button:has-text('Create Staff')");

    // Verify loading state
    await expect(page.locator(".loading")).toBeVisible();

    // Wait for form to load
    await page.waitForSelector("form", { timeout: 5000 });

    // Verify loading state is gone
    await expect(page.locator(".loading")).not.toBeVisible();
  });

  test("should handle API errors gracefully", async ({ page }) => {
    // Navigate to staff page
    await page.goto("http://localhost:3000/api/v1/hr/staff");

    // Try to create staff with invalid data
    await page.click("button:has-text('Create Staff')");
    await page.fill('input[name="employeeCode"]', "EMP001");
    await page.fill('input[name="name"]', "John Doe");
    await page.selectOption('select[name="designationId"]', "test-designation");
    await page.selectOption('select[name="departmentId"]', "test-department");
    await page.fill('input[name="joiningDate"]', "invalid-date");
    await page.selectOption('select[name="status"]', "active");
    await page.click('button[type="submit"]');

    // Verify error message
    await expect(page.locator("text=Invalid date")).toBeVisible();
  });

  test("should persist data across page refreshes", async ({ page }) => {
    // Create staff
    await page.goto("http://localhost:3000/api/v1/hr/staff");
    await page.click("button:has-text('Create Staff')");
    await page.fill('input[name="employeeCode"]', "EMP002");
    await page.fill('input[name="name"]', "Jane Smith");
    await page.selectOption('select[name="designationId"]', "test-designation");
    await page.selectOption('select[name="departmentId"]', "test-department");
    await page.fill('input[name="joiningDate"]', "2026-02-01");
    await page.selectOption('select[name="status"]', "active");
    await page.click('button[type="submit"]');

    // Wait for success
    await expect(page.locator("text=Staff created successfully")).toBeVisible();

    // Refresh page
    await page.reload();

    // Verify staff is still listed
    await expect(page.locator("text=Jane Smith")).toBeVisible();
  });

  test("should handle concurrent operations", async ({ page }) => {
    // Create staff 1
    await page.goto("http://localhost:3000/api/v1/hr/staff");
    await page.click("button:has-text('Create Staff')");
    await page.fill('input[name="employeeCode"]', "EMP003");
    await page.fill('input[name="name"]', "Alice Johnson");
    await page.selectOption('select[name="designationId"]', "test-designation");
    await page.selectOption('select[name="departmentId"]', "test-department");
    await page.fill('input[name="joiningDate"]', "2026-03-01");
    await page.selectOption('select[name="status"]', "active");
    await page.click('button[type="submit"]');

    // Create staff 2
    await page.click("button:has-text('Create Staff')");
    await page.fill('input[name="employeeCode"]', "EMP004");
    await page.fill('input[name="name"]', "Bob Wilson");
    await page.selectOption('select[name="designationId"]', "test-designation");
    await page.selectOption('select[name="departmentId"]', "test-department");
    await page.fill('input[name="joiningDate"]', "2026-04-01");
    await page.selectOption('select[name="status"]', "active");
    await page.click('button[type="submit"]');

    // Verify both staff were created
    await expect(page.locator("text=Alice Johnson")).toBeVisible();
    await expect(page.locator("text=Bob Wilson")).toBeVisible();
  });

  test("should show leave balance summary", async ({ page }) => {
    // Navigate to leave requests page
    await page.goto("http://localhost:3000/api/v1/hr/leave-requests");

    // Verify summary is displayed
    await expect(page.locator("text=Leave Balance")).toBeVisible();
    await expect(page.locator("text=Total Leaves")).toBeVisible();
    await expect(page.locator("text=Used Leaves")).toBeVisible();
    await expect(page.locator("text=Available Leaves")).toBeVisible();
  });

  test("should show payroll summary", async ({ page }) => {
    // Navigate to payroll runs page
    await page.goto("http://localhost:3000/api/v1/hr/payroll-runs");

    // Verify summary is displayed
    await expect(page.locator("text=Payroll Summary")).toBeVisible();
    await expect(page.locator("text=Total Payroll Runs")).toBeVisible();
    await expect(page.locator("text=Processed Payroll")).toBeVisible();
    await expect(page.locator("text=Pending Payroll")).toBeVisible();
  });

  test("should handle leave status transitions", async ({ page }) => {
    // Navigate to leave requests page
    await page.goto("http://localhost:3000/api/v1/hr/leave-requests");

    // Click on first leave request
    await page.click("table tbody tr:first-child");

    // Change status
    await page.selectOption('select[name="status"]', "approved");

    // Submit
    await page.click('button[type="submit"]');

    // Verify success
    await expect(page.locator("text=Leave request updated successfully")).toBeVisible();
  });

  test("should handle salary component types", async ({ page }) => {
    // Navigate to salary structures page
    await page.goto("http://localhost:3000/api/v1/hr/salary-structures");

    // Click create button
    await page.click("button:has-text('Create Salary Structure')");

    // Fill form
    await page.fill('input[name="staffId"]', "test-staff-id");
    await page.fill('input[name="effectiveFrom"]', "2026-01-01");
    await page.selectOption('select[name="status"]', "active");

    // Add salary components with different types
    await page.click('button:has-text("Add Component")');
    await page.selectOption('select[name="componentId"]', "test-component");
    await page.fill('input[name="amountPaise"]', "30000");
    await page.selectOption('select[name="type"]', "earning");
    await page.click('button:has-text("Add Component")');
    await page.selectOption('select[name="componentId"]', "test-component-2");
    await page.fill('input[name="amountPaise"]', "5000");
    await page.selectOption('select[name="type"]', "deduction");

    // Submit form
    await page.click('button[type="submit"]');

    // Verify success
    await expect(page.locator("text=Salary structure created successfully")).toBeVisible();
  });

  test("should handle different payroll statuses", async ({ page }) => {
    // Navigate to payroll runs page
    await page.goto("http://localhost:3000/api/v1/hr/payroll-runs");

    // Create payroll runs with different statuses
    const statuses = ["draft", "prepared", "approved", "processed", "closed"];

    for (const status of statuses) {
      await page.click("button:has-text('Create Payroll Run')");
      await page.fill('input[name="month"]', "11");
      await page.fill('input[name="year"]', "2026");
      await page.selectOption('select[name="status"]', status);
      await page.fill('input[name="preparedBy"]', "test-user-id");
      await page.click('button[type="submit"]');

      // Verify success
      await expect(page.locator("text=Payroll run created successfully")).toBeVisible();

      // Go back to list
      await page.goto("http://localhost:3000/api/v1/hr/payroll-runs");
    }
  });

  test("should show staff employment details", async ({ page }) => {
    // Navigate to staff page
    await page.goto("http://localhost:3000/api/v1/hr/staff");

    // Click on first staff
    await page.click("table tbody tr:first-child");

    // Verify details are shown
    await expect(page.locator("text=Staff Details")).toBeVisible();
    await expect(page.locator("text=Employee Code")).toBeVisible();
    await expect(page.locator("text=Name")).toBeVisible();
    await expect(page.locator("text=Designation")).toBeVisible();
    await expect(page.locator("text=Department")).toBeVisible();
    await expect(page.locator("text=Joining Date")).toBeVisible();
    await expect(page.locator("text=Status")).toBeVisible();
  });

  test("should enforce unique employee code", async ({ page }) => {
    // Navigate to create staff page
    await page.goto("http://localhost:3000/api/v1/hr/staff");

    // Click create button
    await page.click("button:has-text('Create Staff')");

    // Fill form
    await page.fill('input[name="employeeCode"]', "EMP001");
    await page.fill('input[name="name"]', "John Doe");
    await page.selectOption('select[name="designationId"]', "test-designation");
    await page.selectOption('select[name="departmentId"]', "test-department");
    await page.fill('input[name="joiningDate"]', "2026-01-15");
    await page.selectOption('select[name="status"]', "active");
    await page.click('button[type="submit"]');

    // Try to create another staff with same code
    await page.click("button:has-text('Create Staff')");
    await page.fill('input[name="employeeCode"]', "EMP001");
    await page.fill('input[name="name"]', "Jane Doe");
    await page.selectOption('select[name="designationId"]', "test-designation");
    await page.selectOption('select[name="departmentId"]', "test-department");
    await page.fill('input[name="joiningDate"]', "2026-02-01");
    await page.selectOption('select[name="status"]', "active");
    await page.click('button[type="submit"]');

    // Verify error
    await expect(page.locator("text=Employee code already exists")).toBeVisible();
  });
});
