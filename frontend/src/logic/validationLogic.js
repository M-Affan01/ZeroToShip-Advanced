/**
 * ValidationLogic - Internal Static
 * Pure functions for input/data validation (LST section 8).
 */

export const ValidationLogic = {
  validateSearchQuery(query) {
    const warnings = [];
    if (!query || query.trim().length === 0) warnings.push('Search query is empty');
    if (query.length > 100) warnings.push('Search query is very long (max 100 characters recommended)');
    if (/[^a-zA-Z0-9\s-]/.test(query)) warnings.push('Special characters may affect search results');
    return { isValid: true, errors: [], warnings };
  },

  validateChatInput(input) {
    const errors = [];
    const warnings = [];
    if (!input || input.trim().length === 0) errors.push('Message cannot be empty');
    if (input.length > 500) errors.push('Message is too long (max 500 characters)');
    if (input.split('\n').length > 10) warnings.push('Message contains multiple lines');
    return { isValid: errors.length === 0, errors, warnings };
  },
};
