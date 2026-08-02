/**
 * Sidebar.jsx - Left navigation sidebar (real-world app layout)
 * Fixed on desktop (lg+), slide-in drawer on mobile.
 * Nav items switch between Dashboard (with category quick-links) and AI Assistant.
 */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '../context/AppContext.jsx';
import { getSystemStatus } from '../selectors.js';
import Icon from './Icon.jsx';

const NAV_GROUPS = [
  {
    label: 'Overview',
    items: [{ id: 'dashboard', view: 'dashboard', category: 'all', label: 'Dashboard', icon: 'layout-grid' }],
  },
  {
    label: 'Explore',
    items: [
      { id: 'equipment', view: 'dashboard', category: 'equipment', label: 'Equipment', icon: 'laptop' },
      { id: 'cafe', view: 'dashboard', category: 'cafe', label: 'Cafe', icon: 'coffee' },
      { id: 'transit', view: 'dashboard', category: 'transit', label: 'Transit', icon: 'bus' },
    ],
  },
  {
    label: 'Assist',
    items: [{ id: 'assistant', view: 'assistant', category: null, label: 'AI Assistant', icon: 'bot' }],
  },
];

const SidebarContent = ({ onNavigate, idPrefix = 'sb' }) => {
  const { state, setActiveView, setSelectedCategory } = useApp();
  const system = getSystemStatus(state);
  const activeView = state.ui.activeView;
  const selectedCategory = state.ui.selectedCategory;

  const handleNav = (item) => {
    if (item.category) setSelectedCategory(item.category);
    setActiveView(item.view);
    onNavigate?.();
  };

  const isActive = (item) => {
    if (item.id === 'assistant') return activeView === 'assistant';
    return activeView === 'dashboard' && selectedCategory === item.category;
  };

  return (
    <div className="flex h-full flex-col">
      {/* Brand */}
      <div className="flex items-center gap-3 border-b border-slate-200/70 px-4 py-5 dark:border-slate-800/70">
        <motion.div
          whileHover={{ rotate: 8, scale: 1.05 }}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 via-blue-600 to-violet-600 text-white shadow-lg shadow-indigo-200 dark:shadow-glow-dark"
          aria-hidden="true"
        >
          <Icon name="graduation-cap" size={20} />
        </motion.div>
        <div className="min-w-0">
          <p className="truncate font-display text-sm font-extrabold text-slate-800 dark:text-slate-100">
            Campus Hub
          </p>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Sentinel-Sync
          </p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="scrollbar-thin flex-1 overflow-y-auto px-3 py-3" aria-label="Primary">
        {NAV_GROUPS.map((group) => (
          <div key={group.label} className="mb-2">
            <p className="px-3 pb-1.5 pt-3 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              {group.label}
            </p>
            <ul className="flex flex-col gap-0.5">
              {group.items.map((item) => {
                const active = isActive(item);
                return (
                  <li key={item.id}>
                    <button
                      onClick={() => handleNav(item)}
                      aria-current={active ? 'page' : undefined}
                      className={`group relative flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                        active
                          ? 'bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow dark:shadow-glow-dark'
                          : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
                      }`}
                    >
                      {active && (
                        <motion.span
                          layoutId={`${idPrefix}-sidebar-active`}
                          className="absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-white"
                          transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                          aria-hidden="true"
                        />
                      )}
                      <Icon name={item.icon} size={16} className={active ? '' : 'text-slate-400 group-hover:text-slate-600 dark:text-slate-500 dark:group-hover:text-slate-300'} />
                      <span className="truncate">{item.label}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* System status */}
      <div className="border-t border-slate-200/70 p-4 dark:border-slate-800/70">
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-2">
            <motion.span
              className={`h-2 w-2 rounded-full ${system.isHealthy ? 'bg-green-500' : 'bg-amber-500'}`}
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ repeat: Infinity, duration: 1.6 }}
              aria-hidden="true"
            />
            <p className="text-xs font-bold text-slate-700 dark:text-slate-200">
              {system.isHealthy ? 'All systems live' : 'System degraded'}
            </p>
          </div>
          <p className="mt-1 text-[10px] text-slate-400 dark:text-slate-500">
            Auto-refresh every {state.preferences.refreshInterval}s
          </p>
        </div>
      </div>
    </div>
  );
};

export default function Sidebar({ open, onClose }) {
  return (
    <>
      {/* Desktop fixed sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 border-r border-slate-200/70 bg-white/85 backdrop-blur-xl lg:block dark:border-slate-800/70 dark:bg-slate-950/85">
        <SidebarContent idPrefix="desktop" />
      </aside>

      {/* Mobile slide-in drawer */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm lg:hidden"
              aria-hidden="true"
            />
            <motion.aside
              initial={{ x: -288 }}
              animate={{ x: 0 }}
              exit={{ x: -288 }}
              transition={{ type: 'spring', stiffness: 320, damping: 32 }}
              className="fixed inset-y-0 left-0 z-50 w-72 border-r border-slate-200/70 bg-white shadow-2xl lg:hidden dark:border-slate-800/70 dark:bg-slate-950"
              role="dialog"
              aria-modal="true"
              aria-label="Sidebar navigation"
            >
              <SidebarContent idPrefix="mobile" onNavigate={onClose} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
