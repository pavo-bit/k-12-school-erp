export {
  createOrganization,
  createSchool,
  listSchools,
  inviteStaff,
} from "./service/platform-service";
export type {
  CreateOrganizationInput,
  CreateSchoolInput,
  InviteStaffInput,
} from "./service/platform-service";
export * from "./schemas/platform-schemas";
