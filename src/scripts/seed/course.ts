import { PrismaClient, type Course, type Organization } from '../../generated/prisma';

export const seedCourses = async (
  prisma: PrismaClient,
  orgs: Organization[],
): Promise<Course[]> => {
  // Clean up existing data
  await prisma.course.deleteMany({});

  // Seed data
  const courses = await Promise.all([
    prisma.course.create({
      data: {
        name: 'JavaScript Basics',
        description: 'Introduction to JavaScript',
        thumbnailUrl:
          'https://upload.wikimedia.org/wikipedia/commons/thumb/9/99/Unofficial_JavaScript_logo_2.svg/2048px-Unofficial_JavaScript_logo_2.svg.png',
        organizations: {
          connect: { id: orgs[0]?.id },
        },
        rating: 4.5,
      },
    }),
    prisma.course.create({
      data: {
        name: 'Advanced Node.js',
        description: 'Backend development with Node.js',
        thumbnailUrl: 'https://example.com/node-thumbnail.png',
        organizations: {
          connect: { id: orgs[1]?.id },
        },
        rating: 4.7,
      },
    }),
    prisma.course.create({
      data: {
        name: 'Python for Data Science',
        description: 'Learn Python and its applications in Data Science.',
        thumbnailUrl: 'https://example.com/python-thumbnail.png',
        organizations: {
          connect: { id: orgs[0]?.id },
        },
        rating: 4.8,
      },
    }),
  ]);

  await prisma.organization.update({
    where: { id: orgs[0]?.id },
    data: {
      coursesCount: 2,
    },
  });

  await prisma.organization.update({
    where: { id: orgs[1]?.id },
    data: {
      coursesCount: 1,
    },
  });

  return courses;
};
