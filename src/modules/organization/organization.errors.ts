export const OrganizationErrors = {
  ORGANIZATIONS_FETCH_FAILED: {
    STATUS: 400,
    MESSAGE: 'Failed to fetch organizations',
  },
  ORGANIZATION_NOT_FOUND: {
    STATUS: 404,
    MESSAGE: 'Organization not found',
  },
  ORGANIZATION_FETCH_FAILED: {
    STATUS: 400,
    MESSAGE: 'Failed to fetch organization',
  },
  ORGANIZATION_FETCH_FORBIDDEN: {
    STATUS: 403,
    MESSAGE: 'You do not have access to this organization',
  },
  ORGANIZATION_NAME_INVALID: {
    STATUS: 400,
    MESSAGE: 'Invalid organization name',
  },
  ORGANIZATIONS_NOT_FOUND: {
    STATUS: 404,
    MESSAGE: 'No organizations found',
  },
  ORGANIZATION_SEARCH_FAILED: {
    STATUS: 400,
    MESSAGE: 'Failed to search organizations',
  },
  ORGANIZATION_CREATE_FAILED: {
    STATUS: 400,
    MESSAGE: 'Failed to create organization',
  },
  ORGANIZATION_UPDATE_FAILED: {
    STATUS: 400,
    MESSAGE: 'Failed to update organization',
  },
  ORGANIZATION_DELETE_FAILED: {
    STATUS: 400,
    MESSAGE: 'Failed to delete organization',
  },
  ORGANIZATION_ADMIN_UPDATE_FAILED: {
    STATUS: 400,
    MESSAGE: 'Failed to update organization admin',
  },
  // Organization users related errors
  ORGANIZATION_USERS_FETCH_FAILED: {
    STATUS: 400,
    MESSAGE: 'Failed to fetch organization users',
  },
  ORGANIZATION_USERS_ADD_FAILED: {
    STATUS: 400,
    MESSAGE: 'Failed to add users to organization',
  },
  ORGANIZATION_USERS_REMOVE_FAILED: {
    STATUS: 400,
    MESSAGE: 'Failed to remove users from organization',
  },
  // Organization courses related errors
  ORGANIZATION_COURSES_FETCH_FAILED: {
    STATUS: 400,
    MESSAGE: 'Failed to fetch organization courses',
  },
  ORGANIZATION_COURSES_ADD_FAILED: {
    STATUS: 400,
    MESSAGE: 'Failed to add courses to organization',
  },
  ORGANIZATION_COURSES_REMOVE_FAILED: {
    STATUS: 400,
    MESSAGE: 'Failed to remove courses from organization',
  },
  ORGANIZATION_COURSE_ACCESS_FORBIDDEN: {
    STATUS: 403,
    MESSAGE: 'You do not have access to this course',
  },
};
