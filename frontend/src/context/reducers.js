/**
 * State Reducers - Internal Dynamic (SST sections 3)
 * React Context API + useReducer. Sub-reducers delegate per action type.
 */

import { TOAST_QUEUE } from '../data/mockData.js';

const INITIAL_UI = {
  selectedCategory: 'all',
  activeView: 'dashboard',
  searchQuery: '',
  activeCardId: null,
  isCardModalOpen: false,
  isLoading: false,
  viewMode: 'grid',
  lastUpdated: new Date().toISOString(),
};

const INITIAL_CHAT = {
  messages: [
    {
      id: 'msg-001',
      sender: 'ai',
      text: "Hello! I'm your Campus AI Assistant. Ask me anything about campus services, equipment, dining, or transit!",
      timestamp: new Date().toISOString(),
    },
    {
      id: 'msg-002',
      sender: 'user',
      text: 'How do I check out equipment?',
      timestamp: new Date(Date.now() - 60000).toISOString(),
    },
    {
      id: 'msg-003',
      sender: 'ai',
      text: 'To check out equipment, visit the Tech Hub at the Library with your student ID. All equipment is available on a first-come, first-served basis.',
      timestamp: new Date(Date.now() - 55000).toISOString(),
    },
  ],
  isTyping: false,
  inputValue: '',
  messageCount: 3,
  lastMessageTimestamp: null,
  isInputFocused: false,
  suggestionIndex: 0,
  unreadCount: 0,
  suggestions: [],
};

const INITIAL_TOASTS = {
  queue: [],
  activeToasts: [],
  maxActive: 3,
  isPaused: false,
  totalDelivered: 0,
  lastTriggered: null,
  bootQueue: TOAST_QUEUE,
};

const INITIAL_FILTERS = {
  equipmentStatus: null,
  cafeCategory: null,
  transitType: null,
  priceRange: null,
  dietaryRestrictions: null,
  delayThreshold: null,
  capacityThreshold: null,
};

const INITIAL_PREFERENCES = {
  theme: 'light',
  autoRefresh: true,
  refreshInterval: 30,
  toastDuration: 4000,
  defaultCategory: 'all',
  compactMode: false,
  showAnimations: true,
  notificationSound: true,
  language: 'en',
};

export const INITIAL_STATE = {
  data: {
    equipment: [],
    cafe: [],
    transit: [],
    faq: [],
    metrics: null,
  },
  ui: INITIAL_UI,
  chat: INITIAL_CHAT,
  toasts: INITIAL_TOASTS,
  filters: INITIAL_FILTERS,
  preferences: INITIAL_PREFERENCES,
};

const dataReducer = (state, action) => {
  switch (action.type) {
    case 'EQUIPMENT_LOAD':
      return { ...state, equipment: action.payload, equipmentLoaded: true };
    case 'CAFE_LOAD':
      return { ...state, cafe: action.payload, cafeLoaded: true };
    case 'TRANSIT_LOAD':
      return { ...state, transit: action.payload, transitLoaded: true };
    case 'FAQ_LOAD':
      return { ...state, faq: action.payload, faqLoaded: true };
    case 'METRICS_LOAD':
      return { ...state, metrics: action.payload };
    case 'EQUIPMENT_UPDATE_ALL':
      return { ...state, equipment: action.payload };
    case 'EQUIPMENT_UPDATE_STATUS':
      return {
        ...state,
        equipment: state.equipment.map((item) =>
          item.id === action.payload.serviceId ? { ...item, status: action.payload.newStatus, lastUpdated: new Date().toISOString() } : item
        ),
      };
    case 'TRANSIT_UPDATE_ALL':
      return { ...state, transit: action.payload };
    case 'EQUIPMENT_SIMULATE_POLL':
      return {
        ...state,
        equipment: state.equipment.map((item) => {
          const roll = Math.random();
          let status = item.status;
          if (roll < 0.55) status = 'available';
          else if (roll < 0.75) status = 'in-use';
          else if (roll < 0.9) status = 'reserved';
          else status = 'maintenance';
          return { ...item, status, lastUpdated: new Date().toISOString() };
        }),
      };
    case 'TRANSIT_SIMULATE_POLL':
      return {
        ...state,
        transit: state.transit.map((line) => {
          const delay = Math.floor(Math.random() * 13);
          const capacity = Math.floor(Math.random() * 96);
          const alerts = delay >= 5 ? [`Heavy traffic - ${delay} minute delay`] : [];
          return { ...line, delay, capacity, alerts };
        }),
      };
    default:
      return state;
  }
};

