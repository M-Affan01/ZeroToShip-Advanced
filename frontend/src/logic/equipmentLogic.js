/**
 * EquipmentLogic - Internal Static
 * Pure functions for equipment data processing (LST section 3.1).
 */

const STATUS_PRIORITY = {
  available: 1,
  'in-use': 2,
  reserved: 3,
  maintenance: 4,
};

const STATUS_COLORS = {
  available: 'bg-green-100 text-green-800 border-green-500',
  'in-use': 'bg-blue-100 text-blue-800 border-blue-500',
  maintenance: 'bg-yellow-100 text-yellow-800 border-yellow-500',
  reserved: 'bg-purple-100 text-purple-800 border-purple-500',
};

const STATUS_ICONS = {
  available: 'check-circle',
  'in-use': 'refresh',
  maintenance: 'wrench',
  reserved: 'pin',
};

export const EquipmentLogic = {
  categorizeByStatus(equipment) {
    const available = equipment.filter((item) => item.status === 'available');
    const inUse = equipment.filter((item) => item.status === 'in-use');
    const maintenance = equipment.filter((item) => item.status === 'maintenance');
    const reserved = equipment.filter((item) => item.status === 'reserved');
    const totalCount = equipment.length;
    const availableCount = available.length;
    const availabilityRate =
      totalCount > 0 ? Math.round((availableCount / totalCount) * 10000) / 100 : 0;
    return { available, inUse, maintenance, reserved, totalCount, availableCount, availabilityRate };
  },

  getByCategory(equipment, category) {
    return equipment.filter((item) => item.category === category);
  },

  isAvailable(equipment) {
    return equipment.status === 'available';
  },

  getStatusPriority(status) {
    return STATUS_PRIORITY[status] || 5;
  },

  sortByStatusAndName(equipment) {
    return [...equipment].sort((a, b) => {
      const priorityDiff = this.getStatusPriority(a.status) - this.getStatusPriority(b.status);
      if (priorityDiff !== 0) return priorityDiff;
      return a.name.localeCompare(b.name);
    });
  },

  getStatusColor(status) {
    return STATUS_COLORS[status] || 'bg-gray-100 text-gray-800 border-gray-500';
  },

  getStatusIcon(status) {
    return STATUS_ICONS[status] || 'help';
  },

  formatLocation(location) {
    return location.split('-').map((part) => part.trim()).join(' • ');
  },
};
