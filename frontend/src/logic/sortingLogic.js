/**
 * SortingLogic - Internal Static
 * Pure functions for data sorting (LST section 9).
 */

import { EquipmentLogic } from './equipmentLogic.js';

export const SortingLogic = {
  sortEquipment(equipment, field = 'name', direction = 'asc') {
    const sorted = [...equipment];
    const mult = direction === 'asc' ? 1 : -1;
    sorted.sort((a, b) => {
      let comparison = 0;
      switch (field) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'status':
          comparison = EquipmentLogic.getStatusPriority(a.status) - EquipmentLogic.getStatusPriority(b.status);
          break;
        case 'category':
          comparison = a.category.localeCompare(b.category);
          break;
        case 'location':
          comparison = a.location.localeCompare(b.location);
          break;
        default:
          comparison = 0;
      }
      return comparison * mult;
    });
    return sorted;
  },

  sortCafeItems(cafe, field = 'name', direction = 'asc') {
    const sorted = [...cafe];
    const mult = direction === 'asc' ? 1 : -1;
    sorted.sort((a, b) => {
      let comparison = 0;
      switch (field) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'price':
          comparison = a.price - b.price;
          break;
        case 'category':
          comparison = a.category.localeCompare(b.category);
          break;
        case 'availability':
          comparison = (a.available ? 1 : 0) - (b.available ? 1 : 0);
          break;
        default:
          comparison = 0;
      }
      return comparison * mult;
    });
    return sorted;
  },

  sortTransitLines(transit, field = 'name', direction = 'asc') {
    const sorted = [...transit];
    const mult = direction === 'asc' ? 1 : -1;
    sorted.sort((a, b) => {
      let comparison = 0;
      switch (field) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'delay':
          comparison = a.delay - b.delay;
          break;
        case 'capacity':
          comparison = a.capacity - b.capacity;
          break;
        case 'type':
          comparison = a.type.localeCompare(b.type);
          break;
        default:
          comparison = 0;
      }
      return comparison * mult;
    });
    return sorted;
  },

  sortMessages(messages, direction = 'asc') {
    return [...messages].sort((a, b) => {
      const timeA = new Date(a.timestamp).getTime();
      const timeB = new Date(b.timestamp).getTime();
      return direction === 'asc' ? timeA - timeB : timeB - timeA;
    });
  },

  getDefaultSort(dataType) {
    const defaults = {
      equipment: { field: 'status', direction: 'asc' },
      cafe: { field: 'name', direction: 'asc' },
      transit: { field: 'delay', direction: 'asc' },
    };
    return defaults[dataType] || { field: 'name', direction: 'asc' };
  },
};
