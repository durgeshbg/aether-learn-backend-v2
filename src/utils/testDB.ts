import { execSync } from 'child_process';
import { PrismaClient, Role } from '../generated/prisma';
import { hash } from 'bcrypt-ts';

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

export async function setupTestDB() {
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

  return { cleanDB, seedUsers };
}