const uiReducer = (state, action) => {
  switch (action.type) {
    case 'UI_SET_CATEGORY':
      return { ...state, selectedCategory: action.payload, activeCardId: null, isCardModalOpen: false };
    case 'UI_SET_SEARCH':
      return { ...state, searchQuery: action.payload };
    case 'UI_SET_ACTIVE_CARD':
      return { ...state, activeCardId: action.payload, isCardModalOpen: !!action.payload };
    case 'UI_TOGGLE_CARD_MODAL':
      return { ...state, isCardModalOpen: !state.isCardModalOpen };
    case 'UI_SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'UI_SET_VIEW_MODE':
      return { ...state, viewMode: action.payload };
    case 'UI_SET_ACTIVE_VIEW':
      return { ...state, activeView: action.payload, activeCardId: null, isCardModalOpen: false };
    case 'UI_SET_LAST_UPDATED':
      return { ...state, lastUpdated: action.payload };
    default:
      return state;
  }
};

const chatReducer = (state, action) => {
  switch (action.type) {
    case 'CHAT_ADD_MESSAGE': {
      const newMessage = {
        ...action.payload,
        timestamp: action.payload.timestamp || new Date().toISOString(),
      };
      return {
        ...state,
        messages: [...state.messages, newMessage],
        messageCount: state.messageCount + 1,
        lastMessageTimestamp: newMessage.timestamp,
      };
    }
    case 'CHAT_SET_TYPING':
      return { ...state, isTyping: action.payload };
    case 'CHAT_SET_INPUT':
      return { ...state, inputValue: action.payload };
    case 'CHAT_SUBMIT_INPUT': {
      if (!action.payload || !action.payload.trim()) return state;
      const userMessage = {
        id: `msg-${Date.now()}`,
        sender: 'user',
        text: action.payload.trim(),
        timestamp: new Date().toISOString(),
      };
      return {
        ...state,
        messages: [...state.messages, userMessage],
        messageCount: state.messageCount + 1,
        lastMessageTimestamp: userMessage.timestamp,
        inputValue: '',
        isTyping: true,
        suggestions: [],
      };
    }
    case 'CHAT_SET_SUGGESTIONS':
      return { ...state, suggestions: action.payload || [] };
    case 'CHAT_CLEAR_HISTORY':
      return { ...state, messages: [], messageCount: 0, lastMessageTimestamp: null, suggestions: [] };
    case 'CHAT_SET_FOCUS':
      return { ...state, isInputFocused: action.payload };
    case 'CHAT_NEXT_SUGGESTION':
      return { ...state, suggestionIndex: state.suggestionIndex + 1 };
    case 'CHAT_PREVIOUS_SUGGESTION':
      return { ...state, suggestionIndex: Math.max(0, state.suggestionIndex - 1) };
    case 'CHAT_INCREMENT_UNREAD':
      return { ...state, unreadCount: state.unreadCount + 1 };
    case 'CHAT_CLEAR_UNREAD':
      return { ...state, unreadCount: 0 };
    default:
      return state;
  }
};

const toastReducer = (state, action) => {
  switch (action.type) {
    case 'TOAST_ADD': {
      const newToast = {
        ...action.payload,
        id: action.payload.id || `toast-${Date.now()}-${Math.random()}`,
      };
      if (state.isPaused) return { ...state, queue: [...state.queue, newToast], totalDelivered: state.totalDelivered + 1 };
      if (state.activeToasts.length < state.maxActive) {
        return {
          ...state,
          activeToasts: [...state.activeToasts, newToast],
          totalDelivered: state.totalDelivered + 1,
          lastTriggered: newToast.timestamp,
        };
      }
      return {
        ...state,
        queue: [...state.queue, newToast],
        totalDelivered: state.totalDelivered + 1,
        lastTriggered: newToast.timestamp,
      };
    }
    case 'TOAST_REMOVE':
    case 'TOAST_DISMISS': {
      const remainingActive = state.activeToasts.filter((toast) => toast.id !== action.payload);
      if (remainingActive.length < state.maxActive && state.queue.length > 0) {
        const [nextToast, ...remainingQueue] = state.queue;
        return {
          ...state,
          activeToasts: [...remainingActive, nextToast],
          queue: remainingQueue,
        };
      }
      return { ...state, activeToasts: remainingActive };
    }
    case 'TOAST_ACTIVATE_NEXT':
      if (state.activeToasts.length >= state.maxActive || state.queue.length === 0) return state;
      const [nextToast, ...remainingQueue] = state.queue;
      return { ...state, activeToasts: [...state.activeToasts, nextToast], queue: remainingQueue };
    case 'TOAST_PAUSE':
      return { ...state, isPaused: true };
    case 'TOAST_RESUME':
      return { ...state, isPaused: false };
    case 'TOAST_CLEAR_ALL':
      return { ...state, activeToasts: [], queue: [] };
    default:
      return state;
  }
};

