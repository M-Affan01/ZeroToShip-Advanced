/**
 * CafeLogic - Internal Static
 * Pure functions for cafe menu data processing (LST section 3.2).
 */

const CATEGORY_ICONS = {
  breakfast: 'sunrise',
  lunch: 'sun',
  beverage: 'coffee',
  snack: 'popcorn',
  special: 'star',
};

const DIETARY_BADGES = {
  vegetarian: 'Veg',
  vegan: 'Vegan',
  'gluten-free': 'Gluten-Free',
};

export const CafeLogic = {
  processMenu(items) {
    const available = items.filter((item) => item.available);
    const unavailable = items.filter((item) => !item.available);

    const byCategory = items.reduce((acc, item) => {
      if (!acc[item.category]) acc[item.category] = [];
      acc[item.category].push(item);
      return acc;
    }, {});

    const prices = items.map((item) => item.price);
    const averagePrice =
      prices.length > 0 ? Math.round((prices.reduce((s, p) => s + p, 0) / prices.length) * 100) / 100 : 0;

    const dietaryOptions = items.reduce((acc, item) => {
      item.dietary.forEach((diet) => {
        if (!acc[diet]) acc[diet] = 0;
        acc[diet] += 1;
      });
      return acc;
    }, {});

    return {
      available,
      unavailable,
      byCategory,
      averagePrice,
      priceRange: { min: Math.min(...prices), max: Math.max(...prices) },
      dietaryOptions,
    };
  },

  filterByDietary(items, dietary) {
    return items.filter((item) => item.dietary.includes(dietary));
  },

  filterByPriceRange(items, min, max) {
    return items.filter((item) => item.price >= min && item.price <= max);
  },

  filterByCategory(items, category) {
    return items.filter((item) => item.category === category);
  },

  isAvailable(item) {
    return item.available;
  },

  getDietaryBadges(dietary) {
    return dietary.map((diet) => DIETARY_BADGES[diet] || diet);
  },

  formatPrice(price) {
    return `$${price.toFixed(2)}`;
  },

  calculatePriceWithTax(price, taxRate = 0.08) {
    return Math.round(price * (1 + taxRate) * 100) / 100;
  },

  getCategoryIcon(category) {
    return CATEGORY_ICONS[category] || 'utensils';
  },
};
