/**
 * Format express-validator errors to match Laravel's validation error format
 * 
 * @param {Array} errors - Array of validation errors from express-validator
 * @returns {Object} - Formatted errors object matching Laravel format
 * 
 * Laravel format:
 * {
 *   errors: {
 *     fieldName: ["error message 1", "error message 2"]
 *   }
 * }
 */
export const formatValidationErrors = (errors) => {
  const formattedErrors = {};
  
  errors.forEach(error => {
    const field = error.path || error.param;
    
    if (!formattedErrors[field]) {
      formattedErrors[field] = [];
    }
    
    formattedErrors[field].push(error.msg);
  });
  
  return formattedErrors;
};

/**
 * Create a Laravel-style error response
 * 
 * @param {string} field - The field name
 * @param {string} message - The error message
 * @returns {Object} - Formatted error object
 */
export const createFieldError = (field, message) => {
  return {
    errors: {
      [field]: [message]
    }
  };
};

/**
 * Log validation errors for debugging
 * 
 * @param {Array} errors - Array of validation errors
 * @param {Object} req - Express request object
 */
export const logValidationErrors = (errors, req) => {
  console.log('❌ Validation errors:', {
    path: req.path,
    method: req.method,
    errors: errors.map(e => ({
      field: e.path || e.param,
      message: e.msg,
      value: e.value
    }))
  });
};

export default {
  formatValidationErrors,
  createFieldError,
  logValidationErrors
};
