import type {
  CreateUserType,
  UserDetailsUpdateType,
  UserFilterQueryType,
  UserMarkAsCompleteUpdateType,
} from './user.schema';
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

  updateBookMarkModule: async (userId: string, moduleId: string, bookmark: boolean) => {
    const module = await prisma.module.findFirst({
      where: {
        id: moduleId,
        lesson: {
          course: {
            organizations: {
              some: {
                users: {
                  some: {
                    id: userId,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!module) {
      throw new Error(
        'Module not found or user does not belong to the organization offering the course.',
      );
    }

    if (bookmark) {
      const bookmark = await prisma.bookmarkModule.upsert({
        where: {
          userId_moduleId: {
            userId,
            moduleId,
          },
        },
        update: {},
        create: {
          userId,
          moduleId,
        },
      });
      return bookmark;
    } else {
      return await prisma.bookmarkModule.deleteMany({
        where: { userId, moduleId },
      });
    }
  },

  updateCourseEnrollment: async (userId: string, courseId: string, enroll: boolean) => {
    const course = await prisma.course.findFirst({
      where: {
        id: courseId,
        organizations: {
          some: {
            users: {
              some: {
                id: userId,
              },
            },
          },
        },
      },
      include: { lessons: { include: { modules: true } } },
    });

    if (!course) {
      throw new Error(
        'Course not found or user does not belong to the organization offering the course.',
      );
    }

    if (enroll) {
      const enrollment = await prisma.enrolledCourseProgress.upsert({
        where: {
          userId_courseId: {
            userId,
            courseId,
          },
        },
        update: {},
        create: {
          userId,
          courseId,
          nextModuleId: course.lessons[0]?.modules[0]?.id || null,
        },
      });
      return enrollment;
    } else {
      return await prisma.enrolledCourseProgress.deleteMany({
        where: { userId, courseId },
      });
    }
  },

  updateModuleMarkAsComplete: async (id: string, parsedBody: UserMarkAsCompleteUpdateType) => {
    const isEnrolled = await prisma.enrolledCourseProgress.findFirst({
      where: {
        userId: id,
        courseId: parsedBody.courseId,
      },
    });

    if (!isEnrolled) {
      throw new Error('You did not enroll in this course.');
    }

    const mode = parsedBody.complete ? 'connect' : 'disconnect';

    return prisma.enrolledCourseProgress.update({
      where: {
        userId_courseId: {
          courseId: parsedBody.courseId,
          userId: id,
        },
      },
      data: {
        completedModules: {
          [mode]: {
            id: parsedBody.moduleId,
          },
        },
      },
      include: {
        completedModules: {
          select: {
            id: true,
          },
        },
      },
    });
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

  findUserProgress: (userId: string) => {
    return prisma.user.findFirst({
      where: {
        id: userId,
      },
      include: {
        organization: true,
        enrolledCourseProgress: {
          include: {
            completedAssessments: true,
            completedModules: true,
            completedQuizzes: true,
          },
        },
      },
    });
  },
};
