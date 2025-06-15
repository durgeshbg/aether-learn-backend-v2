import type {
  CreateOrganizationType,
  OrganizationUpdateType,
} from './organization.schema';
import { PrismaClient } from '../../generated/prisma';

const prisma = new PrismaClient();

export const OrganizationService = {
  create: async (data: CreateOrganizationType) => {
    return await prisma.organization.create({ data });
  },

  update: async (id: string, data: OrganizationUpdateType) => {
    return await prisma.organization.update({ where: { id }, data });
  },

  updateUsers: async (id: string, userIds: string[]) => {
    return await prisma.organization.update({
      where: { id },
      data: { users: { set: userIds.map((userId) => ({ id: userId })) } },
    });
  },

  updateCourses: async (id: string, courseIds: string[]) => {
    return await prisma.organization.update({
      where: { id },
      data: {
        courses: { set: courseIds.map((courseId) => ({ id: courseId })) },
      },
    });
  },

  delete: async (id: string) => {
    return await prisma.organization.delete({ where: { id } });
  },

  findAllUsers: async (id: string) => {
    return await prisma.organization.findUnique({ where: { id } }).users();
  },

  findAllCourses: async (id: string) => {
    return await prisma.organization.findUnique({ where: { id } }).courses();
  },

  findAll: async () => {
    return await prisma.organization.findMany();
  },

  findById: async (id: string) => {
    return await prisma.organization.findUnique({ where: { id } });
  },

  findByName: async (name: string) => {
    return await prisma.organization.findMany({
      where: {
        name: {
          contains: name,
          mode: 'insensitive', // Case insensitive search
        },
      },
    });
  },
};
