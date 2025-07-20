export const UserErrors = {
  USER_NOT_FOUND: {
    STATUS: 404,
    MESSAGE: 'User not found.',
  },
  SERVER_ERROR: {
    STATUS: 500,
    MESSAGE: 'Internal server error: No users found.',
  },
  USER_EMAIL_EXISTS: {
    STATUS: 400,
    MESSAGE: 'User email already exists.',
  },
  USER_INVALID_CREDENTIALS: {
    STATUS: 401,
    MESSAGE: 'Invalid email or password.',
  },
  USER_UPDATE_FAILED: {
    STATUS: 400,
    MESSAGE: 'Failed to update user.',
  },
  USER_INVALID_ORGANIZATION: {
    STATUS: 400,
    MESSAGE: 'Invalid organization.',
  },
  USER_DELETE_FAILED: {
    STATUS: 400,
    MESSAGE: 'Failed to delete user.',
  },
  USER_OWN_ACCOUNT_DELETION: {
    STATUS: 403,
    MESSAGE: 'Cannot delete your own account.',
  },
  USER_FORBIDDEN: {
    STATUS: 403,
    MESSAGE: 'Forbidden access.',
  },
};
