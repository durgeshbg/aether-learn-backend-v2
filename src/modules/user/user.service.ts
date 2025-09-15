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

export const userProgressSelect: Prisma.EnrolledCourseProgressSelect = {
  id: true,
  userId: true,
  course: {
    select: {
      id: true,
      name: true,
    },
  },
  completionRate: true,
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

const moduleLinkSelect: Prisma.ModuleSelect = {
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
};

const bookmarkedModuleSelect: Prisma.BookmarkModuleSelect = {
  id: true,
  module: {
    select: moduleLinkSelect,
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

    const updatedEnrollmentProgress = await prisma.enrolledCourseProgress.update({
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

    await UserService.updateCourseCompletionRate(updatedEnrollmentProgress, parsedBody.courseId);

    return updatedEnrollmentProgress;
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

  getDashboardStats: async (userId?: string, orgAmdin?: string, role?: Role) => {
    if (role === Role.ADMIN) {
      const organizationsCount = await prisma.organization.count();
      const usersCount = await prisma.user.count();
      const coursesCount = await prisma.course.count();
      return { organizationsCount, usersCount, coursesCount };
    }
    if (orgAmdin) {
      const usersCount = await prisma.user.count({
        where: { organizationId: orgAmdin },
      });

      const courses = await prisma.course.findMany({
        where: {
          organizations: {
            some: {
              id: orgAmdin,
            },
          },
        },
        select: { id: true, name: true },
      });
      const coursesCount = courses.length;

      const top5CompletedCourseIds = await prisma.enrolledCourseProgress.groupBy({
        by: ['courseId'],
        _avg: { completionRate: true },
        _count: { courseId: true },
        orderBy: { _avg: { completionRate: 'desc' } },
        where: {
          course: {
            organizations: {
              some: {
                id: orgAmdin,
              },
            },
          },
        },
        take: 5,
      });

      const top5CompletedCourses = top5CompletedCourseIds.map((course) => {
        const courseInfo = courses.find((c) => c.id === course.courseId);
        return {
          id: course.courseId,
          name: courseInfo ? courseInfo.name : 'Unknown Course',
          totalEnrollments: course._count.courseId,
          averageCompletionRate: course._avg.completionRate || 0,
        };
      });

      const recentlyUpdatedCourses = await prisma.enrolledCourseProgress.findMany({
        orderBy: { updatedAt: 'desc' },
        take: 5,
        select: {
          id: true,
          course: {
            select: {
              id: true,
              name: true,
            },
          },
          user: {
            select: { id: true, firstName: true, lastName: true },
          },
          completionRate: true,
          updatedAt: true,
        },
      });
      return { usersCount, coursesCount, top5CompletedCourses, recentlyUpdatedCourses };
    }
    if (userId) {
      const enrolledCoursesCount = await prisma.enrolledCourseProgress.count({
        where: { userId },
      });
      return { enrolledCoursesCount };
    }
  },

  findByEmail: async (email: string) => {
    return await prisma.user.findUnique({
      where: { email },
      select: userSelect,
    });
  },

  findUserProgress: async (userId: string) => {
    const user = await prisma.user.findFirst({
      where: {
        id: userId,
      },
      include: {
        organization: true,
        enrolledCourseProgress: {
          select: userProgressSelect,
          orderBy: { updatedAt: 'desc' },
        },
      },
    });

    const progress = await Promise.all(
      user?.enrolledCourseProgress.map(async (p) => {
        let nextModule = null;
        if (p.nextModuleId) {
          nextModule = await prisma.module.findUnique({
            where: { id: p.nextModuleId },
            select: moduleLinkSelect,
          });
        }
        return {
          ...p,
          nextModule,
        };
      }) || [],
    );
    return { user, progress };
  },

  updateCourseCompletionRate: async (
    enrolledData: {
      id: string;
      completedModules?: { id: string }[];
      completedAssessments?: { id: string }[];
      completedQuizzes?: { id: string }[];
    },
    courseId: string,
  ) => {
    const course = await prisma.course.findUnique({
      where: { id: courseId },
    });

    if (!course) {
      throw new Error('Course not found');
    }

    const totalItems = course.modulesCount + course.codeAssessmentsCount + course.quizzesCount;

    const completedItems =
      (enrolledData.completedModules?.length || 0) +
      (enrolledData.completedAssessments?.length || 0) +
      (enrolledData.completedQuizzes?.length || 0);
    const completionRate = totalItems === 0 ? 0 : (completedItems / totalItems) * 100;

    return await prisma.enrolledCourseProgress.update({
      where: { id: enrolledData.id },
      data: { completionRate },
      select: { completionRate: true },
    });
  },
};