const filterReducer = (state, action) => {
  const toggleArrayItem = (array, item) => {
    if (!array) return [item];
    if (array.includes(item)) {
      const filtered = array.filter((i) => i !== item);
      return filtered.length === 0 ? null : filtered;
    }
    return [...array, item];
  };
  switch (action.type) {
    case 'FILTER_TOGGLE_EQUIPMENT_STATUS':
      return { ...state, equipmentStatus: toggleArrayItem(state.equipmentStatus, action.payload) };
    case 'FILTER_TOGGLE_CAFE_CATEGORY':
      return { ...state, cafeCategory: toggleArrayItem(state.cafeCategory, action.payload) };
    case 'FILTER_TOGGLE_TRANSIT_TYPE':
      return { ...state, transitType: toggleArrayItem(state.transitType, action.payload) };
    case 'FILTER_TOGGLE_DIETARY':
      return { ...state, dietaryRestrictions: toggleArrayItem(state.dietaryRestrictions, action.payload) };
    case 'FILTER_SET_PRICE_RANGE':
      return { ...state, priceRange: action.payload };
    case 'FILTER_SET_DELAY_THRESHOLD':
      return { ...state, delayThreshold: action.payload };
    case 'FILTER_SET_CAPACITY_THRESHOLD':
      return { ...state, capacityThreshold: action.payload };
    case 'FILTER_CLEAR_ALL':
      return { ...INITIAL_FILTERS };
    default:
      return state;
  }
};

const preferenceReducer = (state, action) => {
  switch (action.type) {
    case 'PREFERENCE_SET_THEME':
      return { ...state, theme: action.payload };
    case 'PREFERENCE_TOGGLE_THEME':
      return { ...state, theme: state.theme === 'light' ? 'dark' : 'light' };
    case 'PREFERENCE_TOGGLE_AUTO_REFRESH':
      return { ...state, autoRefresh: !state.autoRefresh };
    case 'PREFERENCE_SET_REFRESH_INTERVAL':
      return { ...state, refreshInterval: action.payload };
    case 'PREFERENCE_SET_TOAST_DURATION':
      return { ...state, toastDuration: action.payload };
    case 'PREFERENCE_TOGGLE_COMPACT':
      return { ...state, compactMode: !state.compactMode };
    case 'PREFERENCE_TOGGLE_ANIMATIONS':
      return { ...state, showAnimations: !state.showAnimations };
    case 'PREFERENCE_RESET_DEFAULTS':
      return { ...INITIAL_PREFERENCES };
    default:
      return state;
  }
};

export const rootReducer = (state, action) => {
  const { type } = action;
  if (type.startsWith('UI_')) return { ...state, ui: uiReducer(state.ui, action) };
  if (type.startsWith('CHAT_')) return { ...state, chat: chatReducer(state.chat, action) };
  if (type.startsWith('TOAST_')) return { ...state, toasts: toastReducer(state.toasts, action) };
  if (type.startsWith('FILTER_')) return { ...state, filters: filterReducer(state.filters, action) };
  if (type.startsWith('PREFERENCE_')) return { ...state, preferences: preferenceReducer(state.preferences, action) };
  if (type === 'COMPOSITE_UPDATE_DATA') {
    return {
      ...state,
      data: { ...state.data, ...action.payload },
      ui: { ...state.ui, lastUpdated: new Date().toISOString() },
    };
  }
  if (type === 'COMPOSITE_REFRESH_ALL') {
    return { ...state, ui: { ...state.ui, isLoading: true, lastUpdated: null } };
  }
  return { ...state, data: dataReducer(state.data, action) };
};
