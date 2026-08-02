/**
 * Static mock fixtures - EXTERNAL STATIC
 * Verbatim data contracts from FST section 2.
 * In future phases these arrays will be replaced by live API responses
 * (EI-001..EI-007) but the shape will remain unchanged.
 */

export const EQUIPMENT_DATA = [
  {
    id: 'eq-001',
    name: 'MacBook Pro 16"',
    category: 'laptop',
    status: 'available',
    location: 'Library - Tech Hub',
    lastUpdated: '2026-08-01T08:30:00Z',
    imageUrl: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=800&q=70"
  },
  {
    id: 'eq-002',
    name: 'Epson Projector X500',
    category: 'projector',
    status: 'in-use',
    location: 'Room 301 - Lecture Hall',
    lastUpdated: '2026-08-01T07:15:00Z',
    imageUrl: "https://images.unsplash.com/photo-1524985069026-dd778a71c7b4?auto=format&fit=crop&w=800&q=70"
  },
  {
    id: 'eq-003',
    name: 'Bose Sound System',
    category: 'audio',
    status: 'maintenance',
    location: 'AV Center - Storage',
    lastUpdated: '2026-07-31T16:45:00Z',
    imageUrl: "https://images.unsplash.com/photo-1545454675-3531b543be5d?auto=format&fit=crop&w=800&q=70"
  },
  {
    id: 'eq-004',
    name: 'Sony A7 III Camera Kit',
    category: 'camera',
    status: 'reserved',
    location: 'Media Lab - Checkout',
    lastUpdated: '2026-08-01T09:00:00Z',
    imageUrl: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=800&q=70"
  },
  {
    id: 'eq-005',
    name: 'Dell XPS 15',
    category: 'laptop',
    status: 'available',
    location: 'Computer Lab - East',
    lastUpdated: '2026-08-01T08:00:00Z',
    imageUrl: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=800&q=70"
  },
  {
    id: 'eq-006',
    name: 'Logitech Conference Camera',
    category: 'camera',
    status: 'in-use',
    location: 'Room 205 - Conference Room',
    lastUpdated: '2026-08-01T07:30:00Z',
    imageUrl: "https://images.unsplash.com/photo-1593642532974-d377ab507dc8?auto=format&fit=crop&w=800&q=70"
  },
  {
    id: 'eq-007',
    name: 'Portable PA System',
    category: 'audio',
    status: 'available',
    location: 'Student Union - Event Services',
    lastUpdated: '2026-07-31T14:20:00Z',
    imageUrl: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=800&q=70"
  },
  {
    id: 'eq-008',
    name: 'Epson Document Camera',
    category: 'projector',
    status: 'maintenance',
    location: 'IT Support - Repair Center',
    lastUpdated: '2026-07-30T10:00:00Z',
    imageUrl: "https://images.unsplash.com/photo-1550439062-609e1531270e?auto=format&fit=crop&w=800&q=70"
  },
];

