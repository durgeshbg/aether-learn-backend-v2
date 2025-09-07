import type {
  CreateUserType,
  UserDetailsUpdateType,
  UserFilterQueryType,
  UserMarkAsCompleteUpdateType,
} from './user.schema';
import { Prisma, PrismaClient, Role } from '../../generated/prisma';
import { compare } from 'bcrypt-ts';
import { organizationSelect } from '../organization/organization.service';

const prisma = new PrismaClient();

export const userSelect: Prisma.UserSelect = {
  id: true,
  email: true,
  role: true,
  firstName: true,
  lastName: true,
  orgAdminOf: {
    select: {
      id: true,
      name: true,
    },
  },
};

export const userSelectWithDetails: Prisma.UserSelect = {
  id: true,
  email: true,
  role: true,
  firstName: true,
  lastName: true,
  organization: {
    select: organizationSelect,
  },
  orgAdminOf: {
    select: {
      id: true,
      name: true,
    },
  },
  createdAt: true,
  updatedAt: true,
  lastActiveAt: true,
  streakCount: true,
};

const userProgressSelect: Prisma.EnrolledCourseProgressSelect = {
  id: true,
  userId: true,
  course: {
    select: {
      id: true,
      name: true,
    },
  },
  completedAssessments: {
    select: { id: true, title: true },
  },
  completedModules: {
    select: { id: true, title: true },
  },
  completedQuizzes: {
    select: { id: true, title: true },
  },
  nextModuleId: true,
  createdAt: true,
  updatedAt: true,
};

const bookmarkedModuleSelect: Prisma.BookmarkModuleSelect = {
  id: true,
  module: {
    select: {
      id: true,
      title: true,
      lesson: {
        select: {
          id: true,
          title: true,
          course: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
    },
  },
  createdAt: true,
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
      select: userSelectWithDetails,
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
        select: bookmarkedModuleSelect,
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
        select: userProgressSelect,
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

    await UserService.refreshUserStreak(id);

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
      select: userProgressSelect,
    });
  },

  updateDetails: async (id: string, data: UserDetailsUpdateType) => {
    return await prisma.user.update({
      where: { id },
      data,
      select: userSelectWithDetails,
    });
  },

  refreshUserStreak: async (id: string) => {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new Error('User not found');
    }

    const lastActiveAt = user.lastActiveAt ? new Date(user.lastActiveAt) : new Date();
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    lastActiveAt.setHours(0, 0, 0, 0);
    const diffTime = Math.abs(now.getTime() - lastActiveAt.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    let newStreakCount = user.streakCount;
    if (diffDays === 1) {
      newStreakCount += 1; // Increment streak if last active was yesterday
    } else if (diffDays > 1) {
      newStreakCount = 0; // Reset streak if last active was before yesterday
    }
    // If diffDays is 0, do nothing (same day activity)

    return await prisma.user.update({
      where: { id },
      data: {
        streakCount: newStreakCount,
        lastActiveAt: new Date(),
      },
      select: {
        streakCount: true,
        lastActiveAt: true,
      },
    });
  },

  updateRole: async (id: string, role: Role) => {
    return await prisma.user.update({
      where: { id },
      data: { role },
      select: userSelectWithDetails,
    });
  },

  updateOrganization: async (userId: string, organizationId: string) => {
    return await prisma.user.update({
      where: { id: userId },
      data: { organizationId },
      select: userSelectWithDetails,
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

  findBookMarkedModules: async (userId: string) => {
    return prisma.user.findFirst({
      where: { id: userId },
      select: {
        bookmarkedModules: {
          select: bookmarkedModuleSelect,
        },
      },
    });
  },

  findById: async (id: string, filter?: UserFilterQueryType['filter']) => {
    return await prisma.user.findUnique({
      where: { id },
      select: {
        ...userSelectWithDetails,
        codeSolutions: filter === 'code-solutions',
        quizResults: filter == 'quiz-results',
      },
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
          select: userProgressSelect,
        },
      },
    });
  },
};
