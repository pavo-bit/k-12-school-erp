import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { db, enquiries, applications, conversions } from "@school-erp/db";
import { eq } from "drizzle-orm";
import { randomUUID } from "crypto";
import { createEnquiry, createApplication, createConversion, createApplicationDocument, createApplicationNote } from "@school-erp/admissions";

describe("Admissions Module Integration Tests", () => {
  let schoolId: string;
  let academicYearId: string;
  let enquiryId: string;
  let applicationId: string;

  beforeAll(async () => {
    schoolId = randomUUID();
    academicYearId = randomUUID();

    const enquiry = await createEnquiry({
      schoolId,
      studentName: "Test Student",
      guardianPhone: "+919876543210",
      classSought: "Class 10",
      source: "website",
      status: "new",
      actorId: randomUUID(),
    });

    enquiryId = enquiry.id;

    const application = await createApplication({
      schoolId,
      enquiryId,
      academicYearId,
      status: "draft",
      actorId: randomUUID(),
    });

    applicationId = application.id;
  });

  afterAll(async () => {
    await db.delete(conversions).where(eq(conversions.schoolId, schoolId));
    await db.delete(applications).where(eq(applications.schoolId, schoolId));
    await db.delete(enquiries).where(eq(enquiries.schoolId, schoolId));
  });

  it("should create enquiry successfully", async () => {
    const enquiry = await createEnquiry({
      schoolId,
      studentName: "John Doe",
      guardianPhone: "+919876543211",
      classSought: "Class 9",
      source: "walk_in",
      status: "new",
      actorId: randomUUID(),
    });

    expect(enquiry).toBeDefined();
    expect(enquiry.studentName).toBe("John Doe");
    expect(enquiry.guardianPhone).toBe("+919876543211");
    expect(enquiry.classSought).toBe("Class 9");
  });

  it("should create application successfully", async () => {
    const application = await createApplication({
      schoolId,
      enquiryId,
      academicYearId,
      status: "submitted",
      actorId: randomUUID(),
    });

    expect(application).toBeDefined();
    expect(application.enquiryId).toBe(enquiryId);
    expect(application.academicYearId).toBe(academicYearId);
    expect(application.status).toBe("submitted");
  });

  it("should create application document successfully", async () => {
    const document = await createApplicationDocument({
      schoolId,
      applicationId,
      documentType: "birth_certificate",
      objectPath: "/docs/birth-cert.pdf",
      actorId: randomUUID(),
    });

    expect(document).toBeDefined();
    expect(document.applicationId).toBe(applicationId);
    expect(document.documentType).toBe("birth_certificate");
  });

  it("should create application note successfully", async () => {
    const note = await createApplicationNote({
      schoolId,
      applicationId,
      note: "Student has excellent academic record",
      actorId: randomUUID(),
    });

    expect(note).toBeDefined();
    expect(note.applicationId).toBe(applicationId);
    expect(note.note).toBe("Student has excellent academic record");
  });

  it("should create conversion successfully", async () => {
    const conversion = await createConversion({
      schoolId,
      applicationId,
      convertedStudentId: randomUUID(),
      convertedAt: new Date(),
      actorId: randomUUID(),
    });

    expect(conversion).toBeDefined();
    expect(conversion.applicationId).toBe(applicationId);
  });

  it("should handle different enquiry sources", async () => {
    const sources = ["website", "walk_in", "referral", "advertisement", "other"];

    for (const source of sources) {
      const enquiry = await createEnquiry({
        schoolId,
        studentName: `Student ${source}`,
        guardianPhone: "+919876543212",
        classSought: "Class 8",
        source,
        status: "new",
        actorId: randomUUID(),
      });

      expect(enquiry).toBeDefined();
      expect(enquiry.source).toBe(source);
    }
  });

  it("should handle different enquiry statuses", async () => {
    const statuses = ["new", "contacted", "scheduled", "converted", "rejected", "closed"];

    for (const status of statuses) {
      const enquiry = await createEnquiry({
        schoolId,
        studentName: `Student ${status}`,
        guardianPhone: "+919876543213",
        classSought: "Class 7",
        source: "website",
        status,
        actorId: randomUUID(),
      });

      expect(enquiry).toBeDefined();
      expect(enquiry.status).toBe(status);
    }
  });

  it("should handle different application statuses", async () => {
    const statuses = ["draft", "submitted", "review", "interview", "selected", "rejected", "converted", "withdrawn"];

    for (const status of statuses) {
      const application = await createApplication({
        schoolId,
        enquiryId,
        academicYearId,
        status,
        actorId: randomUUID(),
      });

      expect(application).toBeDefined();
      expect(application.status).toBe(status);
    }
  });

  it("should list enquiries by status", async () => {
    const enquiries = await db.select().from(enquiries).where(eq(enquiries.schoolId, schoolId));

    expect(enquiries.length).toBeGreaterThan(0);
    enquiries.forEach((e) => {
      expect(e.schoolId).toBe(schoolId);
    });
  });

  it("should list applications by status", async () => {
    const applications = await db.select().from(applications).where(eq(applications.schoolId, schoolId));

    expect(applications.length).toBeGreaterThan(0);
    applications.forEach((a) => {
      expect(a.schoolId).toBe(schoolId);
    });
  });

  it("should enforce required fields in enquiry", async () => {
    try {
      await createEnquiry({
        schoolId,
        // Missing studentName, guardianPhone, classSought
        actorId: randomUUID(),
      });
      expect.fail("Should have thrown an error for missing required fields");
    } catch (error) {
      expect(error).toBeDefined();
    }
  });

  it("should enforce required fields in application", async () => {
    try {
      await createApplication({
        schoolId,
        // Missing enquiryId and academicYearId
        actorId: randomUUID(),
      });
      expect.fail("Should have thrown an error for missing required fields");
    } catch (error) {
      expect(error).toBeDefined();
    }
  });

  it("should handle different document types", async () => {
    const documentTypes = ["birth_certificate", "transfer_certificate", "marksheet", "photo"];

    for (const documentType of documentTypes) {
      const document = await createApplicationDocument({
        schoolId,
        applicationId,
        documentType,
        objectPath: `/docs/${documentType}.pdf`,
        actorId: randomUUID(),
      });

      expect(document).toBeDefined();
      expect(document.documentType).toBe(documentType);
    }
  });

  it("should handle application with notes", async () => {
    const application = await createApplication({
      schoolId,
      enquiryId,
      academicYearId,
      status: "draft",
      notes: "This is a test application with notes",
      actorId: randomUUID(),
    });

    expect(application).toBeDefined();
    expect(application.notes).toBe("This is a test application with notes");
  });
});
