import { z } from 'zod';
import { Role } from '../../generated/prisma';

export const CreateUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, 'Password must be at least 8 characters long'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
});

export const UserUpdateSchema = z.object({
  firstName: z.string().min(1, 'First name is required').optional(),
  lastName: z.string().min(1, 'Last name is required').optional(),
});

export const UserOrganizationUpdateSchema = z.object({
  organizationId: z.string().cuid('Invalid organization ID format'),
});

export const UserLoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, 'Password must be at least 8 characters long'),
});

export const UserIdParamSchema = z.object({
  id: z.string().cuid('Invalid user ID format'),
});

export const UserRoleUpdateSchema = z.object({
  role: z.enum([Role.ADMIN, Role.USER], {
    errorMap: () => ({
      message: 'Role must be either ADMIN or USER',
    }),
  }),
});

export type CreateUserType = z.infer<typeof CreateUserSchema>;
export type UserUpdateType = z.infer<typeof UserUpdateSchema>;
export type UserLoginType = z.infer<typeof UserLoginSchema>;
export type UserOrganizationUpdateType = z.infer<
  typeof UserOrganizationUpdateSchema
>;
export type UserIdParamType = z.infer<typeof UserIdParamSchema>;
