import {
  DifficultyLevel,
  PrismaClient,
  type Course,
  type Question,
  type Quiz,
} from '../../generated/prisma';

export const seedQuizzesAndQuestions = async (
  prisma: PrismaClient,
  courses: Course[],
): Promise<{
  course1Quizzes: (Quiz & { questions: Question[] })[];
  course2Quizzes: (Quiz & { questions: Question[] })[];
  course3Quizzes: (Quiz & { questions: Question[] })[];
}> => {
  // Clean up existing data
  await prisma.quiz.deleteMany({});
  await prisma.question.deleteMany({});

  // Seed data
  // Course 1: Javbascript Basics
  const course1Quizzes = await Promise.all([
    prisma.quiz.create({
      data: {
        title: 'JS Basics Quiz',
        description: 'A quiz to test your knowledge of JavaScript basics.',
        difficulty: DifficultyLevel.BEGINNER,
        durationMinutes: 15,
        passPercentage: 65,
        courseId: courses[0]!.id,
        questions: {
          create: [
            {
              text: 'What is the output of `typeof null`?',
              options: ['null', 'object', 'undefined', 'number'],
              answer: 2,
              explanation: 'typeof null returns "object" due to historical reasons.',
            },
            {
              text: 'Which one is block scoped?',
              options: ['var', 'let', 'const', 'both let and const'],
              answer: 4,
              explanation: 'let and const are block scoped.',
            },
          ],
        },
      },
      include: { questions: true },
    }),
    prisma.quiz.create({
      data: {
        title: 'JS Functions Quiz',
        description: 'A quiz to test your knowledge of JavaScript functions.',
        difficulty: DifficultyLevel.BEGINNER,
        durationMinutes: 10,
        passPercentage: 70,
        courseId: courses[0]!.id,
        questions: {
          create: [
            {
              text: 'What is a closure in JavaScript?',
              options: [
                'A function that is immediately invoked',
                'A function that has access to its outer scope',
                'A function that returns another function',
                'A function that is defined inside another function',
              ],
              answer: 2,
              explanation:
                'A closure is a function that has access to its outer scope, even after the outer function has returned.',
            },
            {
              text: 'How do you create a function in JavaScript?',
              options: [
                'function myFunction() {}',
                'var myFunction = function() {}',
                'let myFunction = () => {}',
                'All of the above',
              ],
              answer: 4,
              explanation: 'All of the above are valid ways to create functions in JavaScript.',
            },
          ],
        },
      },
      include: { questions: true },
    }),
  ]);
  // Course 2: Advanced Node.js
  const course2Quizzes = await Promise.all([
    prisma.quiz.create({
      data: {
        title: 'Node.js Fundamentals',
        description: 'A quiz to test your knowledge of Node.js fundamentals.',
        difficulty: DifficultyLevel.INTERMEDIATE,
        durationMinutes: 20,
        passPercentage: 70,
        courseId: courses[1]!.id,
        questions: {
          create: [
            {
              text: 'What is the purpose of the event loop in Node.js?',
              options: [
                'To handle asynchronous operations',
                'To manage memory',
                'To execute synchronous code',
                'To handle file I/O',
              ],
              answer: 1,
              explanation: 'The event loop allows Node.js to perform non-blocking I/O operations.',
            },
            {
              text: 'Which module is used to create a web server in Node.js?',
              options: ['fs', 'http', 'path', 'url'],
              answer: 2,
              explanation: 'The http module provides utilities to create HTTP servers.',
            },
          ],
        },
      },
      include: { questions: true },
    }),
    prisma.quiz.create({
      data: {
        title: 'Node.js Advanced Concepts',
        description: 'A quiz to test your knowledge of advanced Node.js concepts.',
        difficulty: DifficultyLevel.ADVANCED,
        durationMinutes: 25,
        passPercentage: 75,
        courseId: courses[1]!.id,
        questions: {
          create: [
            {
              text: 'What is a stream in Node.js?',
              options: [
                'A sequence of data that can be read or written incrementally',
                'A way to handle asynchronous operations',
                'A method to manage memory',
                'A type of callback function',
              ],
              answer: 1,
              explanation:
                'A stream is a sequence of data that can be read or written incrementally.',
            },
            {
              text: 'How do you handle errors in asynchronous code in Node.js?',
              options: [
                'Using try-catch blocks',
                'Using error-first callbacks',
                'Using Promises with .catch()',
                'All of the above',
              ],
              answer: 4,
              explanation: 'All of the above are valid ways to handle errors in asynchronous code.',
            },
          ],
        },
      },
      include: { questions: true },
    }),
  ]);
  // Course 3: Python for Data Science
  const course3Quizzes = await Promise.all([
    prisma.quiz.create({
      data: {
        title: 'Python Basics Quiz',
        description: 'A quiz to test your knowledge of Python basics.',
        difficulty: DifficultyLevel.BEGINNER,
        durationMinutes: 15,
        passPercentage: 65,
        courseId: courses[2]!.id,
        questions: {
          create: [
            {
              text: 'What is the output of `print(type([]))` in Python?',
              options: ["<class 'list'>", "<class 'dict'>", "<class 'tuple'>", "<class 'set'>"],
              answer: 1,
              explanation: "The output is <class 'list'> because [] creates a list in Python.",
            },
            {
              text: 'Which keyword is used to define a function in Python?',
              options: ['func', 'def', 'function', 'lambda'],
              answer: 2,
              explanation: 'The def keyword is used to define a function in Python.',
            },
          ],
        },
      },
      include: { questions: true },
    }),
    prisma.quiz.create({
      data: {
        title: 'Python Data Science Quiz',
        description: 'A quiz to test your knowledge of Python for data science.',
        difficulty: DifficultyLevel.INTERMEDIATE,
        durationMinutes: 20,
        passPercentage: 70,
        courseId: courses[2]!.id,
        questions: {
          create: [
            {
              text: 'Which library is commonly used for data manipulation in Python?',
              options: ['NumPy', 'Pandas', 'Matplotlib', 'Seaborn'],
              answer: 2,
              explanation: 'Pandas is commonly used for data manipulation in Python.',
            },
            {
              text: 'What is the purpose of the `groupby` function in Pandas?',
              options: [
                'To aggregate data based on a key',
                'To filter data',
                'To merge two DataFrames',
                'To sort data',
              ],
              answer: 1,
              explanation: 'The groupby function is used to aggregate data based on a key.',
            },
          ],
        },
      },
      include: { questions: true },
    }),
  ]);

  await prisma.course.update({
    where: { id: courses[0]!.id },
    data: { quizzesCount: 2 },
  });
  await prisma.course.update({
    where: { id: courses[1]!.id },
    data: { quizzesCount: 2 },
  });
  await prisma.course.update({
    where: { id: courses[2]!.id },
    data: { quizzesCount: 2 },
  });

  return { course1Quizzes, course2Quizzes, course3Quizzes };
};
