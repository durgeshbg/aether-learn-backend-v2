import { PrismaClient, type Organization } from '../../generated/prisma';

export const seedOrganizations = async (prisma: PrismaClient): Promise<Organization[]> => {
  // Clean up existing data
  await prisma.organization.deleteMany({});

  // Seed data
  const organizations = await Promise.all([
    prisma.organization.create({
      data: {
        name: 'Google Academy',
        description: 'A place for learning and innovation.',
        logoUrl:
          'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c1/Google_%22G%22_logo.svg/2048px-Google_%22G%22_logo.svg.png',
        websiteUrl: 'https://www.google.com/academy',
        address: '1600 Amphitheatre Parkway, Mountain View, CA 94043',
        phone: '+1 650-253-0000',
        email: 'google@mail.com',
      },
    }),
    prisma.organization.create({
      data: {
        name: 'Microsoft Learn',
        description: 'Empowering every person and organization on the planet to achieve more.',
        logoUrl:
          'https://upload.wikimedia.org/wikipedia/commons/thumb/4/44/Microsoft_logo.svg/2048px-Microsoft_logo.svg.png',
        websiteUrl: 'https://www.microsoft.com/learn',
        address: 'One Microsoft Way, Redmond, WA 98052',
        phone: '+91 800-425-1234',
        email: 'microsoft@mail.com',
      },
    }),
  ]);

  return organizations;
};
