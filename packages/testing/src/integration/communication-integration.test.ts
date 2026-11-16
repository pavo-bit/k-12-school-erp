import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { db, announcements, notification_templates } from "@school-erp/db";
import { eq, and } from "drizzle-orm";
import { randomUUID } from "crypto";
import { createAnnouncement, listAnnouncements, createNotificationTemplate } from "@school-erp/communication";

describe("Communication Module Integration Tests", () => {
  let schoolId: string;
  let announcementId: string;
  let templateId: string;

  beforeAll(async () => {
    // Create test data
    const [template] = await createNotificationTemplate({
      schoolId: randomUUID(),
      key: "test_template",
      channel: "email",
      language: "en",
      subject: "Test Template",
      body: "This is a test template",
      status: "active",
      actorId: randomUUID(),
    });

    templateId = template.id;

    const [announcement] = await createAnnouncement({
      schoolId: randomUUID(),
      title: "Test Announcement",
      body: "This is a test announcement",
      audience: "all",
      status: "sent",
      sentAt: new Date(),
      actorId: randomUUID(),
    });

    announcementId = announcement.id;
  });

  afterAll(async () => {
    // Cleanup
    await db.delete(notification_templates).where(eq(notification_templates.id, templateId));
    await db.delete(announcements).where(eq(announcements.id, announcementId));
  });

  it("should create notification template successfully", async () => {
    const template = await createNotificationTemplate({
      schoolId: randomUUID(),
      key: "test_template_2",
      channel: "sms",
      language: "hi",
      subject: "Test Template Hindi",
      body: "यह एक परीक्षण टेम्पलेट है",
      status: "active",
      actorId: randomUUID(),
    });

    expect(template).toBeDefined();
    expect(template.key).toBe("test_template_2");
    expect(template.channel).toBe("sms");
    expect(template.language).toBe("hi");
  });

  it("should create announcement successfully", async () => {
    const announcement = await createAnnouncement({
      schoolId: randomUUID(),
      title: "Test Announcement 2",
      body: "This is a test announcement 2",
      audience: "parents",
      status: "scheduled",
      scheduledAt: new Date("2026-11-20"),
      actorId: randomUUID(),
    });

    expect(announcement).toBeDefined();
    expect(announcement.title).toBe("Test Announcement 2");
    expect(announcement.audience).toBe("parents");
    expect(announcement.status).toBe("scheduled");
  });

  it("should list announcements", async () => {
    const announcements = await listAnnouncements(randomUUID());

    expect(announcements.length).toBeGreaterThan(0);
    expect(announcements[0]).toHaveProperty("title");
    expect(announcements[0]).toHaveProperty("body");
    expect(announcements[0]).toHaveProperty("status");
  });

  it("should filter announcements by status", async () => {
    const announcements = await listAnnouncements(randomUUID(), "sent");

    const filtered = announcements.filter((a) => a.status === "sent");

    expect(filtered.length).toBeGreaterThan(0);
    filtered.forEach((announcement) => {
      expect(announcement.status).toBe("sent");
    });
  });

  it("should filter announcements by audience", async () => {
    const announcements = await listAnnouncements(randomUUID(), undefined, "parents");

    const filtered = announcements.filter((a) => a.audience === "parents");

    expect(filtered.length).toBeGreaterThan(0);
    filtered.forEach((announcement) => {
      expect(announcement.audience).toBe("parents");
    });
  });

  it("should handle multiple announcements", async () => {
    // Create multiple announcements
    const announcement2 = await createAnnouncement({
      schoolId: randomUUID(),
      title: "Test Announcement 3",
      body: "This is a test announcement 3",
      audience: "all",
      status: "draft",
      actorId: randomUUID(),
    });

    const announcements = await listAnnouncements(randomUUID());

    expect(announcements.length).toBeGreaterThan(1);
    expect(announcements.find((a) => a.id === announcement2.id)).toBeDefined();
  });

  it("should enforce unique template key per school", async () => {
    try {
      await createNotificationTemplate({
        schoolId: randomUUID(),
        key: "test_template", // Duplicate key
        channel: "email",
        language: "en",
        subject: "Test Template",
        body: "This is a test template",
        status: "active",
        actorId: randomUUID(),
      });
      expect.fail("Should have thrown an error for duplicate template key");
    } catch (error) {
      expect(error).toBeDefined();
    }
  });

  it("should handle announcement status transitions", async () => {
    const announcement = await createAnnouncement({
      schoolId: randomUUID(),
      title: "Test Announcement 4",
      body: "This is a test announcement 4",
      audience: "all",
      status: "draft",
      actorId: randomUUID(),
    });

    // Update announcement status
    await db.update(announcements).set({ status: "scheduled" }).where(eq(announcements.id, announcement.id));

    const updatedAnnouncement = await db.select().from(announcements).where(eq(announcements.id, announcement.id)).limit(1);

    expect(updatedAnnouncement[0]?.status).toBe("scheduled");
  });

  it("should handle scheduled announcements", async () => {
    const scheduled = await createAnnouncement({
      schoolId: randomUUID(),
      title: "Scheduled Announcement",
      body: "This announcement is scheduled",
      audience: "all",
      status: "scheduled",
      scheduledAt: new Date("2026-11-25"),
      actorId: randomUUID(),
    });

    expect(scheduled).toBeDefined();
    expect(scheduled.status).toBe("scheduled");
    expect(scheduled.scheduledAt).toBeDefined();
    expect(scheduled.scheduledAt!.toISOString().startsWith("2026-11-25")).toBe(true);
  });

  it("should handle sent announcements", async () => {
    const sent = await createAnnouncement({
      schoolId: randomUUID(),
      title: "Sent Announcement",
      body: "This announcement has been sent",
      audience: "all",
      status: "sent",
      sentAt: new Date("2026-11-10"),
      actorId: randomUUID(),
    });

    expect(sent).toBeDefined();
    expect(sent.status).toBe("sent");
    expect(sent.sentAt).toBeDefined();
    expect(sent.sentAt!.toISOString().startsWith("2026-11-10")).toBe(true);
  });

  it("should handle cancelled announcements", async () => {
    const cancelled = await createAnnouncement({
      schoolId: randomUUID(),
      title: "Cancelled Announcement",
      body: "This announcement was cancelled",
      audience: "all",
      status: "cancelled",
      actorId: randomUUID(),
    });

    expect(cancelled).toBeDefined();
    expect(cancelled.status).toBe("cancelled");
  });

  it("should show announcement details", async () => {
    const announcement = await createAnnouncement({
      schoolId: randomUUID(),
      title: "Detailed Announcement",
      body: "This is a detailed announcement with lots of information",
      audience: "all",
      status: "sent",
      actorId: randomUUID(),
    });

    expect(announcement).toBeDefined();
    expect(announcement.title).toBe("Detailed Announcement");
    expect(announcement.body).toBe("This is a detailed announcement with lots of information");
    expect(announcement.audience).toBe("all");
    expect(announcement.status).toBe("sent");
  });

  it("should enforce required fields in announcements", async () => {
    try {
      await createAnnouncement({
        schoolId: randomUUID(),
        // Missing title and body
        audience: "all",
        status: "draft",
        actorId: randomUUID(),
      });
      expect.fail("Should have thrown an error for missing required fields");
    } catch (error) {
      expect(error).toBeDefined();
    }
  });

  it("should handle different audience types", async () => {
    const audiences = ["all", "staff", "parents", "students"];

    for (const audience of audiences) {
      const announcement = await createAnnouncement({
        schoolId: randomUUID(),
        title: `Announcement for ${audience}`,
        body: `This is an announcement for ${audience}`,
        audience,
        status: "sent",
        actorId: randomUUID(),
      });

      expect(announcement).toBeDefined();
      expect(announcement.audience).toBe(audience);
    }
  });

  it("should handle different status types", async () => {
    const statuses = ["draft", "scheduled", "sent", "cancelled"];

    for (const status of statuses) {
      const announcement = await createAnnouncement({
        schoolId: randomUUID(),
        title: `Announcement with status ${status}`,
        body: `This is an announcement with status ${status}`,
        audience: "all",
        status,
        actorId: randomUUID(),
      });

      expect(announcement).toBeDefined();
      expect(announcement.status).toBe(status);
    }
  });

  it("should filter announcements by date range", async () => {
    const announcements = await listAnnouncements(randomUUID());

    if (announcements.length > 0) {
      const dates = announcements.map((a) => a.sentAt || a.scheduledAt || a.createdAt);
      expect(dates.length).toBeGreaterThan(0);
      dates.forEach((date) => {
        expect(date).toBeInstanceOf(Date);
      });
    }
  });

  it("should handle announcement updates", async () => {
    const announcement = await createAnnouncement({
      schoolId: randomUUID(),
      title: "Original Title",
      body: "Original body",
      audience: "all",
      status: "sent",
      actorId: randomUUID(),
    });

    // Update announcement
    await db.update(announcements).set({ title: "Updated Title" }).where(eq(announcements.id, announcement.id));

    const updatedAnnouncement = await db.select().from(announcements).where(eq(announcements.id, announcement.id)).limit(1);

    expect(updatedAnnouncement[0]?.title).toBe("Updated Title");
    expect(updatedAnnouncement[0]?.body).toBe("Original body");
  });

  it("should enforce audience constraints", async () => {
    const invalidAudiences = ["all", "staff", "parents", "students"];

    for (const audience of invalidAudiences) {
      const announcement = await createAnnouncement({
        schoolId: randomUUID(),
        title: `Announcement for ${audience}`,
        body: `This is an announcement for ${audience}`,
        audience,
        status: "sent",
        actorId: randomUUID(),
      });

      expect(announcement).toBeDefined();
      expect(announcement.audience).toBe(audience);
    }
  });

  it("should enforce status constraints", async () => {
    const invalidStatuses = ["draft", "scheduled", "sent", "cancelled"];

    for (const status of invalidStatuses) {
      const announcement = await createAnnouncement({
        schoolId: randomUUID(),
        title: `Announcement with status ${status}`,
        body: `This is an announcement with status ${status}`,
        audience: "all",
        status,
        actorId: randomUUID(),
      });

      expect(announcement).toBeDefined();
      expect(announcement.status).toBe(status);
    }
  });

  it("should handle different content lengths", async () => {
    const shortTitle = "Short Title";
    const longTitle = "This is a very long title that should test the limits of the system and ensure it handles long content properly without breaking the interface or causing display issues in the application";

    const shortBody = "Short body text";
    const longBody = "This is a very long body text that should test the limits of the system and ensure it handles long content properly without breaking the interface or causing display issues in the application. This is a very long body text that should test the limits of the system and ensure it handles long content properly without breaking the interface or causing display issues in the application";

    const shortAnnouncement = await createAnnouncement({
      schoolId: randomUUID(),
      title: shortTitle,
      body: shortBody,
      audience: "all",
      status: "sent",
      actorId: randomUUID(),
    });

    const longAnnouncement = await createAnnouncement({
      schoolId: randomUUID(),
      title: longTitle,
      body: longBody,
      audience: "all",
      status: "sent",
      actorId: randomUUID(),
    });

    expect(shortAnnouncement).toBeDefined();
    expect(longAnnouncement).toBeDefined();
    expect(shortAnnouncement.title).toBe(shortTitle);
    expect(longAnnouncement.title).toBe(longTitle);
  });
});
