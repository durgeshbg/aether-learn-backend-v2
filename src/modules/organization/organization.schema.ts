import { z } from 'zod';

export const CreateOrganizationSchema = z.object({
  name: z.string().min(1, 'Organization name is required'),
  description: z.string().optional(),
  logoUrl: z.string().url('Invalid logo URL format').optional(),
  websiteUrl: z.string().url('Invalid website URL format').optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email('Invalid email format').optional(),
  orgAdminId: z
    .string()
    .cuid('Invalid organization admin ID format')
    .optional(),
});

export const OrganizationUpdateSchema = CreateOrganizationSchema.extend({
  name: z.string().min(1, 'Organization name too short').optional(),
});

export const OrganizationIdParamSchema = z.object({
  id: z.string().cuid('Invalid organization ID format'),
});

export const OrganizationUserUpdateSchema = z.object({
  userIds: z.array(z.string().cuid('Invalid user ID format')),
});

export const OrganizationCourseUpdateSchema = z.object({
  courseIds: z.array(z.string().cuid('Invalid course ID format')),
});

export const OrgAdminUpdateScehma = z.object({
  userId: z.string().cuid('Invalid user ID format'),
});

export const OrganizationNameQuerySchema = z.object({
  name: z.string().min(1, 'Organization name is required'),
});

export type CreateOrganizationType = z.infer<typeof CreateOrganizationSchema>;
export type OrganizationUpdateType = z.infer<typeof OrganizationUpdateSchema>;
export type OrganizationIdParamType = z.infer<typeof OrganizationIdParamSchema>;
export type OrganizationUserUpdateType = z.infer<
  typeof OrganizationUserUpdateSchema
>;
export type OrganizationCourseUpdateType = z.infer<
  typeof OrganizationCourseUpdateSchema
>;
export type OrgAdminUpdateType = z.infer<typeof OrgAdminUpdateScehma>;
export type OrganizationNameQueryType = z.infer<
  typeof OrganizationNameQuerySchema
>;
