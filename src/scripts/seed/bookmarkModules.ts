import {
  PrismaClient,
  type BookmarkModule,
  type Lesson,
  type Module,
  type User,
} from '../../generated/prisma';

export const seedBookmarkModules = async (
  prisma: PrismaClient,
  org1users: User[],
  org2users: User[],
  course1Lessons: (Lesson & { modules: Module[] })[],
  course2Lessons: (Lesson & { modules: Module[] })[],
  course3Lessons: (Lesson & { modules: Module[] })[],
): Promise<BookmarkModule[]> => {
  // Clean up existing data
  await prisma.bookmarkModule.deleteMany({});

  // Seed Data
  const bookmarkModulesData: { userId: string; moduleId: string }[] = [];

  org1users.forEach((user) => {
    [...course1Lessons, ...course3Lessons].forEach((lesson) => {
      lesson.modules.forEach((module, index) => {
        // Bookmark first and last module of each lesson
        if (index === 0 || index === lesson.modules.length - 1) {
          bookmarkModulesData.push({
            userId: user.id,
            moduleId: module.id,
          });
        }
      });
    });
  });

  org2users.forEach((user) => {
    course2Lessons.forEach((lesson) => {
      lesson.modules.forEach((module, index) => {
        // Bookmark first and last module of each lesson
        if (index === 0 || index === lesson.modules.length - 1) {
          bookmarkModulesData.push({
            userId: user.id,
            moduleId: module.id,
          });
        }
      });
    });
  });

  const bookmarkModules = await Promise.all(
    bookmarkModulesData.map((data) =>
      prisma.bookmarkModule.create({
        data,
      }),
    ),
  );

  return bookmarkModules;
};
