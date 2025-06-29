import { execSync } from 'child_process';
import { PrismaClient, Role } from '../generated/prisma';
import { hash } from 'bcrypt-ts';
import type { Application } from 'express';
import supertest from 'supertest';
import { LANG_KEYS, LANGUAGES_MAP } from '../laguages';

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
  commandExecSync('bunx prisma db push');

  const cleanDB = async () => {
    commandExecSync('bunx prisma migrate reset --force');
  };

  const seedUsers = async (prisma: PrismaClient) => {
    const hashedPassword = await hash('password', 10);
    await prisma.user.createMany({
      data: [
        {
          email: 'admin@mail.com',
          password: hashedPassword,
          role: Role.ADMIN,
        },
        {
          email: 'user@mail.com',
          password: hashedPassword,
          role: Role.USER,
        },
      ],
    });
  };

  const seedCourses = async (prisma: PrismaClient) => {
    return await prisma.course.create({
      data: {
        name: 'Introduction to Programming',
        description: 'Learn the basics of programming.',
      },
    });
  };

  const seedLessons = async (prisma: PrismaClient, courseId: string) => {
    return await prisma.lesson.create({
      data: {
        title: 'Getting Started with Programming',
        content: 'This lesson covers the basics of programming.',
        courseId,
      },
    });
  };

  const seedQuizzes = async (prisma: PrismaClient, courseId: string) => {
    return await prisma.quiz.create({
      data: {
        title: 'Programming Basics Quiz',
        description: 'Test your knowledge on programming basics.',
        courseId,
      },
    });
  };

  const seedCodeAssessments = async (
    prisma: PrismaClient,
    courseId: string
  ) => {
    const language = LANGUAGES_MAP[LANG_KEYS.PYTHON_3_12];
    if (!language) {
      throw new Error('Language PYTHON_3_12 not found in LANGUAGES_MAP');
    }
    const languageId = language.id;
    return await prisma.codeAssessment.create({
      data: {
        title: 'Basic Programming Assessment',
        description: 'Assess your programming skills.',
        instructions: 'Write a simple program to demonstrate your skills.',
        starterCode: 'print("Hello, World!")',
        languageId,
        courseId,
      },
    });
  };

  const getTokens = async (app: Application) => {
    const admin = await supertest(app)
      .post('/api/v1/users/login')
      .send({ email: 'admin@mail.com', password: 'password' });

    const user = await supertest(app).post('/api/v1/users/login').send({
      email: 'user@mail.com',
      password: 'password',
    });

    return {
      adminToken: admin.body.token,
      userToken: user.body.token,
    };
  };

  return {
    cleanDB,
    seedUsers,
    getTokens,
    seedCourses,
    seedLessons,
    seedQuizzes,
    seedCodeAssessments,
  };
}