export const CAFE_DATA = [
  {
    id: 'cafe-001',
    name: 'Avocado Toast Supreme',
    category: 'breakfast',
    price: 8.99,
    currency: 'USD',
    available: true,
    dietary: ['vegetarian'],
    description: 'Sourdough toast with mashed avocado, cherry tomatoes, and microgreens',
    imageUrl: "https://images.unsplash.com/photo-1541519227354-08fa5d50c44d?auto=format&fit=crop&w=800&q=70"
  },
  {
    id: 'cafe-002',
    name: 'Vegan Power Bowl',
    category: 'lunch',
    price: 12.99,
    currency: 'USD',
    available: true,
    dietary: ['vegan', 'gluten-free'],
    description: 'Quinoa, roasted vegetables, chickpeas, tahini dressing',
    imageUrl: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=800&q=70"
  },
  {
    id: 'cafe-003',
    name: 'Caramel Macchiato',
    category: 'beverage',
    price: 4.99,
    currency: 'USD',
    available: true,
    dietary: ['vegetarian'],
    description: 'Espresso with steamed milk and caramel drizzle',
    imageUrl: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=800&q=70"
  },
  {
    id: 'cafe-004',
    name: 'Turkey Club Sandwich',
    category: 'lunch',
    price: 9.99,
    currency: 'USD',
    available: false,
    dietary: [],
    description: 'Roasted turkey, bacon, lettuce, tomato on toasted sourdough',
    imageUrl: "https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&w=800&q=70"
  },
  {
    id: 'cafe-005',
    name: 'Matcha Green Tea Latte',
    category: 'beverage',
    price: 5.49,
    currency: 'USD',
    available: true,
    dietary: ['vegan'],
    description: 'Ceremonial matcha with oat milk',
    imageUrl: "https://images.unsplash.com/photo-1536256263959-770b48d82b0a?auto=format&fit=crop&w=800&q=70"
  },
  {
    id: 'cafe-006',
    name: 'Mediterranean Wrap',
    category: 'lunch',
    price: 10.49,
    currency: 'USD',
    available: true,
    dietary: ['vegetarian'],
    description: 'Hummus, falafel, fresh vegetables, tahini sauce',
    imageUrl: "https://images.unsplash.com/photo-1562059390-a761a084768e?auto=format&fit=crop&w=800&q=70"
  },
  {
    id: 'cafe-007',
    name: 'Fresh Berry Smoothie',
    category: 'beverage',
    price: 6.99,
    currency: 'USD',
    available: true,
    dietary: ['vegan', 'gluten-free'],
    description: 'Mixed berries, banana, almond milk, honey',
    imageUrl: "https://images.unsplash.com/photo-1553530666-ba11a7da3888?auto=format&fit=crop&w=800&q=70"
  },
  {
    id: 'cafe-008',
    name: "Chef's Salad",
    category: 'lunch',
    price: 11.49,
    currency: 'USD',
    available: true,
    dietary: ['gluten-free'],
    description: 'Mixed greens, grilled chicken, avocado, egg, vinaigrette',
    imageUrl: "https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=800&q=70"
  },
  {
    id: 'cafe-009',
    name: 'Chocolate Chip Cookie',
    category: 'snack',
    price: 2.99,
    currency: 'USD',
    available: true,
    dietary: ['vegetarian'],
    description: 'Freshly baked, soft and chewy',
    imageUrl: "https://images.unsplash.com/photo-1499636136210-6f4ee915583e?auto=format&fit=crop&w=800&q=70"
  },
  {
    id: 'cafe-010',
    name: 'Daily Special: Pasta Alfredo',
    category: 'special',
    price: 13.99,
    currency: 'USD',
    available: true,
    dietary: ['vegetarian'],
    description: 'Creamy alfredo pasta with garlic and parmesan',
    imageUrl: "https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?auto=format&fit=crop&w=800&q=70"
  },
];

