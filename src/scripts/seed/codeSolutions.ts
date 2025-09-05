import {
  CodeSolutionStatus,
  PrismaClient,
  type CodeAssessment,
  type CodeSolution,
  type User,
} from '../../generated/prisma';

export const seedCodeSolutions = async (
  prisma: PrismaClient,
  org1Users: User[],
  org2Users: User[],
  course1CodeAssessments: CodeAssessment[],
  course2CodeAssessments: CodeAssessment[],
  course3CodeAssessments: CodeAssessment[],
): Promise<CodeSolution[]> => {
  // Clean up existing data
  await prisma.codeSolution.deleteMany({});

  // Seed Data
  const codeSolutionsData: {
    code: string;
    status: CodeSolutionStatus;
    score: number;
    userId: string;
    assessmentId: string;
  }[] = [];

  org1Users.forEach((user) => {
    [...course1CodeAssessments, ...course3CodeAssessments].forEach((assessment) => {
      if (
        user.id === org1Users[0]!.id &&
        course3CodeAssessments.find((a) => a.courseId === assessment.courseId)
      ) {
        // Skip Org1 User1 for Course3 Assessments
        return;
      }
      codeSolutionsData.push({
        code: '// Sample solution code\nconsole.log("Hello, World!");',
        status: CodeSolutionStatus.SUBMITTED,
        score: 0,
        userId: user.id,
        assessmentId: assessment.id,
      });
      codeSolutionsData.push({
        code: '// Sample solution code\nconsole.log("Hello, World!");',
        status: CodeSolutionStatus.GRADED,
        score: 90,
        userId: user.id,
        assessmentId: assessment.id,
      });
    });
  });

  org2Users.forEach((user) => {
    course2CodeAssessments.forEach((assessment) => {
      if (
        user.id === org2Users[1]!.id &&
        course2CodeAssessments.find((a) => a.courseId === assessment.courseId)
      ) {
        // Skip Org2 User2 for Course2 Assessments
        return;
      }
      codeSolutionsData.push({
        code: '// Sample solution code\nconsole.log("Hello, World!");',
        status: CodeSolutionStatus.SUBMITTED,
        score: 0,
        userId: user.id,
        assessmentId: assessment.id,
      });
      codeSolutionsData.push({
        code: '// Sample solution code\nconsole.log("Hello, World!");',
        status: CodeSolutionStatus.GRADED,
        score: 95,
        userId: user.id,
        assessmentId: assessment.id,
      });
    });
  });

  const codeSolutions = await Promise.all(
    codeSolutionsData.map((data) => prisma.codeSolution.create({ data })),
  );
  return codeSolutions;
};
