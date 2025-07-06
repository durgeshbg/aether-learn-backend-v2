import type { CreateUserType, UserNameUpdateType } from './user.schema';
import { PrismaClient, Role } from '../../generated/prisma';
import { compare } from 'bcrypt-ts';

const prisma = new PrismaClient();

export const userSelect = {
  id: true,
  email: true,
  role: true,
  firstName: true,
  lastName: true,
  organizationId: true,
  orgAdminOf: {
    select: {
      id: true,
      name: true,
    },
  },
};

export const UserService = {
  create: async (data: CreateUserType) => {
    const connectIfOrgAdmin = data.orgAdmin
      ? { connect: { id: data.organizationId } }
      : undefined;

    return await prisma.user.create({
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        password: data.password,
        role: data.role,
        organizationId: data.organizationId,
        orgAdminOf: connectIfOrgAdmin,
      },
      select: userSelect,
    });
  },

  login: async (email: string, password: string) => {
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        role: true,
        password: true,
        orgAdminOf: true,
      },
    });
    if (!user) {
      return null;
    }
    const hashedPassword = user.password;
    const isPasswordValid = await compare(password, hashedPassword);
    if (!isPasswordValid) {
      return null;
    }
    return user;
  },

  updateName: async (id: string, data: UserNameUpdateType) => {
    return await prisma.user.update({
      where: { id },
      data,
      select: userSelect,
    });
  },

  updateRole: async (id: string, role: Role) => {
    return await prisma.user.update({
      where: { id },
      data: { role },
    });
  },

  updateOrgAdmin: async (id: string, organizationId: string) => {
    const organization = await prisma.organization.findFirst({
      where: { id: organizationId },
    });
    return await prisma.user.update({
      where: {
        id,
      },
      data: {
        orgAdminOf: {
          connect: {
            id: organization?.id,
          },
        },
      },
      select: userSelect,
    });
  },

  updateOrganization: async (userId: string, organizationId: string) => {
    return await prisma.user.update({
      where: { id: userId },
      data: { organizationId },
      select: userSelect,
    });
  },

  delete: async (id: string) => {
    return await prisma.user.delete({ where: { id } });
  },

  findAll: async (orgId?: string) => {
    return await prisma.user.findMany({
      select: userSelect,
      where: orgId ? { organizationId: orgId } : undefined,
    });
  },

  findById: async (id: string) => {
    return await prisma.user.findUnique({
      where: { id },
      select: userSelect,
    });
  },

  findByEmail: async (email: string) => {
    return await prisma.user.findUnique({
      where: { email },
      select: userSelect,
    });
  },

  findAllInOrganization: async (organizationId: string) => {
    return await prisma.user.findMany({
      where: { organizationId },
      select: userSelect,
    });
  },
};
