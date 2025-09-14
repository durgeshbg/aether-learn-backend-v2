import {
  DifficultyLevel,
  PrismaClient,
  type Course,
  type Lesson,
  type Module,
  type User,
} from '../../generated/prisma';
import { LANG_KEYS, LANGUAGES_MAP } from '../../laguages';

export const seedLessonsModules = async (
  prisma: PrismaClient,
  org1Users: User[],
  org2Users: User[],
  courses: Course[],
): Promise<{
  course1Lessons: (Lesson & { modules: Module[] })[];
  course2Lessons: (Lesson & { modules: Module[] })[];
  course3Lessons: (Lesson & { modules: Module[] })[];
}> => {
  /// Clean up existing data
  await prisma.lesson.deleteMany({});
  await prisma.module.deleteMany({});

  // Seed data
  // Course 1: JavaScript Basics
  const course1Lessons = await Promise.all([
    prisma.lesson.create({
      data: {
        title: 'Variables in JS',
        content: 'Understanding let, var, and const.',
        difficulty: DifficultyLevel.BEGINNER,
        objectives: [
          'Understand the differences between let, var, and const',
          'Learn about variable scope and hoisting',
          'Write basic variable declarations in JavaScript',
        ],
        courseId: courses[0]!.id!,
        modules: {
          create: [
            {
              title: 'Let vs Var',
              content: 'Difference in scope and hoisting.',
              code: 'let x = 10;',
              difficulty: DifficultyLevel.BEGINNER,
              objectives: [
                'Understand block scope with let',
                'Learn function scope with var',
                'Identify hoisting behavior of var',
              ],
              languageId: LANGUAGES_MAP[LANG_KEYS.JAVASCRIPT_NODE_18!]!.id,
            },
            {
              title: 'Const Basics',
              content: 'Const for constant values.',
              code: 'const PI = 3.14;',
              difficulty: DifficultyLevel.BEGINNER,
              objectives: [
                'Understand immutability with const',
                'Learn when to use const vs let',
                'Write variable declarations using const',
              ],
              languageId: LANGUAGES_MAP[LANG_KEYS.JAVASCRIPT_NODE_18!]!.id,
            },
            {
              title: 'Variable Hoisting',
              content: 'How hoisting works in JavaScript.',
              code: 'console.log(a); var a = 5; // undefined',
              difficulty: DifficultyLevel.INTERMEDIATE,
              objectives: [
                'Explain the concept of hoisting',
                'Demonstrate hoisting with var declarations',
                'Understand temporal dead zone with let and const',
              ],
              languageId: LANGUAGES_MAP[LANG_KEYS.JAVASCRIPT_NODE_18!]!.id,
            },
          ],
        },
      },
      include: { modules: true },
    }),
    prisma.lesson.create({
      data: {
        title: 'Asynchronous JS',
        content: 'Callbacks, Promises, and Async/Await.',
        difficulty: DifficultyLevel.INTERMEDIATE,
        objectives: [
          'Understand asynchronous programming in JavaScript',
          'Learn how to use callbacks effectively',
          'Work with Promises and async/await syntax',
        ],
        courseId: courses[0]!.id!,
        modules: {
          create: [
            {
              title: 'Callbacks',
              content: 'Using callbacks for async operations.',
              code: `function fetchData(callback) {
                      setTimeout(() => {
                          callback('Data loaded');
                        }, 1000);
                      }`,
              difficulty: DifficultyLevel.BEGINNER,
              objectives: [
                'Understand the callback pattern',
                'Handle asynchronous operations with callbacks',
                'Identify callback hell and its issues',
              ],
              languageId: LANGUAGES_MAP[LANG_KEYS.JAVASCRIPT_NODE_18!]!.id,
            },
            {
              title: 'Promises',
              content: 'Introduction to Promises.',
              code: `const fetchData = new Promise((resolve, reject) => {
                      setTimeout(() => {
                        resolve('Data loaded');
                      }, 1000);
                     });`,
              difficulty: DifficultyLevel.INTERMEDIATE,
              objectives: [
                'Understand the Promise object',
                'Learn to create and consume Promises',
                'Handle errors with .catch()',
              ],
              languageId: LANGUAGES_MAP[LANG_KEYS.JAVASCRIPT_NODE_18!]!.id,
            },
            {
              title: 'Async/Await',
              content: 'Modern async syntax.',
              code: `async function fetchData() {
                        const data = await new Promise((resolve) => { setTimeout(() => resolve('Data loaded'), 1000); });
                        console.log(data);
                      }`,
              difficulty: DifficultyLevel.INTERMEDIATE,
              objectives: [
                'Understand async functions',
                'Use await to handle Promises',
                'Write cleaner asynchronous code',
              ],
              languageId: LANGUAGES_MAP[LANG_KEYS.JAVASCRIPT_NODE_18!]!.id,
            },
          ],
        },
      },
      include: { modules: true },
    }),
  ]);
  // Course 2: Advanced Node.js
  const course2Lessons = await Promise.all([
    prisma.lesson.create({
      data: {
        title: 'Node.js Express Basics',
        content: 'Building web servers with Express.',
        difficulty: DifficultyLevel.BEGINNER,
        objectives: [
          'Understand the basics of Express.js',
          'Set up a simple web server',
          'Handle routing and middleware in Express',
        ],
        courseId: courses[1]!.id!,
        modules: {
          create: [
            {
              title: 'Setting up Express',
              content: 'Installing and configuring Express.',
              code: `const express = require('express');
                      const app = express();
                      app.listen(3000, () => console.log('Server running on port 3000'));`,
              difficulty: DifficultyLevel.BEGINNER,
              objectives: [
                'Install Express.js',
                'Set up a basic Express server',
                'Understand the request-response cycle',
              ],
              languageId: LANGUAGES_MAP[LANG_KEYS.JAVASCRIPT_NODE_18!]!.id,
            },
            {
              title: 'Routing in Express',
              content: 'Defining routes and handling requests.',
              code: `app.get('/', (req, res) => {
                        res.send('Hello World');
                      });`,
              difficulty: DifficultyLevel.BEGINNER,
              objectives: [
                'Define routes using app.get, app.post, etc.',
                'Handle query parameters and route parameters',
                'Send responses to the client',
              ],
              languageId: LANGUAGES_MAP[LANG_KEYS.JAVASCRIPT_NODE_18!]!.id,
            },
            {
              title: 'Middleware in Express',
              content: 'Using middleware functions.',
              code: `app.use((req, res, next) => {
                        console.log('Request URL:', req.url);
                        next();
                      });`,
              difficulty: DifficultyLevel.INTERMEDIATE,
              objectives: [
                'Understand the concept of middleware',
                'Create custom middleware functions',
                'Use third-party middleware in Express',
              ],
              languageId: LANGUAGES_MAP[LANG_KEYS.JAVASCRIPT_NODE_18!]!.id,
            },
          ],
        },
      },
      include: { modules: true },
    }),
    prisma.lesson.create({
      data: {
        title: 'Working with Databases in Node.js',
        content: 'Connecting to MongoDB and performing CRUD operations.',
        difficulty: DifficultyLevel.INTERMEDIATE,
        objectives: [
          'Set up a MongoDB database',
          'Connect to MongoDB using Mongoose',
          'Perform CRUD operations on the database',
        ],
        courseId: courses[1]!.id!,
        modules: {
          create: [
            {
              title: 'Setting up MongoDB',
              content: 'Installing and configuring MongoDB.',
              code: `// No direct code, but instructions to install MongoDB and start the server`,
              difficulty: DifficultyLevel.BEGINNER,
              objectives: [
                'Install MongoDB on your machine',
                'Start and stop the MongoDB server',
                'Understand basic MongoDB concepts',
              ],
              languageId: LANGUAGES_MAP[LANG_KEYS.JAVASCRIPT_NODE_18!]!.id,
            },
            {
              title: 'Connecting with Mongoose',
              content: 'Using Mongoose to connect to MongoDB.',
              code: `const mongoose = require('mongoose');
                      mongoose.connect('mongodb://localhost/mydatabase', { useNewUrlParser: true, useUnifiedTopology: true });`,
              difficulty: DifficultyLevel.INTERMEDIATE,
              objectives: [
                'Install and set up Mongoose',
                'Connect to a MongoDB database',
                'Handle connection events and errors',
              ],
              languageId: LANGUAGES_MAP[LANG_KEYS.JAVASCRIPT_NODE_18!]!.id,
            },
            {
              title: 'CRUD Operations',
              content: 'Create, Read, Update, Delete documents.',
              code: `const User = mongoose.model('User', { name: String, age: Number });
                      const newUser = new User({ name: 'Alice', age: 25 });
                      newUser.save().then(() => console.log('User saved'));`,
              difficulty: DifficultyLevel.INTERMEDIATE,
              objectives: [
                'Define Mongoose schemas and models',
                'Perform create, read, update, and delete operations',
                'Use Mongoose queries to interact with the database',
              ],
              languageId: LANGUAGES_MAP[LANG_KEYS.JAVASCRIPT_NODE_18!]!.id,
            },
          ],
        },
      },
      include: { modules: true },
    }),
  ]);
  // Course 3: Python for Data Science
  const course3Lessons = await Promise.all([
    prisma.lesson.create({
      data: {
        title: 'Python Data Structures',
        content: 'Lists, Tuples, and Dictionaries.',
        difficulty: DifficultyLevel.BEGINNER,
        objectives: [
          'Understand basic data structures in Python',
          'Learn how to use lists, tuples, and dictionaries',
          'Perform common operations on these data structures',
        ],
        courseId: courses[2]!.id!,
        modules: {
          create: [
            {
              title: 'Lists in Python',
              content: 'Creating and manipulating lists.',
              code: `my_list = [1, 2, 3]
                      my_list.append(4)
                      print(my_list)  # Output: [1, 2, 3, 4]`,
              difficulty: DifficultyLevel.BEGINNER,
              objectives: [
                'Create lists in Python',
                'Perform common list operations (append, remove, etc.)',
                'Understand list indexing and slicing',
              ],
              languageId: LANGUAGES_MAP[LANG_KEYS.PYTHON_3_8!]!.id,
            },
            {
              title: 'Tuples in Python',
              content: 'Immutable sequences.',
              code: `my_tuple = (1, 2, 3)
                      print(my_tuple[0])  # Output: 1`,
              difficulty: DifficultyLevel.BEGINNER,
              objectives: [
                'Create tuples in Python',
                'Understand immutability of tuples',
                'Access tuple elements using indexing',
              ],
              languageId: LANGUAGES_MAP[LANG_KEYS.PYTHON_3_8!]!.id,
            },
            {
              title: 'Dictionaries in Python',
              content: 'Key-value pairs.',
              code: `my_dict = {'name': 'Alice', 'age': 25}
                      print(my_dict['name'])  # Output: Alice`,
              difficulty: DifficultyLevel.INTERMEDIATE,
              objectives: [
                'Create dictionaries in Python',
                'Access and modify dictionary values',
                'Understand dictionary methods and operations',
              ],
              languageId: LANGUAGES_MAP[LANG_KEYS.PYTHON_3_8!]!.id,
            },
          ],
        },
      },
      include: { modules: true },
    }),
    prisma.lesson.create({
      data: {
        title: 'Data Analysis with Pandas',
        content: 'Using Pandas for data manipulation and analysis.',
        difficulty: DifficultyLevel.INTERMEDIATE,
        objectives: [
          'Understand the basics of the Pandas library',
          'Load and manipulate datasets using Pandas',
          'Perform basic data analysis tasks',
        ],
        courseId: courses[2]!.id!,
        modules: {
          create: [
            {
              title: 'Introduction to Pandas',
              content: 'Installing and setting up Pandas.',
              code: `import pandas as pd
                      df = pd.DataFrame({'A': [1, 2], 'B': [3, 4]})
                      print(df)`,
              difficulty: DifficultyLevel.BEGINNER,
              objectives: [
                'Install the Pandas library',
                'Create basic DataFrames',
                'Understand the structure of DataFrames',
              ],
              languageId: LANGUAGES_MAP[LANG_KEYS.PYTHON_3_8!]!.id,
            },
            {
              title: 'Data Manipulation with Pandas',
              content: 'Filtering, sorting, and grouping data.',
              code: `df = pd.DataFrame({'A': [1, 2, 3], 'B': [4, 5, 6]})
                      filtered_df = df[df['A'] > 1]
                      print(filtered_df)`,
              difficulty: DifficultyLevel.INTERMEDIATE,
              objectives: [
                'Filter DataFrames based on conditions',
                'Sort DataFrame values',
                'Group data and perform aggregations',
              ],
              languageId: LANGUAGES_MAP[LANG_KEYS.PYTHON_3_8!]!.id,
            },
            {
              title: 'Basic Data Analysis',
              content: 'Descriptive statistics and data visualization.',
              code: `print(df.describe())
                      df.plot(kind='bar')`,
              difficulty: DifficultyLevel.INTERMEDIATE,
              objectives: [
                'Generate descriptive statistics of datasets',
                'Visualize data using basic plots',
                'Interpret analysis results',
              ],
              languageId: LANGUAGES_MAP[LANG_KEYS.PYTHON_3_8!]!.id,
            },
          ],
        },
      },
      include: { modules: true },
    }),
  ]);
  // Org1 User 1 enrolled in Course 1
  await prisma.enrolledCourseProgress.update({
    where: {
      userId_courseId: {
        userId: org1Users[0]!.id,
        courseId: courses[0]!.id,
      },
    },
    data: {
      completedModules: {
        connect: [
          { id: course1Lessons[0]!.modules[0]!.id! },
          { id: course1Lessons[0]!.modules[1]!.id! },
          { id: course1Lessons[0]!.modules[2]!.id! },
          { id: course1Lessons[1]!.modules[0]!.id! },
        ],
      },
      nextModuleId: course1Lessons[1]!.modules[1]!.id!,
    },
  });
  // Org1 User 2 enrolled in Course 1 and 3
  await prisma.enrolledCourseProgress.update({
    where: {
      userId_courseId: {
        userId: org1Users[1]!.id,
        courseId: courses[0]!.id,
      },
    },
    data: {
      completedModules: {
        connect: [
          { id: course1Lessons[0]!.modules[0]!.id! },
          { id: course1Lessons[0]!.modules[1]!.id! },
          { id: course1Lessons[0]!.modules[2]!.id! },
          { id: course1Lessons[1]!.modules[0]!.id! },
          { id: course1Lessons[1]!.modules[1]!.id! },
        ],
      },
      nextModuleId: course1Lessons[1]!.modules[2]!.id!,
    },
  });
  await prisma.enrolledCourseProgress.update({
    where: {
      userId_courseId: {
        userId: org1Users[1]!.id,
        courseId: courses[2]!.id,
      },
    },
    data: {
      completedModules: {
        connect: [
          { id: course3Lessons[0]!.modules[0]!.id! },
          { id: course3Lessons[0]!.modules[1]!.id! },
          { id: course3Lessons[1]!.modules[0]!.id! },
        ],
      },
      nextModuleId: course3Lessons[1]!.modules[1]!.id!,
    },
  });
  // Org2 User 1 enrolled in Course 2
  await prisma.enrolledCourseProgress.update({
    where: {
      userId_courseId: {
        userId: org2Users[0]!.id,
        courseId: courses[1]!.id,
      },
    },
    data: {
      completedModules: {
        connect: [
          { id: course2Lessons[0]!.modules[0]!.id! },
          { id: course2Lessons[0]!.modules[1]!.id! },
          { id: course2Lessons[0]!.modules[2]!.id! },
          { id: course2Lessons[1]!.modules[0]!.id! },
        ],
      },
      nextModuleId: course2Lessons[1]!.modules[1]!.id!,
    },
  });

  await prisma.course.update({
    where: { id: courses[0]!.id! },
    data: {
      lessonsCount: 2,
      modulesCount: 6,
    },
  });
  await prisma.course.update({
    where: { id: courses[1]!.id! },
    data: {
      lessonsCount: 2,
      modulesCount: 6,
    },
  });
  await prisma.course.update({
    where: { id: courses[2]!.id! },
    data: {
      lessonsCount: 2,
      modulesCount: 6,
    },
  });

  return {
    course1Lessons,
    course2Lessons,
    course3Lessons,
  };
};
