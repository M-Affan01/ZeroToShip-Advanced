/**
 * FormattingLogic - Internal Static
 * Pure functions for display formatting (LST section 7.2).
 */

export const FormattingLogic = {
  formatDate(date, format = 'full') {
    const d = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(d.getTime())) return 'Invalid Date';
    switch (format) {
      case 'full':
        return d.toLocaleString('en-US', {
          weekday: 'short',
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        });
      case 'short':
        return d.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
      case 'time':
        return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
      case 'relative':
        return this.getRelativeTime(d);
      default:
        return d.toString();
    }
  },

  getRelativeTime(date) {
    const now = new Date();
    const diffSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    if (diffSeconds < 60) return 'Just now';
    if (diffSeconds < 120) return '1 minute ago';
    if (diffSeconds < 3600) return `${Math.floor(diffSeconds / 60)} minutes ago`;
    if (diffSeconds < 7200) return '1 hour ago';
    if (diffSeconds < 86400) return `${Math.floor(diffSeconds / 3600)} hours ago`;
    if (diffSeconds < 172800) return 'Yesterday';
    if (diffSeconds < 604800) return `${Math.floor(diffSeconds / 86400)} days ago`;
    if (diffSeconds < 1209600) return 'Last week';
    if (diffSeconds < 2592000) return `${Math.floor(diffSeconds / 604800)} weeks ago`;
    return this.formatDate(date, 'short');
  },

  truncateText(text, maxLength = 100, suffix = '...') {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength - suffix.length) + suffix;
  },

  capitalizeWords(text) {
    return text.replace(/\b\w/g, (char) => char.toUpperCase());
  },

  formatLocation(location) {
    return location.split('-').map((part) => part.trim()).join(' • ');
  },

  formatEquipmentCategory(category) {
    const formatted = {
      laptop: 'Laptop',
      projector: 'Projector',
      audio: 'Audio',
      camera: 'Camera',
      other: 'Other',
    };
    return formatted[category] || category;
  },

  formatCafeCategory(category) {
    const formatted = {
      breakfast: 'Breakfast',
      lunch: 'Lunch',
      beverage: 'Beverage',
      snack: 'Snack',
      special: 'Special',
    };
    return formatted[category] || category;
  },

  formatTransitType(type) {
    const formatted = { bus: 'Bus', train: 'Train', shuttle: 'Shuttle' };
    return formatted[type] || type;
  },

  formatNumber(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  },

  formatPercentage(value, decimals = 0) {
    return `${(value * 100).toFixed(decimals)}%`;
  },

  getInitials(name) {
    const words = name.split(' ');
    if (words.length === 1) return words[0].substring(0, 2).toUpperCase();
    return (words[0][0] + words[1][0]).toUpperCase();
  },
};
