import { hash } from 'bcrypt-ts';
import { PrismaClient, Role, type Organization, type User } from '../../generated/prisma';

export const seedUsers = async (
  prisma: PrismaClient,
  orgs: Organization[],
): Promise<{
  admin: User;
  orgAdmins: User[];
  org1users: User[];
  org2users: User[];
}> => {
  // Clean up existing data
  await prisma.user.deleteMany({});

  // Seed data
  const hashedPassword = await hash('password', 10);
  const admin = await prisma.user.create({
    data: {
      email: 'admin1@mail.com',
      password: hashedPassword,
      firstName: 'Alice',
      lastName: 'Doe',
      role: Role.ADMIN,
      streakCount: 5,
      lastActiveAt: new Date(),
    },
  });

  const orgAdmins = await Promise.all([
    prisma.user.create({
      data: {
        email: 'org1admin@mail.com',
        password: hashedPassword,
        firstName: 'Bob',
        lastName: 'Smith',
        role: Role.USER,
        orgAdminOf: { connect: { id: orgs[0]?.id } },
        streakCount: 3,
        lastActiveAt: new Date(),
        organizationId: orgs[0]?.id,
      },
    }),
    prisma.user.create({
      data: {
        email: 'org2admin@mail.com',
        password: hashedPassword,
        firstName: 'Eve',
        lastName: 'Johnson',
        role: Role.USER,
        orgAdminOf: { connect: { id: orgs[1]?.id } },
        streakCount: 4,
        lastActiveAt: new Date(),
        organizationId: orgs[1]?.id,
      },
    }),
  ]);

  const org1users = await Promise.all([
    prisma.user.create({
      data: {
        email: 'user1@mail.com',
        password: hashedPassword,
        firstName: 'Charlie',
        lastName: 'Brown',
        organization: { connect: { id: orgs[0]?.id } },
        streakCount: 2,
        lastActiveAt: new Date(),
      },
    }),
    prisma.user.create({
      data: {
        email: 'user2@mail.com',
        password: hashedPassword,
        firstName: 'Diana',
        lastName: 'Prince',
        organization: { connect: { id: orgs[0]?.id } },
        streakCount: 1,
        lastActiveAt: new Date(),
      },
    }),
  ]);

  const org2users = await Promise.all([
    prisma.user.create({
      data: {
        email: 'user3@mail.com',
        password: hashedPassword,
        firstName: 'Evan',
        lastName: 'Lee',
        organization: { connect: { id: orgs[1]?.id } },
        streakCount: 8,
        lastActiveAt: new Date(),
      },
    }),
    prisma.user.create({
      data: {
        email: 'user4@mail.com',
        password: hashedPassword,
        firstName: 'Grace',
        lastName: 'Kim',
        organization: { connect: { id: orgs[1]?.id } },
        streakCount: 4,
        lastActiveAt: new Date(),
      },
    }),
  ]);

  await prisma.organization.update({
    where: { id: orgs[0]?.id },
    data: { usersCount: 3 },
  });

  await prisma.organization.update({
    where: { id: orgs[1]?.id },
    data: { usersCount: 3 },
  });

  return { admin, orgAdmins, org1users, org2users };
};
