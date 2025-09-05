import {
  DifficultyLevel,
  PrismaClient,
  type Course,
  type CodeAssessment,
} from '../../generated/prisma';
import { LANG_KEYS, LANGUAGES_MAP } from '../../laguages';

export const seedCodeAssessmentsAndTestCases = async (
  prisma: PrismaClient,
  courses: Course[],
): Promise<{
  course1CodeAssessments: CodeAssessment[];
  course2CodeAssessments: CodeAssessment[];
  course3CodeAssessments: CodeAssessment[];
}> => {
  // Clean up existing data
  await prisma.codeAssessment.deleteMany({});
  await prisma.testCase.deleteMany({});

  // Seed Data
  // Course 1: JavaScript Basics
  const course1CodeAssessments = await Promise.all([
    prisma.codeAssessment.create({
      data: {
        title: 'FizzBuzz Challenge',
        description: 'Print numbers 1 to 100, with Fizz/Buzz/FizzBuzz',
        instructions:
          'Write a program that prints numbers from 1 to 100. For multiples of 3 print “Fizz”, for multiples of 5 “Buzz”, and for both “FizzBuzz”.',
        starterCode: 'function fizzBuzz() {\n  // your code\n}',
        languageId: LANGUAGES_MAP[LANG_KEYS.JAVASCRIPT_NODE_18]!.id,
        difficulty: DifficultyLevel.BEGINNER,
        durationMinutes: 30,
        courseId: courses[0]!.id,
        testCases: {
          create: [
            {
              input: '3',
              expected: '1\n2\nFizz',
              description: 'Basic test for 3 values',
              weight: 1,
            },
            {
              input: '5',
              expected: '1\n2\nFizz\n4\nBuzz',
              description: 'Basic test for 5 values',
              weight: 1,
            },
            {
              input: '15',
              expected: '1\n2\nFizz\n4\nBuzz\nFizz\n7\n8\nFizz\nBuzz\n11\nFizz\n13\n14\nFizzBuzz',
              description: 'Comprehensive test for 15 values',
              weight: 2,
            },
          ],
        },
      },
      include: { testCases: true },
    }),
    prisma.codeAssessment.create({
      data: {
        title: 'Array Sum',
        description: 'Calculate the sum of an array of numbers',
        instructions: 'Write a function that takes an array of numbers and returns their sum.',
        starterCode: 'function arraySum(arr) {\n  // your code\n}',
        languageId: LANGUAGES_MAP[LANG_KEYS.JAVASCRIPT_NODE_18]!.id,
        difficulty: DifficultyLevel.BEGINNER,
        durationMinutes: 20,
        courseId: courses[0]!.id,
        testCases: {
          create: [
            {
              input: '[1, 2, 3]',
              expected: '6',
              description: 'Sum of first three natural numbers',
              weight: 1,
            },
            {
              input: '[-1, 1, 0]',
              expected: '0',
              description: 'Sum with negative and positive numbers',
              weight: 1,
            },
            {
              input: '[10, 20, 30, 40]',
              expected: '100',
              description: 'Sum of larger numbers',
              weight: 2,
            },
          ],
        },
      },
      include: { testCases: true },
    }),
  ]);
  // Course 2: Advanced Node.js
  const course2CodeAssessments = await Promise.all([
    prisma.codeAssessment.create({
      data: {
        title: 'Palindrome Checker',
        description: 'Check if a string is a palindrome',
        instructions: 'Write a function that checks if a given string is a palindrome.',
        starterCode: 'function isPalindrome(str) {\n  // your code\n}',
        languageId: LANGUAGES_MAP[LANG_KEYS.JAVASCRIPT_NODE_18]!.id,
        difficulty: DifficultyLevel.INTERMEDIATE,
        durationMinutes: 30,
        courseId: courses[1]!.id,
        testCases: {
          create: [
            {
              input: '"racecar"',
              expected: 'true',
              description: 'Check for racecar',
              weight: 1,
            },
            {
              input: '"hello"',
              expected: 'false',
              description: 'Check for non-palindrome hello',
              weight: 1,
            },
            {
              input: '"Madam"',
              expected: 'true',
              description: 'Check for palindrome with mixed case',
              weight: 2,
            },
          ],
        },
      },
      include: { testCases: true },
    }),
    prisma.codeAssessment.create({
      data: {
        title: 'Fibonacci Sequence',
        description: 'Generate Fibonacci sequence up to n terms',
        instructions: 'Write a function that returns the Fibonacci sequence up to n terms.',
        starterCode: 'function fibonacci(n) {\n  // your code\n}',
        languageId: LANGUAGES_MAP[LANG_KEYS.JAVASCRIPT_NODE_18]!.id,
        difficulty: DifficultyLevel.INTERMEDIATE,
        durationMinutes: 25,
        courseId: courses[1]!.id,
        testCases: {
          create: [
            {
              input: '5',
              expected: '0,1,1,2,3',
              description: 'Fibonacci sequence for 5 terms',
              weight: 1,
            },
            {
              input: '10',
              expected: '0,1,1,2,3,5,8,13,21,34',
              description: 'Fibonacci sequence for 10 terms',
              weight: 2,
            },
            {
              input: '1',
              expected: '0',
              description: 'Fibonacci sequence for 1 term',
              weight: 1,
            },
          ],
        },
      },
      include: { testCases: true },
    }),
  ]);
  // Course 3: Python for Data Science
  const course3CodeAssessments = await Promise.all([
    prisma.codeAssessment.create({
      data: {
        title: 'Prime Number Checker',
        description: 'Check if a number is prime',
        instructions: 'Write a function that checks if a given number is prime.',
        starterCode: 'def is_prime(n):\n    # your code',
        languageId: LANGUAGES_MAP[LANG_KEYS.PYTHON_3_8]!.id,
        difficulty: DifficultyLevel.BEGINNER,
        durationMinutes: 20,
        courseId: courses[2]!.id,
        testCases: {
          create: [
            {
              input: '7',
              expected: 'True',
              description: 'Check for prime number 7',
              weight: 1,
            },
            {
              input: '10',
              expected: 'False',
              description: 'Check for non-prime number 10',
              weight: 1,
            },
            {
              input: '13',
              expected: 'True',
              description: 'Check for prime number 13',
              weight: 2,
            },
          ],
        },
      },
      include: { testCases: true },
    }),
    prisma.codeAssessment.create({
      data: {
        title: 'Factorial Calculation',
        description: 'Calculate the factorial of a number',
        instructions: 'Write a function that returns the factorial of a given number.',
        starterCode: 'def factorial(n):\n    # your code',
        languageId: LANGUAGES_MAP[LANG_KEYS.PYTHON_3_8]!.id,
        difficulty: DifficultyLevel.BEGINNER,
        durationMinutes: 20,
        courseId: courses[2]!.id,
        testCases: {
          create: [
            {
              input: '5',
              expected: '120',
              description: 'Factorial of 5',
              weight: 1,
            },
            {
              input: '0',
              expected: '1',
              description: 'Factorial of 0',
              weight: 1,
            },
            {
              input: '7',
              expected: '5040',
              description: 'Factorial of 7',
              weight: 2,
            },
          ],
        },
      },
      include: { testCases: true },
    }),
  ]);

  await prisma.course.update({
    where: { id: courses[0]!.id },
    data: { codeAssessmentsCount: 2 },
  });
  await prisma.course.update({
    where: { id: courses[1]!.id },
    data: { codeAssessmentsCount: 2 },
  });
  await prisma.course.update({
    where: { id: courses[2]!.id },
    data: { codeAssessmentsCount: 2 },
  });

  return {
    course1CodeAssessments,
    course2CodeAssessments,
    course3CodeAssessments,
  };
};
