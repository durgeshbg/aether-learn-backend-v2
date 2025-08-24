import type { CreateUserType, UserDetailsUpdateType, UserFilterQueryType } from './user.schema';
import { PrismaClient, Role } from '../../generated/prisma';
import { compare } from 'bcrypt-ts';

const prisma = new PrismaClient();

export const userSelect = {
  id: true,
  email: true,
  role: true,
  firstName: true,
  lastName: true,
  organization: true,
  orgAdminOf: true,
  createdAt: true,
  updatedAt: true,
};

export const UserService = {
  create: async (data: CreateUserType) => {
    const connectIfOrgAdmin = data.orgAdmin ? { connect: { id: data.organizationId } } : undefined;

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

  updateDetails: async (id: string, data: UserDetailsUpdateType) => {
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

  findNonOrganizationUsers: async () => {
    return await prisma.user.findMany({
      select: userSelect,
      where: { organizationId: null },
    });
  },

  findById: async (id: string, filter?: UserFilterQueryType['filter']) => {
    const userSelectWithFilter = {
      ...userSelect,
      codeSolutions: filter === 'code-solutions' ? true : undefined,
      quizResults: filter == 'quiz-results' ? true : undefined,
    };

    return await prisma.user.findUnique({
      where: { id },
      select: userSelectWithFilter,
    });
  },

  findByEmail: async (email: string) => {
    return await prisma.user.findUnique({
      where: { email },
      select: userSelect,
    });
  },
};
