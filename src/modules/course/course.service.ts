import { PrismaClient, Role } from '../../generated/prisma';
import type { CourseCreateType, CourseFeedbackType, CourseUpdateType } from './course.schema';

const prisma = new PrismaClient();

export const CourseService = {
  async findAll(userId?: string, orgAdmin?: string | null, role?: Role, organizationId?: string) {
    if (role === Role.ADMIN) {
      return await prisma.course.findMany({
        ...(organizationId && {
          where: {
            organizations: {
              some: {
                id: organizationId,
              },
            },
          },
        }),
      });
    }

    if (orgAdmin) {
      return await prisma.course.findMany({
        where: {
          organizations: {
            some: {
              id: orgAdmin,
            },
          },
        },
      });
    }

    if (userId) {
      const courses = await prisma.course.findMany({
        where: {
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
      });
      const enrollerCourses = await prisma.enrolledCourseProgress.findMany({
        where: {
          userId,
          courseId: { in: courses.map((c) => c.id) },
        },
        include: {
          course: true,
        },
      });

      return courses.map((c) => ({
        ...c,
        enrolled: enrollerCourses.some((ec) => ec.courseId === c.id),
      }));
    }
  },

  async findAllNonOrganizationCourses(organizationId: string) {
    return await prisma.course.findMany({
      where: {
        organizations: {
          none: {
            id: organizationId,
          },
        },
      },
    });
  },

  async findById(id: string, userId?: string, orgAdmin?: string | null, role?: Role) {
    if (role === Role.ADMIN) {
      return await prisma.course.findUnique({
        where: { id },
      });
    }

    if (orgAdmin) {
      return await prisma.course.findUnique({
        where: { id, organizations: { some: { id: orgAdmin } } },
      });
    }

    if (userId) {
      const course = await prisma.course.findUnique({
        where: {
          id,
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
        include: {
          courseFeedback: {
            where: { userId },
            select: { id: true },
          },
        },
      });

      if (!course) return null;

      const enrollment = await prisma.enrolledCourseProgress.findUnique({
        where: { userId_courseId: { userId, courseId: id } },
      });

      const feedbackSubmitted = course.courseFeedback.length > 0;

      delete course?.courseFeedback;

      return {
        ...course,
        enrolled: !!enrollment,
        feedbackSubmitted,
      };
    }
  },

  getFeedbacks(courseId: string) {
    return prisma.courseFeedback.findMany({
      where: { courseId },
      include: { user: { select: { id: true, firstName: true, lastName: true, email: true } } },
    });
  },

  async create(courseData: CourseCreateType) {
    return await prisma.course.create({
      data: {
        name: courseData.name,
        description: courseData.description,
        thumbnailUrl: courseData.thumbnailUrl,
      },
    });
  },

  async createFeedback(courseId: string, userId: string, feedbackData: CourseFeedbackType) {
    const existingFeedback = await prisma.courseFeedback.findUnique({
      where: { userId_courseId: { userId, courseId } },
    });
    if (existingFeedback) {
      return null;
    }
    const feedback = await prisma.courseFeedback.create({
      data: {
        courseId,
        userId,
        rating: feedbackData.rating,
        comment: feedbackData.comment,
      },
    });

    await prisma.course.update({
      where: { id: courseId },
      data: {
        rating: await prisma.courseFeedback
          .aggregate({
            where: { courseId },
            _avg: { rating: true },
          })
          .then((res) => res._avg.rating || 0),
      },
    });

    return feedback;
  },

  async update(id: string, courseData: CourseUpdateType) {
    return await prisma.course.update({
      where: { id },
      data: {
        name: courseData.name,
        description: courseData.description,
        thumbnailUrl: courseData.thumbnailUrl,
      },
      include: {
        lessons: true,
        quizzes: true,
        codeAssessments: true,
      },
    });
  },

  async delete(id: string) {
    return await prisma.course.delete({
      where: { id },
    });
  },
};
