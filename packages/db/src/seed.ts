import argon2 from "argon2";
import { db } from "./client.js";
import {
  organizations,
  schools,
  academicYears,
  roles,
  permissions,
  rolePermissions,
  memberships,
  users,
  accounts,
} from "./schema/index.js";
import { sql } from "drizzle-orm";

async function seed() {
  console.log("Seeding reference data...");

  // Permissions
  const permissionKeys = [
    "students.read",
    "students.create",
    "students.update",
    "students.export",
    "attendance.mark",
    "attendance.correct",
    "attendance.export",
    "fees.structure.manage",
    "fees.invoice.issue",
    "fees.payment.record",
    "fees.refund.approve",
    "fees.report.read",
    "fees.reconcile",
    "exams.marks.enter",
    "exams.marks.lock",
    "exams.publish",
    "payroll.prepare",
    "payroll.approve",
    "payroll.export",
    "staff.read",
    "staff.manage",
    "leave.approve",
    "comms.announcement.send",
    "comms.template.manage",
    "reports.read",
    "settings.manage",
    "roles.manage",
    "audit.read",
    "platform.school.manage",
    "platform.impersonate",
    "platform.usage.read",
  ];

  for (const key of permissionKeys) {
    await db.insert(permissions).values({ id: crypto.randomUUID(), key }).onConflictDoNothing();
  }

  // Organization and school
  const orgId = crypto.randomUUID();
  const schoolId = crypto.randomUUID();
  const academicYearId = crypto.randomUUID();

  await db
    .insert(organizations)
    .values({ id: orgId, name: "Greenwood Trust", status: "active" })
    .onConflictDoNothing();
  await db
    .insert(schools)
    .values({
      id: schoolId,
      organizationId: orgId,
      name: "Greenwood High School",
      slug: "greenwood",
      board: "CBSE",
      timezone: "Asia/Kolkata",
      locale: "en",
      status: "active",
    })
    .onConflictDoNothing();

  await db
    .insert(academicYears)
    .values({
      id: academicYearId,
      schoolId,
      name: "2027-28",
      startDate: new Date("2027-04-01T00:00:00+05:30"),
      endDate: new Date("2028-03-31T23:59:59+05:30"),
      status: "active",
    })
    .onConflictDoNothing();

  // Roles
  const adminRoleId = crypto.randomUUID();
  const teacherRoleId = crypto.randomUUID();
  const parentRoleId = crypto.randomUUID();

  await db
    .insert(roles)
    .values([
      { id: adminRoleId, schoolId, key: "school_admin", name: "School Admin" },
      { id: teacherRoleId, schoolId, key: "teacher", name: "Teacher" },
      { id: parentRoleId, schoolId, key: "parent", name: "Parent" },
    ])
    .onConflictDoNothing();

  // Grant all permissions to school_admin
  const allPerms = await db.select().from(permissions);
  for (const p of allPerms) {
    await db
      .insert(rolePermissions)
      .values({ roleId: adminRoleId, permissionId: p.id })
      .onConflictDoNothing();
  }

  // Demo admin user
  const adminUserId = crypto.randomUUID();
  const passwordHash = await argon2.hash("Password123!");

  await db
    .insert(users)
    .values({
      id: adminUserId,
      name: "Demo Admin",
      email: "admin@greenwood.local",
      emailVerifiedAt: new Date(),
      status: "active",
    })
    .onConflictDoNothing();

  await db
    .insert(accounts)
    .values({
      id: crypto.randomUUID(),
      userId: adminUserId,
      providerId: "credential",
      accountId: "admin@greenwood.local",
      password: passwordHash,
    })
    .onConflictDoNothing();

  await db
    .insert(memberships)
    .values({
      id: crypto.randomUUID(),
      userId: adminUserId,
      schoolId,
      roleId: adminRoleId,
      status: "active",
    })
    .onConflictDoNothing();

  console.log("Seed complete.");
  console.log("Demo school slug: greenwood");
  console.log("Demo admin: admin@greenwood.local / Password123!");
  console.log("Open: http://greenwood.localhost:3000 (or http://localhost:3000?school=greenwood)");
}

seed()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
