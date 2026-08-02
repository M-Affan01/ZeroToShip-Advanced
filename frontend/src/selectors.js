/**
 * Derived State Selectors - Internal Dynamic (SST section 6)
 * Pure computed values derived from base AppState.
 */

export const getFilteredData = (state) => {
  let { equipment, cafe, transit } = state.data;
  const { selectedCategory, searchQuery } = state.ui;

  switch (selectedCategory) {
    case 'equipment':
      cafe = [];
      transit = [];
      break;
    case 'cafe':
      equipment = [];
      transit = [];
      break;
    case 'transit':
      equipment = [];
      cafe = [];
      break;
    default:
      break;
  }

  if (searchQuery) {
    const query = searchQuery.toLowerCase();
    equipment = equipment.filter(
      (item) => item.name.toLowerCase().includes(query) || item.location.toLowerCase().includes(query)
    );
    cafe = cafe.filter(
      (item) =>
        item.name.toLowerCase().includes(query) ||
        item.description.toLowerCase().includes(query) ||
        item.category.toLowerCase().includes(query)
    );
    transit = transit.filter(
      (item) => item.name.toLowerCase().includes(query) || item.route.some((r) => r.toLowerCase().includes(query))
    );
  }

  if (state.filters.equipmentStatus) {
    equipment = equipment.filter((item) => state.filters.equipmentStatus.includes(item.status));
  }
  if (state.filters.cafeCategory) {
    cafe = cafe.filter((item) => state.filters.cafeCategory.includes(item.category));
  }
  if (state.filters.transitType) {
    transit = transit.filter((item) => state.filters.transitType.includes(item.type));
  }
  if (state.filters.dietaryRestrictions) {
    cafe = cafe.filter((item) =>
      state.filters.dietaryRestrictions.every((diet) => item.dietary.includes(diet))
    );
  }
  if (state.filters.priceRange) {
    cafe = cafe.filter(
      (item) => item.price >= state.filters.priceRange.min && item.price <= state.filters.priceRange.max
    );
  }
  if (state.filters.delayThreshold !== null && state.filters.delayThreshold !== undefined) {
    transit = transit.filter((item) => item.delay <= state.filters.delayThreshold);
  }
  if (state.filters.capacityThreshold !== null && state.filters.capacityThreshold !== undefined) {
    transit = transit.filter((item) => item.capacity <= state.filters.capacityThreshold);
  }

  return { equipment, cafe, transit };
};

export const getQuickStats = (state) => ({
  equipmentAvailable: state.data.equipment.filter((item) => item.status === 'available').length,
  equipmentTotal: state.data.equipment.length,
  cafeAvailable: state.data.cafe.filter((item) => item.available).length,
  cafeTotal: state.data.cafe.length,
  transitDelays: state.data.transit.filter((item) => item.delay > 0).length,
  transitTotal: state.data.transit.length,
  activeAlerts: state.data.transit.reduce((sum, item) => sum + (item.alerts?.length || 0), 0),
  totalChats: state.chat.messageCount,
  unreadMessages: state.chat.unreadCount,
});

export const getSystemStatus = (state) => {
  const equipmentAvailable = state.data.equipment.filter((item) => item.status === 'available').length;
  const cafeAvailable = state.data.cafe.filter((item) => item.available).length;
  const delayedTransit = state.data.transit.filter((item) => item.delay >= 5).length;
  return {
    isHealthy: equipmentAvailable > 0 && cafeAvailable > 0 && delayedTransit < state.data.transit.length,
    hasAlerts: state.toasts.activeToasts.length > 0,
    dataFreshness: state.ui.lastUpdated,
    totalItems:
      state.data.equipment.length + state.data.cafe.length + state.data.transit.length,
  };
};
