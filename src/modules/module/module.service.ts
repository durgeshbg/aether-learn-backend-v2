import { PrismaClient } from '../../generated/prisma';
import type { ModuleCreateType, ModuleUpdateType } from './module.schema';

const prisma = new PrismaClient();

export const ModuleService = {
  findAll: async (lessonId: string) => {
    return await prisma.module.findMany({ where: { lessonId } });
  },
  create: async (lessonId: string, moduleData: ModuleCreateType) => {
    return await prisma.module.create({
      data: { ...moduleData, lessonId },
    });
  },
  findById: async (id: string, lessonId: string) => {
    return await prisma.module.findUnique({
      where: { id, lessonId },
    });
  },
  update: async (
    id: string,
    lessonId: string,
    moduleData: ModuleUpdateType
  ) => {
    return await prisma.module.update({
      where: { id, lessonId },
      data: moduleData,
    });
  },
  delete: async (id: string, lessonId: string) => {
    return await prisma.module.delete({
      where: { id, lessonId },
    });
  },
};
