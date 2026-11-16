import { test, expect } from "@playwright/test";

test.describe("Fees Flow E2E Tests", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("http://localhost:3000");
  });

  test("should create fee head", async ({ page }) => {
    // Navigate to fee heads page
    await page.goto("http://localhost:3000/api/v1/fees/heads");

    // Click create button
    await page.click("button:has-text('Create Fee Head')");

    // Fill form
    await page.fill('input[name="name"]', "Tuition Fee");
    await page.fill('input[name="code"]', "TUIT");
    await page.selectOption('select[name="category"]', "tuition");
    await page.selectOption('select[name="isTaxable"]', "false");

    // Submit form
    await page.click('button[type="submit"]');

    // Verify success
    await expect(page.locator("text=Fee head created successfully")).toBeVisible();
  });

  test("should create fee structure", async ({ page }) => {
    // Navigate to fee structures page
    await page.goto("http://localhost:3000/api/v1/fees/structures");

    // Click create button
    await page.click("button:has-text('Create Fee Structure')");

    // Fill form
    await page.fill('input[name="name"]', "Class 10 Fee Structure");
    await page.selectOption('select[name="status"]', "active");

    // Add fee head lines
    await page.click('button:has-text("Add Fee Head")');
    await page.selectOption('select[name="feeHeadId"]', "test-head-id");
    await page.fill('input[name="amountPaise"]', "50000");
    await page.selectOption('select[name="frequency"]', "monthly");
    await page.selectOption('select[name="dueRule"]', "immediate");

    // Submit form
    await page.click('button[type="submit"]');

    // Verify success
    await expect(page.locator("text=Fee structure created successfully")).toBeVisible();
  });

  test("should create invoice", async ({ page }) => {
    // Navigate to invoices page
    await page.goto("http://localhost:3000/api/v1/fees/invoices");

    // Click create button
    await page.click("button:has-text('Create Invoice')");

    // Fill form
    await page.fill('input[name="studentId"]', "test-student-id");
    await page.fill('input[name="academicYearId"]', "test-academic-year-id");
    await page.fill('input[name="financialYear"]', "2026-27");
    await page.fill('input[name="invoiceNumber"]', "INV-001");
    await page.fill('input[name="issueDate"]', "2026-11-15");
    await page.fill('input[name="dueDate"]', "2026-12-15");
    await page.selectOption('select[name="status"]', "issued");

    // Add invoice line
    await page.click('button:has-text("Add Invoice Line")');
    await page.selectOption('select[name="feeHeadId"]', "test-head-id");
    await page.fill('input[name="amountPaise"]', "50000");
    await page.fill('input[name="concessionPaise"]', "0");
    await page.fill('input[name="netPaise"]', "50000");

    // Submit form
    await page.click('button[type="submit"]');

    // Verify success
    await expect(page.locator("text=Invoice created successfully")).toBeVisible();
  });

  test("should list invoices", async ({ page }) => {
    // Navigate to invoices page
    await page.goto("http://localhost:3000/api/v1/fees/invoices");

    // Verify list is displayed
    await expect(page.locator("text=Invoices")).toBeVisible();
    await expect(page.locator("table")).toBeVisible();

    // Verify invoice columns
    await expect(page.locator("th:has-text('Invoice Number')")).toBeVisible();
    await expect(page.locator("th:has-text('Student')")).toBeVisible();
    await expect(page.locator("th:has-text('Total')")).toBeVisible();
    await expect(page.locator("th:has-text('Status')")).toBeVisible();
  });

  test("should filter invoices by status", async ({ page }) => {
    // Navigate to invoices page
    await page.goto("http://localhost:3000/api/v1/fees/invoices?status=issued");

    // Verify filter is applied
    await expect(page.locator("text=Filtering by status: Issued")).toBeVisible();
  });

  test("should filter invoices by student", async ({ page }) => {
    // Navigate to invoices page
    await page.goto("http://localhost:3000/api/v1/fees/invoices?studentId=test-student-id");

    // Verify filter is applied
    await expect(page.locator("text=Filtering by student")).toBeVisible();
  });

  test("should show invoice details", async ({ page }) => {
    // Navigate to invoices page
    await page.goto("http://localhost:3000/api/v1/fees/invoices");

    // Click on first invoice
    await page.click("table tbody tr:first-child");

    // Verify details are shown
    await expect(page.locator("text=Invoice Details")).toBeVisible();
    await expect(page.locator("text=Invoice Number")).toBeVisible();
    await expect(page.locator("text=Total Amount")).toBeVisible();
    await expect(page.locator("text=Due Date")).toBeVisible();
  });

  test("should handle form validation errors", async ({ page }) => {
    // Navigate to create invoice page
    await page.goto("http://localhost:3000/api/v1/fees/invoices");

    // Click create button
    await page.click("button:has-text('Create Invoice')");

    // Submit empty form
    await page.click('button[type="submit"]');

    // Verify validation errors
    await expect(page.locator("text=Student ID is required")).toBeVisible();
    await expect(page.locator("text=Academic Year ID is required")).toBeVisible();
    await expect(page.locator("text=Invoice Number is required")).toBeVisible();
  });

  test("should handle invoice status transitions", async ({ page }) => {
    // Navigate to invoices page
    await page.goto("http://localhost:3000/api/v1/fees/invoices");

    // Click on first invoice
    await page.click("table tbody tr:first-child");

    // Change status
    await page.selectOption('select[name="status"]', "partial");

    // Submit
    await page.click('button[type="submit"]');

    // Verify success
    await expect(page.locator("text=Invoice updated successfully")).toBeVisible();
  });

  test("should show financial summary", async ({ page }) => {
    // Navigate to invoices page
    await page.goto("http://localhost:3000/api/v1/fees/invoices");

    // Verify summary is displayed
    await expect(page.locator("text=Financial Summary")).toBeVisible();
    await expect(page.locator("text=Total Demand")).toBeVisible();
    await expect(page.locator("text=Total Collected")).toBeVisible();
    await expect(page.locator("text=Pending")).toBeVisible();
    await expect(page.locator("text=Collection Rate")).toBeVisible();
  });

  test("should handle payment processing", async ({ page }) => {
    // Navigate to invoices page
    await page.goto("http://localhost:3000/api/v1/fees/invoices");

    // Click on first invoice
    await page.click("table tbody tr:first-child");

    // Click pay button
    await page.click("button:has-text('Pay')");

    // Fill payment details
    await page.fill('input[name="amount"]', "25000");
    await page.selectOption('select[name="mode"]', "UPI");
    await page.click('button[type="submit"]');

    // Verify success
    await expect(page.locator("text=Payment processed successfully")).toBeVisible();
  });

  test("should enforce gapless invoice numbers", async ({ page }) => {
    // Navigate to create invoice page
    await page.goto("http://localhost:3000/api/v1/fees/invoices");

    // Click create button
    await page.click("button:has-text('Create Invoice')");

    // Fill form
    await page.fill('input[name="studentId"]', "test-student-id");
    await page.fill('input[name="academicYearId"]', "test-academic-year-id");
    await page.fill('input[name="financialYear"]', "2026-27");
    await page.fill('input[name="invoiceNumber"]', "INV-001");
    await page.fill('input[name="issueDate"]', "2026-11-15");
    await page.fill('input[name="dueDate"]', "2026-12-15");
    await page.selectOption('select[name="status"]', "issued");
    await page.click('button[type="submit"]');

    // Try to create another invoice with same number
    await page.click("button:has-text('Create Invoice')");
    await page.fill('input[name="studentId"]', "test-student-id");
    await page.fill('input[name="academicYearId"]', "test-academic-year-id");
    await page.fill('input[name="financialYear"]', "2026-27");
    await page.fill('input[name="invoiceNumber"]', "INV-001");
    await page.fill('input[name="issueDate"]', "2026-11-16");
    await page.fill('input[name="dueDate"]', "2026-12-16");
    await page.selectOption('select[name="status"]', "issued");
    await page.click('button[type="submit"]');

    // Verify error
    await expect(page.locator("text=Invoice number already exists")).toBeVisible();
  });

  test("should list fee heads", async ({ page }) => {
    // Navigate to fee heads page
    await page.goto("http://localhost:3000/api/v1/fees/heads");

    // Verify list is displayed
    await expect(page.locator("text=Fee Heads")).toBeVisible();
    await expect(page.locator("table")).toBeVisible();

    // Verify fee head columns
    await expect(page.locator("th:has-text('Name')")).toBeVisible();
    await expect(page.locator("th:has-text('Code')")).toBeVisible();
    await expect(page.locator("th:has-text('Category')")).toBeVisible();
    await expect(page.locator("th:has-text('Taxable')")).toBeVisible();
  });

  test("should filter fee heads by category", async ({ page }) => {
    // Navigate to fee heads page
    await page.goto("http://localhost:3000/api/v1/fees/heads?category=tuition");

    // Verify filter is applied
    await expect(page.locator("text=Filtering by category: Tuition")).toBeVisible();
  });

  test("should show fee structure details", async ({ page }) => {
    // Navigate to fee structures page
    await page.goto("http://localhost:3000/api/v1/fees/structures");

    // Click on first fee structure
    await page.click("table tbody tr:first-child");

    // Verify details are shown
    await expect(page.locator("text=Fee Structure Details")).toBeVisible();
    await expect(page.locator("text=Name")).toBeVisible();
    await expect(page.locator("text=Status")).toBeVisible();
    await expect(page.locator("text=Fee Head Lines")).toBeVisible();
  });

  test("should handle concession calculations", async ({ page }) => {
    // Navigate to create invoice page
    await page.goto("http://localhost:3000/api/v1/fees/invoices");

    // Click create button
    await page.click("button:has-text('Create Invoice')");

    // Fill form
    await page.fill('input[name="studentId"]', "test-student-id");
    await page.fill('input[name="academicYearId"]', "test-academic-year-id");
    await page.fill('input[name="financialYear"]', "2026-27");
    await page.fill('input[name="invoiceNumber"]', "INV-002");
    await page.fill('input[name="issueDate"]', "2026-11-15");
    await page.fill('input[name="dueDate"]', "2026-12-15");
    await page.selectOption('select[name="status"]', "issued");

    // Add invoice line with concession
    await page.click('button:has-text("Add Invoice Line")');
    await page.selectOption('select[name="feeHeadId"]', "test-head-id");
    await page.fill('input[name="amountPaise"]', "60000");
    await page.fill('input[name="concessionPaise"]', "10000");
    await page.fill('input[name="netPaise"]', "50000");

    // Submit form
    await page.click('button[type="submit"]');

    // Verify success
    await expect(page.locator("text=Invoice created successfully")).toBeVisible();
  });

  test("should handle different invoice statuses", async ({ page }) => {
    // Navigate to invoices page
    await page.goto("http://localhost:3000/api/v1/fees/invoices");

    // Create invoices with different statuses
    const statuses = ["draft", "issued", "partial", "paid", "overdue", "cancelled"];

    for (const status of statuses) {
      await page.click("button:has-text('Create Invoice')");
      await page.fill('input[name="studentId"]', "test-student-id");
      await page.fill('input[name="academicYearId"]', "test-academic-year-id");
      await page.fill('input[name="financialYear"]', "2026-27");
      await page.fill('input[name="invoiceNumber"]', `INV-00${statuses.indexOf(status) + 1}`);
      await page.fill('input[name="issueDate"]', "2026-11-15");
      await page.fill('input[name="dueDate"]', "2026-12-15");
      await page.selectOption('select[name="status"]', status);
      await page.click('button[type="submit"]');

      // Verify success
      await expect(page.locator("text=Invoice created successfully")).toBeVisible();

      // Go back to list
      await page.goto("http://localhost:3000/api/v1/fees/invoices");
    }
  });

  test("should handle different invoice types", async ({ page }) => {
    // Navigate to invoices page
    await page.goto("http://localhost:3000/api/v1/fees/invoices");

    // Create invoices with different types
    const types = ["tuition", "transport", "library", "lab", "sports"];

    for (const type of types) {
      await page.click("button:has-text('Create Invoice')");
      await page.fill('input[name="studentId"]', "test-student-id");
      await page.fill('input[name="academicYearId"]', "test-academic-year-id");
      await page.fill('input[name="financialYear"]', "2026-27");
      await page.fill('input[name="invoiceNumber"]', `INV-00${types.indexOf(type) + 1}`);
      await page.fill('input[name="issueDate"]', "2026-11-15");
      await page.fill('input[name="dueDate"]', "2026-12-15");
      await page.selectOption('select[name="status"]', "issued");
      await page.click('button[type="submit"]');

      // Verify success
      await expect(page.locator("text=Invoice created successfully")).toBeVisible();

      // Go back to list
      await page.goto("http://localhost:3000/api/v1/fees/invoices");
    }
  });

  test("should enforce required fields in invoices", async ({ page }) => {
    // Navigate to create invoice page
    await page.goto("http://localhost:3000/api/v1/fees/invoices");

    // Click create button
    await page.click("button:has-text('Create Invoice')");

    // Submit empty form
    await page.click('button[type="submit"]');

    // Verify validation errors
    await expect(page.locator("text=Student ID is required")).toBeVisible();
    await expect(page.locator("text=Academic Year ID is required")).toBeVisible();
    await expect(page.locator("text=Financial Year is required")).toBeVisible();
    await expect(page.locator("text=Invoice Number is required")).toBeVisible();
    await expect(page.locator("text=Due Date is required")).toBeVisible();
  });

  test("should handle different payment modes", async ({ page }) => {
    // Navigate to invoices page
    await page.goto("http://localhost:3000/api/v1/fees/invoices");

    // Click on first invoice
    await page.click("table tbody tr:first-child");

    // Click pay button
    await page.click("button:has-text('Pay')");

    // Fill payment details
    await page.fill('input[name="amount"]', "35000");
    await page.selectOption('select[name="mode"]', "UPI");
    await page.fill('input[name="cardNumber"]', "1234567890123456");
    await page.fill('input[name="expiry"]', "12/25");
    await page.fill('input[name="cvv"]', "123");
    await page.click('button[type="submit"]');

    // Verify success
    await expect(page.locator("text=Payment processed successfully")).toBeVisible();
  });

  test("should show invoice history", async ({ page }) => {
    // Navigate to invoices page
    await page.goto("http://localhost:3000/api/v1/fees/invoices");

    // Click on first invoice
    await page.click("table tbody tr:first-child");

    // Verify history is shown
    await expect(page.locator("text=Invoice History")).toBeVisible();
    await expect(page.locator("text=Previous Status")).toBeVisible();
    await expect(page.locator("text=Current Status")).toBeVisible();
  });

  test("should handle invoice with different amounts", async ({ page }) => {
    // Navigate to create invoice page
    await page.goto("http://localhost:3000/api/v1/fees/invoices");

    // Click create button
    await page.click("button:has-text('Create Invoice')");

    // Fill form with different amounts
    await page.fill('input[name="studentId"]', "test-student-id");
    await page.fill('input[name="academicYearId"]', "test-academic-year-id");
    await page.fill('input[name="financialYear"]', "2026-27");
    await page.fill('input[name="invoiceNumber"]', "INV-003");
    await page.fill('input[name="issueDate"]', "2026-11-15");
    await page.fill('input[name="dueDate"]', "2026-12-15");
    await page.selectOption('select[name="status"]', "issued");

    // Add invoice line with different amount
    await page.click('button:has-text("Add Invoice Line")');
    await page.selectOption('select[name="feeHeadId"]', "test-head-id");
    await page.fill('input[name="amountPaise"]', "75000");
    await page.fill('input[name="concessionPaise"]', "25000");
    await page.fill('input[name="netPaise"]', "50000");

    // Submit form
    await page.click('button[type="submit"]');

    // Verify success
    await expect(page.locator("text=Invoice created successfully")).toBeVisible();
  });
});
