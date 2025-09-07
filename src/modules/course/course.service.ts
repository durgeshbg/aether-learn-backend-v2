import { Prisma, PrismaClient, Role } from '../../generated/prisma';
import { codeAssessmentSelect } from '../code-assessment/code-assessment.service';
import { lessonSelect } from '../lesson/lesson.service';
import { quizSelect } from '../quiz/quiz.service';
import type { CourseCreateType, CourseFeedbackType, CourseUpdateType } from './course.schema';

const prisma = new PrismaClient();

const courseSelect: Prisma.CourseSelect = {
  id: true,
  name: true,
  thumbnailUrl: true,
  rating: true,
  lessonsCount: true,
  quizzesCount: true,
  codeAssessmentsCount: true,
  createdAt: true,
  updatedAt: true,
};

const courseSelectWithContent: Prisma.CourseSelect = {
  id: true,
  name: true,
  description: true,
  thumbnailUrl: true,
  rating: true,
  lessonsCount: true,
  quizzesCount: true,
  codeAssessmentsCount: true,
  lessons: {
    select: lessonSelect,
  },
  quizzes: {
    select: quizSelect,
  },
  codeAssessments: {
    select: codeAssessmentSelect,
  },
  createdAt: true,
  updatedAt: true,
};

const courseFeedbackSelect: Prisma.CourseFeedbackSelect = {
  id: true,
  rating: true,
  comment: true,
  createdAt: true,
  updatedAt: true,
};

const courseFeedbackSelectWithUser: Prisma.CourseFeedbackSelect = {
  id: true,
  rating: true,
  comment: true,
  user: { select: { id: true, firstName: true, lastName: true, email: true } },
  createdAt: true,
  updatedAt: true,
};

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
          select: courseSelect,
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
        select: courseSelect,
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
        select: courseSelect,
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
      select: courseSelect,
    });
  },

  async findById(id: string, userId?: string, orgAdmin?: string | null, role?: Role) {
    if (role === Role.ADMIN) {
      return await prisma.course.findUnique({
        where: { id },
        select: courseSelectWithContent,
      });
    }

    if (orgAdmin) {
      return await prisma.course.findUnique({
        where: { id, organizations: { some: { id: orgAdmin } } },
        select: courseSelectWithContent,
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
        select: {
          ...courseSelectWithContent,
          courseFeedback: { select: courseFeedbackSelect },
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

  async getFeedbacks(courseId: string) {
    return prisma.courseFeedback.findMany({
      where: { courseId },
      select: courseFeedbackSelectWithUser,
    });
  },

  async create(courseData: CourseCreateType) {
    return await prisma.course.create({
      data: {
        name: courseData.name,
        description: courseData.description,
        thumbnailUrl: courseData.thumbnailUrl,
      },
      select: courseSelectWithContent,
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
      select: courseFeedbackSelect,
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
      select: courseSelectWithContent,
    });
  },

  async delete(id: string) {
    return await prisma.course.delete({
      where: { id },
    });
  },
};
