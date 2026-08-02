/**
 * SearchLogic - Internal Static
 * Pure functions for keyword search (LST section 4.1).
 */

export const SearchLogic = {
  searchAll(query, equipment, cafe, transit) {
    const normalizedQuery = query.toLowerCase().trim();
    if (!normalizedQuery) {
      return { items: [], query: '', matchCount: 0, categories: { equipment: 0, cafe: 0, transit: 0 } };
    }
    const searchTerms = normalizedQuery.split(' ').filter((term) => term.length > 0);
    const matches = (text) => {
      const normalizedText = text.toLowerCase();
      return searchTerms.every((term) => normalizedText.includes(term));
    };

    const matchedEquipment = equipment.filter(
      (item) => matches(item.name) || matches(item.category) || matches(item.location)
    );
    const matchedCafe = cafe.filter(
      (item) =>
        matches(item.name) ||
        matches(item.description) ||
        matches(item.category) ||
        item.dietary.some((diet) => matches(diet))
    );
    const matchedTransit = transit.filter(
      (item) => matches(item.name) || matches(item.type) || item.route.some((stop) => matches(stop))
    );

    return {
      items: [...matchedEquipment, ...matchedCafe, ...matchedTransit],
      query: normalizedQuery,
      matchCount: matchedEquipment.length + matchedCafe.length + matchedTransit.length,
      categories: {
        equipment: matchedEquipment.length,
        cafe: matchedCafe.length,
        transit: matchedTransit.length,
      },
    };
  },

  searchEquipment(query, equipment) {
    const q = query.toLowerCase().trim();
    if (!q) return equipment;
    return equipment.filter(
      (item) =>
        item.name.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q) ||
        item.location.toLowerCase().includes(q) ||
        item.status.toLowerCase().includes(q)
    );
  },

  searchCafe(query, cafe) {
    const q = query.toLowerCase().trim();
    if (!q) return cafe;
    return cafe.filter(
      (item) =>
        item.name.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q) ||
        item.dietary.some((diet) => diet.toLowerCase().includes(q))
    );
  },

  searchTransit(query, transit) {
    const q = query.toLowerCase().trim();
    if (!q) return transit;
    return transit.filter(
      (item) =>
        item.name.toLowerCase().includes(q) ||
        item.type.toLowerCase().includes(q) ||
        item.route.some((stop) => stop.toLowerCase().includes(q))
    );
  },
};
