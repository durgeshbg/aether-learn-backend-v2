import { hash } from 'bcrypt-ts';
import { PrismaClient, Role, CodeSolutionStatus } from '../generated/prisma';

const JAVASCRIPT_NODE_18 = 93;

const prisma = new PrismaClient();

async function main() {
  await prisma.codeSolution.deleteMany({});
  await prisma.codeAssessment.deleteMany({});
  await prisma.course.deleteMany({});
  await prisma.lesson.deleteMany({});
  await prisma.module.deleteMany({});
  await prisma.organization.deleteMany({});
  await prisma.question.deleteMany({});
  await prisma.quiz.deleteMany({});
  await prisma.quizResult.deleteMany({});
  await prisma.testCase.deleteMany({});
  await prisma.user.deleteMany({});

  // Create Organizations
  const org1 = await prisma.organization.create({
    data: {
      name: 'CodeVerse Academy',
      description: 'Learn to code interactively',
      logoUrl: 'https://example.com/logo1.png',
      websiteUrl: 'https://codeverse.academy',
      email: 'contact@codeverse.academy',
      phone: '+911234567890',
      address: '123 Learning Lane, Mumbai',
    },
  });

  const org2 = await prisma.organization.create({
    data: {
      name: 'DevMasters',
      description: 'Master software skills',
      logoUrl: 'https://example.com/logo2.png',
      websiteUrl: 'https://devmasters.io',
      email: 'hello@devmasters.io',
      phone: '+919876543210',
      address: '456 Skill Street, Bangalore',
    },
  });

  // Create Users
  const hashedPassword = await hash('password', 10);
  const admin1 = await prisma.user.create({
    data: {
      email: 'admin1@mail.com',
      password: hashedPassword,
      firstName: 'Alice',
      lastName: 'Doe',
      role: Role.ADMIN,
    },
  });

  const org1admin = await prisma.user.create({
    data: {
      email: 'org1admin@mail.com',
      password: hashedPassword,
      firstName: 'Bob',
      lastName: 'Smith',
      role: Role.USER,
      orgAdminOf: { connect: { id: org1.id } },
      organizationId: org1.id,
    },
  });

  const org2admin = await prisma.user.create({
    data: {
      email: 'org2admin@mail.com',
      password: hashedPassword,
      firstName: 'Eve',
      lastName: 'Johnson',
      role: Role.USER,
      orgAdminOf: { connect: { id: org2.id } },
      organizationId: org2.id,
    },
  });

  const user1 = await prisma.user.create({
    data: {
      email: 'user1@mail.com',
      password: hashedPassword,
      firstName: 'Charlie',
      lastName: 'Brown',
      organization: { connect: { id: org1.id } },
    },
  });

  const user2 = await prisma.user.create({
    data: {
      email: 'user2@mail.com',
      password: hashedPassword,
      firstName: 'Diana',
      lastName: 'Prince',
      organization: { connect: { id: org1.id } },
    },
  });

  const user3 = await prisma.user.create({
    data: {
      email: 'user3@mail.com',
      password: hashedPassword,
      firstName: 'Evan',
      lastName: 'Lee',
      organization: { connect: { id: org2.id } },
    },
  });

  const user4 = await prisma.user.create({
    data: {
      email: 'user4@mail.com',
      password: hashedPassword,
      firstName: 'Grace',
      lastName: 'Kim',
      organization: { connect: { id: org2.id } },
    },
  });

  // Create Courses
  const course1 = await prisma.course.create({
    data: {
      name: 'JavaScript Basics',
      description: 'Introduction to JavaScript',
      thumbnailUrl: 'https://example.com/js-thumbnail.png',
      organizations: {
        connect: { id: org1.id },
      },
    },
  });

  const course2 = await prisma.course.create({
    data: {
      name: 'Advanced Node.js',
      description: 'Backend development with Node.js',
      thumbnailUrl: 'https://example.com/node-thumbnail.png',
      organizations: {
        connect: { id: org2.id },
      },
    },
  });

  // Lessons and Modules
  const lesson1 = await prisma.lesson.create({
    data: {
      title: 'Variables in JS',
      content: 'Understanding let, var, and const.',
      courseId: course1.id,
      modules: {
        create: [
          {
            title: 'Let vs Var',
            content: 'Difference in scope and hoisting.',
            code: 'let x = 10;',
            languageId: JAVASCRIPT_NODE_18,
          },
          {
            title: 'Const Basics',
            content: 'Const for constant values.',
            code: 'const PI = 3.14;',
            languageId: JAVASCRIPT_NODE_18,
          },
          {
            title: 'Variable Hoisting',
            content: 'How hoisting works in JavaScript.',
            code: 'console.log(a); var a = 5; // undefined',
            languageId: JAVASCRIPT_NODE_18,
          },
        ],
      },
    },
  });

  const lesson2 = await prisma.lesson.create({
    data: {
      title: 'Node Event Loop',
      content: 'How the event loop works.',
      courseId: course2.id,
      modules: {
        create: [
          {
            title: 'Async Callbacks',
            content: 'Using setTimeout and callbacks.',
            code: 'setTimeout(() => console.log("Hi"), 1000);',
            languageId: 2,
          },
          {
            title: 'Promises in Node',
            content: 'Understanding promises and async/await.',
            code: 'const fetchData = async () => { await new Promise(resolve => setTimeout(resolve, 1000)); return "Data"; };',
            languageId: 2,
          },
          {
            title: 'Event Emitter',
            content: 'Using Node.js EventEmitter.',
            code: 'const EventEmitter = require("events"); const emitter = new EventEmitter(); emitter.on("event", () => console.log("Event triggered")); emitter.emit("event");',
            languageId: 2,
          },
        ],
      },
    },
  });

  // Quizzes and Questions
  const quiz1 = await prisma.quiz.create({
    data: {
      title: 'JS Basics Quiz',
      courseId: course1.id,
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
  });

  const quiz2 = await prisma.quiz.create({
    data: {
      title: 'Node.js Fundamentals',
      courseId: course2.id,
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
            explanation:
              'The event loop allows Node.js to perform non-blocking I/O operations by offloading operations to the system kernel whenever possible.',
          },
          {
            text: 'Which module is used to create a web server in Node.js?',
            options: ['http', 'fs', 'path', 'url'],
            answer: 1,
            explanation: 'The http module provides utilities to create HTTP servers.',
          },
        ],
      },
    },
  });

  const quizResult1 = await prisma.quizResult.create({
    data: {
      userId: user1.id,
      quizId: quiz1.id,
      score: 85,
    },
  });

  const quizResult2 = await prisma.quizResult.create({
    data: {
      userId: user2.id,
      quizId: quiz2.id,
      score: 90,
    },
  });

  // Code Assessment
  const assessment1 = await prisma.codeAssessment.create({
    data: {
      title: 'FizzBuzz Challenge',
      description: 'Print numbers 1 to 100, with Fizz/Buzz/FizzBuzz',
      instructions:
        'Write a program that prints numbers from 1 to 100. For multiples of 3 print “Fizz”, for multiples of 5 “Buzz”, and for both “FizzBuzz”.',
      starterCode: 'function fizzBuzz() {\n  // your code\n}',
      languageId: 1,
      courseId: course1.id,
      testCases: {
        create: [
          {
            input: '3',
            expected: '1\n2\nFizz',
            description: 'Basic test for 3 values',
          },
          {
            input: '5',
            expected: '1\n2\nFizz\n4\nBuzz',
            description: 'Check for Buzz at 5',
          },
        ],
      },
    },
  });

  const assessment2 = await prisma.codeAssessment.create({
    data: {
      title: 'Palindrome Checker',
      description: 'Check if a string is a palindrome',
      instructions: 'Write a function that checks if a given string is a palindrome.',
      starterCode: 'function isPalindrome(str) {\n  // your code\n}',
      languageId: JAVASCRIPT_NODE_18,
      courseId: course2.id,
      testCases: {
        create: [
          {
            input: '"racecar"',
            expected: 'true',
            description: 'Check for racecar',
          },
          {
            input: '"hello"',
            expected: 'false',
            description: 'Check for non-palindrome hello',
          },
        ],
      },
    },
  });

  const codeSolution1 = await prisma.codeSolution.create({
    data: {
      code: 'function fizzBuzz() { for(let i=1;i<=100;i++){ let out=""; if(i%3==0)out+="Fizz"; if(i%5==0)out+="Buzz"; console.log(out||i); } }',
      userId: user1.id,
      assessmentId: assessment1.id,
      status: CodeSolutionStatus.SUBMITTED,
      score: 90,
    },
  });

  const codeSolution2 = await prisma.codeSolution.create({
    data: {
      code: 'function isPalindrome(str) { return str === str.split("").reverse().join(""); }',
      userId: user2.id,
      assessmentId: assessment2.id,
      status: CodeSolutionStatus.SUBMITTED,
      score: 95,
    },
  });
}

main()
  .then(() => {
    prisma.$disconnect();
    console.log('Seeding completed successfully.');
    process.exit(0);
  })
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
