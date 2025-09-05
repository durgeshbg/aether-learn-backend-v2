import { PrismaClient, type Course, type CourseFeedback, type User } from '../../generated/prisma';

export const seedCourseFeedbacks = async (
  prisma: PrismaClient,
  org1users: User[],
  org2users: User[],
  courses: Course[],
): Promise<CourseFeedback[]> => {
  // Clean up existing data
  await prisma.courseFeedback.deleteMany({});

  // Seed Data
  const feedbacksData: {
    userId: string;
    courseId: string;
    rating: number;
    comment: string;
  }[] = [];

  org1users.forEach((user) => {
    feedbacksData.push({
      userId: user.id,
      courseId: courses[0]!.id,
      rating: 5,
      comment: 'Great course on JavaScript basics!',
    });
    if (user.id === org1users[0]!.id) {
      // Skip Org1 User1 for Course3 Feedback
      return;
    }
    feedbacksData.push({
      userId: user.id,
      courseId: courses[2]!.id,
      rating: 4,
      comment: 'Informative React course, but could use more examples.',
    });
  });

  org2users.forEach((user) => {
    if (user.id === org2users[1]!.id) {
      // Skip Org2 User2 for Course2 Feedback
      return;
    }
    feedbacksData.push({
      userId: user.id,
      courseId: courses[1]!.id,
      rating: 4,
      comment: 'Very informative Node.js course.',
    });
  });

  const feedbacks = await Promise.all(
    feedbacksData.map((data) => prisma.courseFeedback.create({ data })),
  );

  return feedbacks;
};
