import bcrypt from 'bcrypt';
import { PrismaClient } from '../generated/prisma';

const languages = {
  PYTHON_3_11: 92,
};

const prisma = new PrismaClient();

async function main() {
  // 1. Create Users
  const hashedPassword = await bcrypt.hash('password', 10);
  const user = await prisma.user.create({
    data: {
      email: 'user@example.com',
      password: hashedPassword,
      firstName: 'Jane',
      lastName: 'Doe',
      role: 'USER',
    },
  });

  const admin = await prisma.user.create({
    data: {
      email: 'admin@example.com',
      password: hashedPassword,
      firstName: 'John',
      lastName: 'Smith',
      role: 'ADMIN',
    },
  });

  // 2. Create Organization
  const organization = await prisma.organization.create({
    data: {
      name: 'OpenAI Academy',
      description: 'An AI-powered learning platform',
      email: 'contact@openaiacademy.com',
      orgAdmin: {
        connect: { id: admin.id },
      },
      users: {
        connect: [{ id: user.id }],
      },
    },
  });

  // Update user with org ID
  await prisma.user.update({
    where: { id: user.id },
    data: {
      organizationId: organization.id,
    },
  });

  // 3. Create Course
  const course = await prisma.course.create({
    data: {
      name: 'Intro to Programming',
      description: 'A beginner course for programming',
      organizationId: organization.id,
    },
  });

  // 4. Create Lessons and Modules
  const lesson = await prisma.lesson.create({
    data: {
      title: 'Getting Started',
      content: 'Welcome to programming!',
      courseId: course.id,
    },
  });

  await prisma.module.create({
    data: {
      title: 'Hello World',
      content: 'print("Hello, World!")',
      code: 'print("Hello, World!")',
      languageId: 1, // assume Python is 1
      lessonId: lesson.id,
    },
  });

  // 5. Create Quiz with Questions
  const quiz = await prisma.quiz.create({
    data: {
      title: 'Basics Quiz',
      courseId: course.id,
      questions: {
        create: [
          {
            text: 'What is 2 + 2?',
            options: ['1', '2', '4', '5'],
            answer: 2,
            explanation: 'Because 2 + 2 equals 4.',
          },
        ],
      },
    },
  });

  // 6. Create a Quiz Result
  await prisma.quizResult.create({
    data: {
      score: 100,
      userId: user.id,
      quizId: quiz.id,
    },
  });

  // 7. Create Code Assessment with Test Cases
  const assessment = await prisma.codeAssessment.create({
    data: {
      title: 'Add Numbers',
      description: 'Write a function to add two numbers',
      instructions: 'Define a function add(a, b) that returns a + b',
      starterCode: 'def add(a, b):\n    # Your code here',
      languageId: 1,
      courseId: course.id,
      testCases: {
        create: [
          {
            input: '2, 3',
            expected: '5',
            description: 'Basic addition',
          },
          {
            input: '-1, 1',
            expected: '0',
            description: 'Negative and positive',
          },
        ],
      },
    },
  });

  // 8. Create Code Solution
  await prisma.codeSolution.create({
    data: {
      code: 'def add(a, b): return a + b',
      status: 'SUBMITTED',
      score: 100,
      userId: user.id,
      assessmentId: assessment.id,
    },
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  })
  .finally(() => {
    console.log('Seeding completed');
  });
