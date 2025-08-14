import { execSync } from 'child_process';
import { PrismaClient, Role, type User } from '../generated/prisma';
import { hash } from 'bcrypt-ts';
import { LANG_KEYS, LANGUAGES_MAP } from '../laguages';
import jwt from 'jsonwebtoken';

export type UserOrgAdmin = User & {
  orgAdminOf: { id: string } | null;
};

export const staticData = {
  USER_TEST_EMAILS: {
    admin: 'admin@mail.com',
    user: 'user@mail.com',
    user2: 'user2@mail.com',
    user3: 'user3@mail.com',
    user4: 'user4@mail.com',
  },
  USER_TEST_PASSWORD: 'password',

  ORGANIZATION_TEST_NAME: 'Test Organization',

  COURSE_TEST_NAME: 'Test Course',

  LESSON_TEST_TITLE: 'Test Lesson',
  MODULE_TEST_TITLE: 'Test Module',

  QUIZ_TEST_TITLE: 'Test Quiz',
  QUESTION_TEST_TEXT: 'What is the capital of France?',
  QUESTION_TEST_OPTIONS: ['Paris', 'London', 'Berlin', 'Madrid'],
  QUESTION_TEST_ANSWER: 1,

  CODE_ASSESSMENT_TEST_TITLE: 'Test Code Assessment',
  CODE_ASSESSMENT_TEST_DESCRIPTION:
    'Write a function to return the sum of two numbers.',
  CODE_ASSESSMENT_TEST_INSTRUCTIONS:
    'Implement the function in the starter code.',
  CODE_ASSESSMENT_TEST_STARTER_CODE: 'function sum(a, b) {\n  return a + b;\n}',
  CODE_ASSESSMENT_TEST_LANGUAGE_ID:
    LANGUAGES_MAP[LANG_KEYS.JAVASCRIPT_NODE_18]?.id,

  TEST_CASE_TEST_DESCRIPTION: 'Test case for sum function',
  TEST_CASE_TEST_INPUT: '1, 2',
  TEST_CASE_TEST_EXPECTED: '3',

  CODE_SOLUTION_TEST_CODE: 'function sum(a, b) {\n  return a + b;\n}',
};

const commandExecSync = (command: string) => {
  try {
    execSync(command, {
      env: {
        ...process.env,
      },
    });
  } catch (error) {
    console.error(`Error executing command "${command}":`, error);
    throw error;
  }
};

export async function setupTests() {
  commandExecSync('bunx prisma db push --accept-data-loss');

  const cleanDB = async () => {
    commandExecSync('bunx prisma migrate reset --force');
  };

  const seedUser = async (
    prisma: PrismaClient,
    email: string,
    role: Role,
    password: string,
    organizationId?: string
  ) => {
    const hashedPassword = await hash(password, 10);
    return await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        organizationId,
        role,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        password: true,
        role: true,
        organizationId: true,
        createdAt: true,
        updatedAt: true,
        orgAdminOf: {
          select: {
            id: true,
          },
        },
      },
    });
  };

  const genToken = (
    user: User & {
      orgAdminOf: { id: string } | null;
    }
  ) => {
    return jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
        orgAdmin: user?.orgAdminOf?.id || null,
      },
      process.env.JWT_SECRET!,
      {
        expiresIn: '24h',
      }
    );
  };

  const seedOrganization = async (
    prisma: PrismaClient,
    name: string,
    orgAdminId: string
  ) => {
    return await prisma.organization.create({
      data: {
        name,
        description: `Description for ${name}`,
        orgAdminId,
        users: {
          connect: { id: orgAdminId },
        }
      },
    });
  };

  const seedCourse = async (
    prisma: PrismaClient,
    name: string,
    organizationId?: string
  ) => {
    return await prisma.course.create({
      data: {
        name,
        organizations: {
          connect: organizationId ? { id: organizationId } : undefined,
        },
      },
    });
  };

  const seedLesson = async (
    prisma: PrismaClient,
    title: string,
    courseId: string
  ) => {
    return await prisma.lesson.create({
      data: {
        title,
        content: 'This is a sample lesson content.',
        courseId,
      },
    });
  };

  const seedModule = async (
    prisma: PrismaClient,
    lessonId: string,
    title: string
  ) => {
    const languageId = LANGUAGES_MAP[LANG_KEYS.JAVASCRIPT_NODE_18]?.id;
    if (!languageId) {
      throw new Error('Language JAVASCRIPT_NODE_18 not found in LANGUAGES_MAP');
    }
    return await prisma.module.create({
      data: {
        languageId,
        title,
        content: 'This is a sample module content.',
        lessonId,
      },
    });
  };

  const seedQuiz = async (
    prisma: PrismaClient,
    title: string,
    courseId: string
  ) => {
    return await prisma.quiz.create({
      data: {
        title,
        description: 'This is a sample quiz description.',
        courseId,
      },
    });
  };

  const seedQuestion = async (
    prisma: PrismaClient,
    quizId: string,
    text: string,
    options: string[],
    answer: number
  ) => {
    return await prisma.question.create({
      data: {
        text,
        options,
        answer,
        quizId,
      },
    });
  };

  const seedQuizResult = async (
    prisma: PrismaClient,
    quizId: string,
    userId: string,
    score: number = 0
  ) => {
    return await prisma.quizResult.create({
      data: {
        quizId,
        userId,
        score,
      },
    });
  };

  const seedCodeAssessment = async (
    prisma: PrismaClient,
    courseId: string,
    title: string,
    description: string,
    instructions: string,
    starterCode: string,
    languageId?: number
  ) => {
    if (!languageId) {
      throw new Error('Language ID is required for code assessment');
    }

    return await prisma.codeAssessment.create({
      data: {
        title,
        description,
        instructions,
        starterCode,
        languageId,
        courseId,
      },
    });
  };

  const seedTestCase = async (
    prisma: PrismaClient,
    description: string,
    input: string,
    expected: string,
    codeAssessmentId: string
  ) => {
    return await prisma.testCase.create({
      data: {
        description,
        input,
        expected,
        assessmentId: codeAssessmentId,
      },
    });
  };

  const seedCodeSolution = async (
    prisma: PrismaClient,
    code: string,
    codeAssessmentId: string,
    userId: string
  ) => {
    return await prisma.codeSolution.create({
      data: {
        code,
        assessmentId: codeAssessmentId,
        userId,
      },
    });
  };

  return {
    cleanDB,
    seedUser,
    genToken,
    seedOrganization,
    seedCourse,
    seedLesson,
    seedModule,
    seedQuiz,
    seedQuestion,
    seedQuizResult,
    seedCodeAssessment,
    seedTestCase,
    seedCodeSolution,
  };
}
