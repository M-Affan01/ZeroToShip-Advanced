/**
 * StatusLogic - Internal Static
 * Pure functions for status management (LST section 7.1).
 */

import { TransitLogic } from './transitLogic.js';

const EQUIPMENT_STATUS = {
  available: { label: 'Available', color: 'bg-green-100 text-green-800 border-green-500', icon: 'check-circle', priority: 1 },
  'in-use': { label: 'In Use', color: 'bg-blue-100 text-blue-800 border-blue-500', icon: 'refresh', priority: 2 },
  maintenance: { label: 'Maintenance', color: 'bg-yellow-100 text-yellow-800 border-yellow-500', icon: 'wrench', priority: 3 },
  reserved: { label: 'Reserved', color: 'bg-purple-100 text-purple-800 border-purple-500', icon: 'pin', priority: 4 },
};

const CAPACITY_STATUS = {
  low: { label: 'Low Capacity', color: 'bg-green-100 text-green-800', icon: 'dot', priority: 1, level: 'low' },
  medium: { label: 'Medium Capacity', color: 'bg-yellow-100 text-yellow-800', icon: 'dot', priority: 2, level: 'medium' },
  high: { label: 'High Capacity', color: 'bg-orange-100 text-orange-800', icon: 'dot', priority: 3, level: 'high' },
  full: { label: 'Full Capacity', color: 'bg-red-100 text-red-800', icon: 'dot', priority: 4, level: 'full' },
};

export const StatusLogic = {
  getEquipmentStatusInfo(status) {
    return EQUIPMENT_STATUS[status] || { label: 'Unknown', color: 'bg-gray-100 text-gray-800 border-gray-500', icon: 'help', priority: 5 };
  },

  getCapacityStatusInfo(capacity) {
    const level = TransitLogic.getCapacityLevel(capacity);
    return CAPACITY_STATUS[level];
  },

  getDelayStatusInfo(delay) {
    if (delay === 0) return { label: 'On Time', color: 'text-green-600', icon: 'check-circle', priority: 1 };
    if (delay < 5) return { label: `Minor Delay (${delay}m)`, color: 'text-yellow-600', icon: 'alert-triangle', priority: 2 };
    if (delay < 10) return { label: `Moderate Delay (${delay}m)`, color: 'text-orange-600', icon: 'alert-triangle', priority: 3 };
    return { label: `Significant Delay (${delay}m)`, color: 'text-red-600', icon: 'siren', priority: 4 };
  },

  getAvailabilityStatusInfo(available) {
    if (available) return { label: 'Available', color: 'bg-green-100 text-green-800', icon: 'check-circle', priority: 1 };
    return { label: 'Unavailable', color: 'bg-red-100 text-red-800', icon: 'x-circle', priority: 2 };
  },
};
