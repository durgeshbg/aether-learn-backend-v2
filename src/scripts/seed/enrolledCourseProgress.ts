import {
  PrismaClient,
  type Course,
  type EnrolledCourseProgress,
  type User,
} from '../../generated/prisma';

export const seedEnrolledCourseProgress = async (
  prisma: PrismaClient,
  org1Users: User[],
  org2Users: User[],
  courses: Course[],
): Promise<EnrolledCourseProgress[]> => {
  // Clean up existing data
  await prisma.enrolledCourseProgress.deleteMany({});

  // Seed Data
  const enrolledCourseProgress = await Promise.all([
    prisma.enrolledCourseProgress.create({
      data: {
        userId: org1Users[0]!.id,
        courseId: courses[0]!.id,
      },
    }),
    // prisma.enrolledCourseProgress.create({
    //   data: {
    //     userId: org1Users[0]!.id,
    //     courseId: courses[2]!.id,
    //   },
    // }),
    prisma.enrolledCourseProgress.create({
      data: {
        userId: org1Users[1]!.id,
        courseId: courses[0]!.id,
      },
    }),
    prisma.enrolledCourseProgress.create({
      data: {
        userId: org1Users[1]!.id,
        courseId: courses[2]!.id,
      },
    }),
    prisma.enrolledCourseProgress.create({
      data: {
        userId: org2Users[0]!.id,
        courseId: courses[1]!.id,
      },
    }),
    // prisma.enrolledCourseProgress.create({
    //   data: {
    //     userId: org2Users[1]!.id,
    //     courseId: courses[1]!.id,
    //   },
    // }),
  ]);

  return enrolledCourseProgress;
};
