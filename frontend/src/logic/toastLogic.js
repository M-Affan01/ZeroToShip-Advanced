/**
 * ToastLogic - Internal Static
 * Pure functions for toast notification management (FST section 3.3, LST section 6).
 */

const DEFAULT_DURATION = 4000;
const MAX_ACTIVE = 3;

const TOAST_COLORS = {
  success: 'bg-green-50 border-green-500 text-green-800 dark:bg-green-500/10 dark:text-green-300',
  error: 'bg-red-50 border-red-500 text-red-800 dark:bg-red-500/10 dark:text-red-300',
  warning: 'bg-yellow-50 border-yellow-500 text-yellow-800 dark:bg-yellow-500/10 dark:text-yellow-300',
  info: 'bg-blue-50 border-blue-500 text-blue-800 dark:bg-blue-500/10 dark:text-blue-300',
};

const TOAST_ICONS = {
  success: 'check-circle',
  error: 'x-circle',
  warning: 'alert-triangle',
  info: 'info',
};

export const ToastLogic = {
  DEFAULT_DURATION,
  MAX_ACTIVE,

  createToast(type, title, message, duration = DEFAULT_DURATION) {
    return {
      id: `toast-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      type,
      title,
      message,
      duration,
      timestamp: new Date().toISOString(),
    };
  },

  getToastColor(type) {
    return TOAST_COLORS[type] || 'bg-gray-50 border-gray-500 text-gray-800';
  },

  getToastIcon(type) {
    return TOAST_ICONS[type] || 'bell';
  },

  generateMockEvents(count = 5) {
    const events = [
      { type: 'success', title: 'Data Synced', message: 'All campus data has been updated successfully.' },
      { type: 'warning', title: 'Transit Delay', message: 'Green Line experiencing 5-minute delays.' },
      { type: 'info', title: 'New Menu Available', message: "Try today's Daily Special: Pasta Alfredo!" },
      { type: 'error', title: 'Connection Issue', message: 'Unable to reach equipment database.' },
      { type: 'success', title: 'Equipment Available', message: 'New laptops now available at Tech Hub.' },
      { type: 'warning', title: 'Cafe Closing Soon', message: 'Cafe closes in 1 hour.' },
      { type: 'info', title: 'Library Announcement', message: 'Extended hours during exam week.' },
      { type: 'error', title: 'Transit Disruption', message: 'Red Line service temporarily suspended.' },
    ];
    const shuffled = [...events].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, Math.min(count, shuffled.length));
  },

  calculateProgress(toast) {
    const elapsed = Date.now() - new Date(toast.timestamp).getTime();
    const duration = toast.duration || DEFAULT_DURATION;
    return Math.min(Math.round((elapsed / duration) * 100), 100);
  },

  isNearExpiration(toast, threshold = 80) {
    return this.calculateProgress(toast) > threshold;
  },
};
