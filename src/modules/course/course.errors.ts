export const CourseErrors = {
  COURSE_NOT_FOUND: {
    STATUS: 404,
    MESSAGE: 'Course not found',
  },
  COURSES_FETCH_FAILED: {
    STATUS: 500,
    MESSAGE: 'Failed to fetch courses',
  },
  COURSE_FETCH_FAILED: {
    STATUS: 500,
    MESSAGE: 'Failed to fetch course',
  },
  COURSE_CREATE_FAILED: {
    STATUS: 500,
    MESSAGE: 'Failed to create course',
  },
  COURSE_UPDATE_FAILED: {
    STATUS: 500,
    MESSAGE: 'Failed to update course',
  },
  COURSE_DELETE_FAILED: {
    STATUS: 500,
    MESSAGE: 'Failed to delete course',
  },
  COURSE_FEEDBACK_SUBMITTED_ALREADY: {
    STATUS: 400,
    MESSAGE: 'Course feedback already submitted by the user',
  },
  COUERSE_FEEDBACK_SUBMISSION_FAILED: {
    STATUS: 500,
    MESSAGE: 'Failed to submit course feedback',
  },
};
