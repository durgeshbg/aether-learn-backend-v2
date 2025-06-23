import type { CreateUserType, UserUpdateType } from './user.schema';
import { PrismaClient, Role } from '../../generated/prisma';
import { compare } from 'bcrypt-ts';

const prisma = new PrismaClient();

export const UserService = {
  create: async (data: CreateUserType) => {
    return await prisma.user.create({ data });
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

  update: async (id: string, data: UserUpdateType) => {
    return await prisma.user.update({ where: { id }, data });
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
    });
  },

  delete: async (id: string) => {
    return await prisma.user.delete({ where: { id } });
  },

  findAll: async () => {
    return await prisma.user.findMany({
      select: {
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
      },
    });
  },

  findById: async (id: string) => {
    return await prisma.user.findUnique({ where: { id } });
  },

  findByEmail: async (email: string) => {
    return await prisma.user.findUnique({ where: { email } });
  },
};
