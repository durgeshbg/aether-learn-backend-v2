import { execSync } from 'child_process';
import { PrismaClient, Role } from '../generated/prisma';
import { hash } from 'bcrypt-ts';
import type { Application } from 'express';
import supertest from 'supertest';

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
    await prisma.course.create({
      data: {
        name: 'Introduction to Programming',
        description: 'Learn the basics of programming.',
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

  return { cleanDB, seedUsers, getTokens, seedCourses };
}
