import { PrismaClient } from '../../generated/prisma';
import { seedBookmarkModules } from './bookmarkModules';
import { seedCodeAssessmentsAndTestCases } from './codeAssesmentsAndTestCases';
import { seedCodeSolutions } from './codeSolutions';
import { seedCourses } from './course';
import { seedCourseFeedbacks } from './courseFeedbacks';
import { seedEnrolledCourseProgress } from './enrolledCourseProgress';
import { seedLessonsModules } from './lessonAndModules';
import { seedOrganizations } from './organization';
import { seedQuizResults } from './quizResults';
import { seedQuizzesAndQuestions } from './quizzesAndQuestions';
import { seedUsers } from './user';

const prisma = new PrismaClient();

async function main() {
  // 2 Organizations
  const orgs = await seedOrganizations(prisma);

  // 1 Admin, 2 Org Admins, 2 Users in Org 1, 2 Users in Org 2
  const { org1users, org2users } = await seedUsers(prisma, orgs);

  // 3 Courses: 1 and 3 for Org 1, 2 for Org 2
  const courses = await seedCourses(prisma, orgs);

  // Org 1 User 1 enrolled in Course 1
  // Org 1 User 2 enrolled in Course 1 and 3
  // Org 2 User 1 enrolled in Course 2
  await seedEnrolledCourseProgress(prisma, org1users, org2users, courses);

  // 2 Lessons with 3 module per course
  const { course1Lessons, course2Lessons, course3Lessons } = await seedLessonsModules(
    prisma,
    org1users,
    org2users,
    courses,
  );

  // 2 Quizzes with 2 questions per course
  const { course1Quizzes, course2Quizzes, course3Quizzes } = await seedQuizzesAndQuestions(
    prisma,
    courses,
  );

  // 2 Code Assessments with 3 test cases per course
  const { course1CodeAssessments, course2CodeAssessments, course3CodeAssessments } =
    await seedCodeAssessmentsAndTestCases(prisma, courses);

  await seedBookmarkModules(
    prisma,
    org1users,
    org2users,
    course1Lessons,
    course2Lessons,
    course3Lessons,
  );
  await seedQuizResults(
    prisma,
    org1users,
    org2users,
    course1Quizzes,
    course2Quizzes,
    course3Quizzes,
  );
  await seedCodeSolutions(
    prisma,
    org1users,
    org2users,
    course1CodeAssessments,
    course2CodeAssessments,
    course3CodeAssessments,
  );
  await seedCourseFeedbacks(prisma, org1users, org2users, courses);

  // Update all enrolled course progress completion percentage
  const enrollmentsData = await prisma.enrolledCourseProgress.findMany({
    select: {
      id: true,
      courseId: true,
      completedAssessments: {
        select: { id: true },
      },
      completedModules: {
        select: { id: true },
      },
      completedQuizzes: {
        select: { id: true },
      },
    },
  });
  const coursesData = await prisma.course.findMany({
    select: {
      id: true,
      modulesCount: true,
      quizzesCount: true,
      codeAssessmentsCount: true,
    },
  });
  await Promise.all(
    enrollmentsData.map((enrollment) => {
      const course = coursesData.find((c) => c.id === enrollment.courseId);
      if (course) {
        const totalCount =
          course?.modulesCount + course?.quizzesCount + course?.codeAssessmentsCount;
        const completedCount =
          enrollment.completedModules.length +
          enrollment.completedQuizzes.length +
          enrollment.completedAssessments.length;
        const rate = totalCount === 0 ? 0 : (completedCount / totalCount) * 100;
        return prisma.enrolledCourseProgress.update({
          where: { id: enrollment.id },
          data: { completionRate: rate },
        });
      }
    }),
  );
}

main()
  .then(() => {
    prisma.$disconnect();
    console.log('Seeding completed successfully.');
    process.exit(0);
  })
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