export const TRANSIT_DATA = [
  {
    id: 'transit-001',
    name: 'Blue Line - Campus Express',
    type: 'bus',
    direction: 'inbound',
    nextArrival: '2026-08-01T08:45:00Z',
    delay: 0,
    capacity: 45,
    route: ['Main Campus', 'Science Center', 'Library', 'Student Union'],
    alerts: [],
    imageUrl: "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=800&q=70",
  },
  {
    id: 'transit-002',
    name: 'Green Line - Downtown Shuttle',
    type: 'bus',
    direction: 'outbound',
    nextArrival: '2026-08-01T09:00:00Z',
    delay: 5,
    capacity: 72,
    route: ['Campus Station', 'City Center', 'Shopping District'],
    alerts: ['Traffic delay - 5 minutes behind schedule'],
    imageUrl: "https://images.unsplash.com/photo-1570125909232-eb263c188f7e?auto=format&fit=crop&w=800&q=70",
  },
  {
    id: 'transit-003',
    name: 'Red Line - North Campus',
    type: 'bus',
    direction: 'inbound',
    nextArrival: '2026-08-01T08:30:00Z',
    delay: 0,
    capacity: 30,
    route: ['North Dorms', 'Athletics Center', 'Main Campus'],
    alerts: [],
    imageUrl: "https://images.unsplash.com/photo-1572025442646-866d16c84a54?auto=format&fit=crop&w=800&q=70",
  },
  {
    id: 'transit-004',
    name: 'Metro Rail - East/West',
    type: 'train',
    direction: 'inbound',
    nextArrival: '2026-08-01T08:50:00Z',
    delay: 2,
    capacity: 88,
    route: ['East Gate', 'University Station', 'West End'],
    alerts: ['Minor delays expected'],
    imageUrl: "https://images.unsplash.com/photo-1558449028-b53a39d100fc?auto=format&fit=crop&w=800&q=70",
  },
  {
    id: 'transit-005',
    name: 'Night Shuttle - South Campus',
    type: 'shuttle',
    direction: 'outbound',
    nextArrival: '2026-08-01T09:15:00Z',
    delay: 0,
    capacity: 15,
    route: ['Main Campus', 'South Dorms', 'Graduate Housing'],
    alerts: [],
    imageUrl: "https://images.unsplash.com/photo-1519501025264-65ba15a82390?auto=format&fit=crop&w=800&q=70",
  },
  {
    id: 'transit-006',
    name: 'Express Shuttle - Parking Lot',
    type: 'shuttle',
    direction: 'inbound',
    nextArrival: '2026-08-01T08:40:00Z',
    delay: 8,
    capacity: 60,
    route: ['Lot A', 'Lot B', 'Main Campus', 'Library'],
    alerts: ['Heavy traffic from Lot A - significant delays'],
    imageUrl: "https://images.unsplash.com/photo-1503736334956-4c8f8e92946d?auto=format&fit=crop&w=800&q=70",
  },
];

