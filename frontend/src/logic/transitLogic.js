/**
 * TransitLogic - Internal Static
 * Pure functions for transit data processing (LST section 3.3).
 */

const TYPE_ICONS = {
  bus: 'bus',
  train: 'train',
  shuttle: 'shuttle',
};

const CAPACITY_COLORS = {
  low: 'bg-green-100 text-green-800',
  medium: 'bg-yellow-100 text-yellow-800',
  high: 'bg-orange-100 text-orange-800',
  full: 'bg-red-100 text-red-800',
};

const CAPACITY_EMOJIS = {
  low: 'dot',
  medium: 'dot',
  high: 'dot',
  full: 'dot',
};

export const TransitLogic = {
  processTransit(lines) {
    const byType = lines.reduce((acc, line) => {
      if (!acc[line.type]) acc[line.type] = [];
      acc[line.type].push(line);
      return acc;
    }, {});

    const delayedLines = lines.filter((line) => line.delay > 0);
    const onTimeLines = lines.filter((line) => line.delay === 0);
    const averageDelay =
      lines.length > 0 ? Math.round((lines.reduce((s, l) => s + l.delay, 0) / lines.length) * 10) / 10 : 0;

    const capacitySummary = lines.reduce(
      (acc, line) => {
        acc[this.getCapacityLevel(line.capacity)] += 1;
        return acc;
      },
      { low: 0, medium: 0, high: 0, full: 0 }
    );

    const activeAlerts = lines
      .filter((line) => line.alerts && line.alerts.length > 0)
      .flatMap((line) => line.alerts || []);

    return { byType, delayedLines, onTimeLines, averageDelay, capacitySummary, activeAlerts };
  },

  getCapacityLevel(capacity) {
    if (capacity < 30) return 'low';
    if (capacity < 60) return 'medium';
    if (capacity < 85) return 'high';
    return 'full';
  },

  getCapacityColor(capacity) {
    return CAPACITY_COLORS[this.getCapacityLevel(capacity)] || 'bg-gray-100 text-gray-800';
  },

  getCapacityEmoji(capacity) {
    return CAPACITY_EMOJIS[this.getCapacityLevel(capacity)] || 'dot';
  },

  formatDelay(delay) {
    if (delay === 0) return 'On Time';
    if (delay < 5) return `${delay} min delay`;
    return `${delay} min delay`;
  },

  getDelayColor(delay) {
    if (delay === 0) return 'text-green-600';
    if (delay < 5) return 'text-yellow-600';
    if (delay < 10) return 'text-orange-600';
    return 'text-red-600';
  },

  calculateETA(nextArrival, delay) {
    const arrival = new Date(nextArrival);
    arrival.setMinutes(arrival.getMinutes() + delay);
    return arrival;
  },

  formatETA(eta) {
    const now = new Date();
    const diffMinutes = Math.round((eta.getTime() - now.getTime()) / 60000);
    if (diffMinutes <= 1) return 'Now';
    if (diffMinutes < 60) return `${diffMinutes}m`;
    const hours = Math.floor(diffMinutes / 60);
    const minutes = diffMinutes % 60;
    return `${hours}h ${minutes}m`;
  },

  getTransitIcon(type) {
    return TYPE_ICONS[type] || 'car';
  },
};
