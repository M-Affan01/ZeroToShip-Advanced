/**
 * AppContext - Internal Dynamic (SST)
 * React Context API + useReducer. Static mock data loaded on mount,
 * simulated polling + toast triggers, LocalStorage persistence.
 */

import React, { createContext, useContext, useEffect, useMemo, useReducer, useRef } from 'react';
import {
  EQUIPMENT_DATA,
  CAFE_DATA,
  TRANSIT_DATA,
  FAQ_DATA,
} from '../data/mockData.js';
import { ChatBotLogic } from '../logic/chatBotLogic.js';
import { ToastLogic } from '../logic/toastLogic.js';
import { INITIAL_STATE, rootReducer } from './reducers.js';

const STORAGE_KEY = 'campus_hub_state';

const AppContext = createContext(null);

const loadPersistedState = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return null;
    const parsed = JSON.parse(saved);
    if (!parsed || typeof parsed !== 'object') return null;
    if (parsed.preferences && !('theme' in parsed.preferences)) return null;
    return parsed;
  } catch (error) {
    console.warn('Failed to load state from LocalStorage:', error);
    return null;
  }
};

const AppProvider = ({ children }) => {
  const [state, dispatch] = useReducer(rootReducer, INITIAL_STATE, (initial) => {
    const persisted = loadPersistedState();
    if (!persisted) {
      if (typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        return { ...initial, preferences: { ...initial.preferences, theme: 'dark' } };
      }
      return initial;
    }
    return {
      ...initial,
      preferences: { ...initial.preferences, ...(persisted.preferences || {}) },
      chat: persisted.chat ? { ...initial.chat, ...persisted.chat } : initial.chat,
    };
  });

  const stateRef = useRef(state);
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  // Apply theme: toggle `dark` class on <html> (functional light/dark toggle)
  useEffect(() => {
    const root = document.documentElement;
    if (state.preferences.theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [state.preferences.theme]);

  // Load static mock data on mount (STATIC DATA LOAD)
  useEffect(() => {
    dispatch({ type: 'EQUIPMENT_LOAD', payload: EQUIPMENT_DATA });
    dispatch({ type: 'CAFE_LOAD', payload: CAFE_DATA });
    dispatch({ type: 'TRANSIT_LOAD', payload: TRANSIT_DATA });
    dispatch({ type: 'FAQ_LOAD', payload: FAQ_DATA });
  }, []);

  // Persist preferences + chat to LocalStorage
  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ preferences: state.preferences, chat: state.chat })
      );
    } catch (error) {
      console.warn('Failed to save state to LocalStorage:', error);
    }
  }, [state.preferences, state.chat]);

  // Boot toasts: fire the pre-defined queue staggered on mount (mock event bus)
  useEffect(() => {
    const timers = [];
    state.toasts.bootQueue.forEach((toast, index) => {
      timers.push(
        setTimeout(() => {
          dispatch({
            type: 'TOAST_ADD',
            payload: { ...toast, timestamp: new Date().toISOString() },
          });
        }, index * 1400)
      );
    });
    return () => timers.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Simulated polling (visual only) + random toast triggers
  useEffect(() => {
    const equipmentTimer = setInterval(() => {
      if (!stateRef.current.preferences.autoRefresh) return;
      dispatch({ type: 'EQUIPMENT_SIMULATE_POLL' });
      dispatch({ type: 'UI_SET_LAST_UPDATED', payload: new Date().toISOString() });
    }, (stateRef.current.preferences.refreshInterval || 30) * 1000);

    const transitTimer = setInterval(() => {
      if (!stateRef.current.preferences.autoRefresh) return;
      dispatch({ type: 'TRANSIT_SIMULATE_POLL' });
      dispatch({ type: 'UI_SET_LAST_UPDATED', payload: new Date().toISOString() });
    }, 45000);

    const toastTimer = setInterval(() => {
      const [event] = ToastLogic.generateMockEvents(1);
      dispatch({
        type: 'TOAST_ADD',
        payload: ToastLogic.createToast(event.type, event.title, event.message),
      });
    }, 15000);

    return () => {
      clearInterval(equipmentTimer);
      clearInterval(transitTimer);
      clearInterval(toastTimer);
    };
  }, []);

  const actionCreators = useMemo(
    () => ({
      setSelectedCategory: (category) => dispatch({ type: 'UI_SET_CATEGORY', payload: category }),
      setActiveView: (view) => dispatch({ type: 'UI_SET_ACTIVE_VIEW', payload: view }),
      setSearchQuery: (query) => dispatch({ type: 'UI_SET_SEARCH', payload: query }),
      setActiveCard: (id) => dispatch({ type: 'UI_SET_ACTIVE_CARD', payload: id }),
      toggleCardModal: () => dispatch({ type: 'UI_TOGGLE_CARD_MODAL' }),
      setViewMode: (mode) => dispatch({ type: 'UI_SET_VIEW_MODE', payload: mode }),
      setChatInput: (value) => dispatch({ type: 'CHAT_SET_INPUT', payload: value }),
      setChatFocus: (focused) => dispatch({ type: 'CHAT_SET_FOCUS', payload: focused }),
      clearChatHistory: () => dispatch({ type: 'CHAT_CLEAR_HISTORY' }),
      clearUnread: () => dispatch({ type: 'CHAT_CLEAR_UNREAD' }),
      setChatSuggestions: (suggestions) => dispatch({ type: 'CHAT_SET_SUGGESTIONS', payload: suggestions }),
      addToast: (toast) => dispatch({ type: 'TOAST_ADD', payload: toast }),
      dismissToast: (id) => dispatch({ type: 'TOAST_DISMISS', payload: id }),
      clearAllToasts: () => dispatch({ type: 'TOAST_CLEAR_ALL' }),
      pauseToasts: () => dispatch({ type: 'TOAST_PAUSE' }),
      resumeToasts: () => dispatch({ type: 'TOAST_RESUME' }),
      simulateToast: () => {
        const [event] = ToastLogic.generateMockEvents(1);
        dispatch({
          type: 'TOAST_ADD',
          payload: ToastLogic.createToast(event.type, event.title, event.message),
        });
      },
      toggleFilterEquipment: (status) => dispatch({ type: 'FILTER_TOGGLE_EQUIPMENT_STATUS', payload: status }),
      toggleFilterCafe: (category) => dispatch({ type: 'FILTER_TOGGLE_CAFE_CATEGORY', payload: category }),
      toggleFilterTransit: (type) => dispatch({ type: 'FILTER_TOGGLE_TRANSIT_TYPE', payload: type }),
      toggleFilterDietary: (diet) => dispatch({ type: 'FILTER_TOGGLE_DIETARY', payload: diet }),
      setPriceRange: (range) => dispatch({ type: 'FILTER_SET_PRICE_RANGE', payload: range }),
      setDelayThreshold: (value) => dispatch({ type: 'FILTER_SET_DELAY_THRESHOLD', payload: value }),
      setCapacityThreshold: (value) => dispatch({ type: 'FILTER_SET_CAPACITY_THRESHOLD', payload: value }),
      clearFilters: () => dispatch({ type: 'FILTER_CLEAR_ALL' }),
      toggleTheme: () => dispatch({ type: 'PREFERENCE_TOGGLE_THEME' }),
      toggleAutoRefresh: () => dispatch({ type: 'PREFERENCE_TOGGLE_AUTO_REFRESH' }),
      toggleCompact: () => dispatch({ type: 'PREFERENCE_TOGGLE_COMPACT' }),
      toggleAnimations: () => dispatch({ type: 'PREFERENCE_TOGGLE_ANIMATIONS' }),
      setRefreshInterval: (sec) => dispatch({ type: 'PREFERENCE_SET_REFRESH_INTERVAL', payload: sec }),
      setToastDuration: (ms) => dispatch({ type: 'PREFERENCE_SET_TOAST_DURATION', payload: ms }),
      resetPreferences: () => dispatch({ type: 'PREFERENCE_RESET_DEFAULTS' }),
      handleSendMessage: (text) => {
        const trimmed = text.trim();
        if (!trimmed) return;
        const { chat, data } = stateRef.current;
        dispatch({ type: 'CHAT_SUBMIT_INPUT', payload: trimmed });

        const nextMessages = [
          ...chat.messages,
          { id: `msg-${Date.now()}`, sender: 'user', text: trimmed, timestamp: new Date().toISOString() },
        ];
        const response = ChatBotLogic.processQuery(trimmed, data.faq, nextMessages);
        const delay = ChatBotLogic.simulateTypingDelay(response.text.length);

        setTimeout(() => {
          dispatch({ type: 'CHAT_SET_TYPING', payload: false });
          dispatch({
            type: 'CHAT_ADD_MESSAGE',
            payload: {
              id: `msg-${Date.now()}`,
              sender: 'ai',
              text: response.text,
              timestamp: new Date().toISOString(),
            },
          });
          dispatch({ type: 'CHAT_SET_SUGGESTIONS', payload: response.suggestedQuestions || [] });
        }, delay);
      },
    }),
    []
  );

  const value = useMemo(
    () => ({ state, dispatch, ...actionCreators }),
    [state, actionCreators]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within an AppProvider');
  return context;
};

export { AppProvider };
