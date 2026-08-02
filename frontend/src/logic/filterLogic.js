/**
 * FilterLogic - Internal Static
 * Pure functions for applying user filters (LST section 4.2).
 */

export const FilterLogic = {
  applyFilters(data, filters = {}) {
    let { equipment, cafe, transit } = data;

    if (filters.equipmentStatus && filters.equipmentStatus.length > 0) {
      equipment = equipment.filter((item) => filters.equipmentStatus.includes(item.status));
    }
    if (filters.cafeCategories && filters.cafeCategories.length > 0) {
      cafe = cafe.filter((item) => filters.cafeCategories.includes(item.category));
    }
    if (filters.dietary && filters.dietary.length > 0) {
      cafe = cafe.filter((item) => filters.dietary.every((diet) => item.dietary.includes(diet)));
    }
    if (filters.priceRange) {
      cafe = cafe.filter(
        (item) => item.price >= filters.priceRange.min && item.price <= filters.priceRange.max
      );
    }
    if (filters.transitTypes && filters.transitTypes.length > 0) {
      transit = transit.filter((item) => filters.transitTypes.includes(item.type));
    }
    if (filters.maxDelay !== undefined) {
      transit = transit.filter((item) => item.delay <= filters.maxDelay);
    }
    if (filters.maxCapacity !== undefined) {
      transit = transit.filter((item) => item.capacity <= filters.maxCapacity);
    }

    return { equipment, cafe, transit };
  },

  hasActiveFilters(filters = {}) {
    return !!(
      (filters.equipmentStatus && filters.equipmentStatus.length > 0) ||
      (filters.cafeCategories && filters.cafeCategories.length > 0) ||
      (filters.transitTypes && filters.transitTypes.length > 0) ||
      filters.priceRange ||
      (filters.dietary && filters.dietary.length > 0) ||
      filters.maxDelay !== undefined ||
      filters.maxCapacity !== undefined
    );
  },

  getActiveFilterCount(filters = {}) {
    let count = 0;
    if (filters.equipmentStatus && filters.equipmentStatus.length > 0) count++;
    if (filters.cafeCategories && filters.cafeCategories.length > 0) count++;
    if (filters.transitTypes && filters.transitTypes.length > 0) count++;
    if (filters.priceRange) count++;
    if (filters.dietary && filters.dietary.length > 0) count++;
    if (filters.maxDelay !== undefined) count++;
    if (filters.maxCapacity !== undefined) count++;
    return count;
  },
};