export const FAQ_DATA = [
  {
    id: 'faq-001',
    question: 'How do I check out equipment?',
    keywords: ['equipment', 'checkout', 'borrow', 'rent'],
    answer: 'To check out equipment, visit the Tech Hub at the Library with your student ID. All equipment is available on a first-come, first-served basis.',
    category: 'equipment',
  },
  {
    id: 'faq-002',
    question: 'What are the library hours?',
    keywords: ['library', 'hours', 'open', 'close'],
    answer: 'The Library is open Monday-Friday 8:00 AM - 10:00 PM, Saturday 9:00 AM - 6:00 PM, and Sunday 12:00 PM - 8:00 PM.',
    category: 'facilities',
  },
  {
    id: 'faq-003',
    question: 'Are there vegetarian options at the cafe?',
    keywords: ['vegetarian', 'vegan', 'dietary', 'food', 'cafe'],
    answer: 'Yes! The Cafe offers a variety of vegetarian options including Avocado Toast, Mediterranean Wrap, and our Daily Special. Most items are clearly labeled with dietary indicators.',
    category: 'dining',
  },
  {
    id: 'faq-004',
    question: 'How do I get to the downtown campus?',
    keywords: ['transit', 'bus', 'downtown', 'shuttle', 'route'],
    answer: 'Take the Green Line Downtown Shuttle from Campus Station. It runs every 15 minutes and takes approximately 25 minutes to reach City Center.',
    category: 'transport',
  },
  {
    id: 'faq-005',
    question: 'Can I reserve equipment in advance?',
    keywords: ['reserve', 'reservation', 'hold', 'equipment'],
    answer: 'Yes! Equipment can be reserved up to 48 hours in advance through the Campus Hub portal. Select "Reserve" on the equipment card and choose your preferred time slot.',
    category: 'equipment',
  },
  {
    id: 'faq-006',
    question: 'What dining options are available?',
    keywords: ['dining', 'food', 'cafe', 'restaurant', 'eat'],
    answer: "The campus Cafe offers breakfast, lunch, and beverage options daily from 7:00 AM to 7:00 PM. Check the Dashboard for today's menu and Daily Special.",
    category: 'dining',
  },
  {
    id: 'faq-007',
    question: 'Is there parking on campus?',
    keywords: ['parking', 'car', 'lot', 'campus'],
    answer: 'Yes, parking is available in Lots A and B. Daily passes are available for purchase at the Parking Office. The Express Shuttle connects both lots to Main Campus.',
    category: 'facilities',
  },
  {
    id: 'faq-008',
    question: 'How often do buses run?',
    keywords: ['bus', 'schedule', 'frequency', 'transit'],
    answer: 'Most campus buses run every 10-15 minutes during peak hours (7 AM - 7 PM) and every 20-25 minutes during off-peak hours. Check the Transit section for real-time updates.',
    category: 'transport',
  },
  {
    id: 'faq-009',
    question: 'Can I return equipment after hours?',
    keywords: ['return', 'equipment', 'after hours', 'drop off'],
    answer: 'Yes, there is an after-hours drop box for equipment returns at the Library entrance. Items returned after hours will be checked in the next business day.',
    category: 'equipment',
  },
  {
    id: 'faq-010',
    question: 'What is the Daily Special at the cafe today?',
    keywords: ['special', 'daily', 'cafe', 'menu', 'today'],
    answer: "Today's Daily Special is Pasta Alfredo - creamy alfredo pasta with garlic and parmesan. Available now at the Cafe!",
    category: 'dining',
  },
  {
    id: 'faq-011',
    question: 'How do I report a transit delay?',
    keywords: ['delay', 'transit', 'report', 'bus', 'problem'],
    answer: 'Transit delays are automatically reported on the Dashboard. If you have additional concerns, please contact Transportation Services at (555) 123-4567.',
    category: 'transport',
  },
  {
    id: 'faq-012',
    question: 'What facilities are open on weekends?',
    keywords: ['weekend', 'open', 'facilities', 'hours'],
    answer: 'The Library, Student Union, and Cafe are open on weekends. The Tech Hub and AV Center operate on reduced hours. Check the Dashboard for specific weekend schedules.',
    category: 'facilities',
  },
  {
    id: 'faq-013',
    question: 'How do I find my classroom?',
    keywords: ['classroom', 'room', 'location', 'building'],
    answer: 'Use the Campus Map feature on the Dashboard to find your classroom. Select your building and room number for turn-by-turn directions.',
    category: 'facilities',
  },
  {
    id: 'faq-014',
    question: 'Are there gluten-free options?',
    keywords: ['gluten', 'gluten-free', 'dietary', 'food'],
    answer: "Yes, many menu items are gluten-free, including the Vegan Power Bowl and Chef's Salad. All items are clearly labeled with dietary icons on the Dashboard.",
    category: 'dining',
  },
  {
    id: 'faq-015',
    question: 'How do I contact campus security?',
    keywords: ['security', 'emergency', 'safety', 'contact', 'help'],
    answer: 'For emergencies, call Campus Security at (555) 123-4567 (ext. 4567). For non-emergencies, use the Security Contact form in the Help section.',
    category: 'facilities',
  },
];

export const TOAST_QUEUE = [
  {
    id: 'toast-001',
    type: 'success',
    title: 'Data Synced',
    message: 'All campus data has been updated successfully.',
    duration: 4000,
    timestamp: new Date().toISOString(),
  },
  {
    id: 'toast-002',
    type: 'warning',
    title: 'Transit Delay Alert',
    message: 'Green Line is experiencing 5-minute delays.',
    duration: 4500,
    timestamp: new Date().toISOString(),
  },
  {
    id: 'toast-003',
    type: 'info',
    title: 'New Menu Available',
    message: "Try today's Daily Special: Pasta Alfredo!",
    duration: 3500,
    timestamp: new Date().toISOString(),
  },
  {
    id: 'toast-004',
    type: 'error',
    title: 'Connection Issue',
    message: 'Unable to reach equipment database. Retrying...',
    duration: 5000,
    timestamp: new Date().toISOString(),
  },
];
