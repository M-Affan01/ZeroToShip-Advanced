/**
 * Header.jsx - Top header: brand, live status, auto-refresh & preferences toggles.
 * Framer Motion entrance animations + glassmorphism. Light/Dark theme aware.
 * Includes a settings modal for preferences (toast duration, compact mode, animations).
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '../context/AppContext.jsx';
import { getSystemStatus } from '../selectors.js';
import { FormattingLogic } from '../logic/index.js';
import Icon from './Icon.jsx';

const SettingToggle = ({ label, description, icon, active, onClick }) => (
  <button
    onClick={onClick}
    aria-pressed={active}
    className="flex w-full items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 text-left transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800"
  >
    <span
      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
        active
          ? 'bg-indigo-600 text-white'
          : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
      }`}
      aria-hidden="true"
    >
      <Icon name={icon} size={16} />
    </span>
    <span className="min-w-0 flex-1">
      <span className="block text-sm font-bold text-slate-800 dark:text-slate-100">{label}</span>
      <span className="block truncate text-xs text-slate-500 dark:text-slate-400">{description}</span>
    </span>
    <span
      className={`relative h-5 w-9 shrink-0 rounded-full transition-colors ${
        active ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-700'
      }`}
      aria-hidden="true"
    >
      <span
        className={`absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${
          active ? 'translate-x-4' : 'translate-x-0'
        }`}
      />
    </span>
  </button>
);

export default function Header({ onMenuClick }) {
  const {
    state,
    toggleTheme,
    toggleAutoRefresh,
    toggleCompact,
    toggleAnimations,
    setRefreshInterval,
    setToastDuration,
    resetPreferences,
  } = useApp();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const system = getSystemStatus(state);
  const isDark = state.preferences.theme === 'dark';
  const prefs = state.preferences;

  return (
    <motion.header
      initial={{ y: -24, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 200, damping: 22 }}
      className="sticky top-0 z-30 border-b border-slate-200/70 bg-white/70 backdrop-blur-xl dark:border-slate-800/70 dark:bg-slate-950/70"
    >
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 md:px-6">
        <div className="flex items-center gap-3">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={onMenuClick}
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-600 transition hover:bg-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 lg:hidden dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
            aria-label="Open sidebar navigation"
          >
            <Icon name="menu" size={18} />
          </motion.button>
          <motion.div
            whileHover={{ rotate: 8, scale: 1.08 }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 300, damping: 12 }}
            className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 via-blue-600 to-violet-600 text-white shadow-lg shadow-indigo-200 dark:shadow-glow-dark"
            aria-hidden="true"
          >
            <Icon name="graduation-cap" size={24} />
          </motion.div>
          <div>
            <h1 className="bg-gradient-to-r from-indigo-600 via-blue-600 to-violet-600 bg-clip-text font-display text-base font-extrabold tracking-tight text-transparent md:text-lg">
              Campus Hub Dashboard
            </h1>
            <p className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
              <motion.span
                className={`h-2 w-2 rounded-full ${system.isHealthy ? 'bg-green-500' : 'bg-amber-500'}`}
                animate={{ opacity: [1, 0.3, 1], scale: [1, 0.8, 1] }}
                transition={{ repeat: Infinity, duration: 1.6 }}
                aria-hidden="true"
              />
              <span className="font-bold">{system.isHealthy ? 'Live' : 'Degraded'}</span>
              <span className="text-slate-300 dark:text-slate-600" aria-hidden="true">
                ·
              </span>
              <span>Updated {FormattingLogic.formatDate(state.ui.lastUpdated, 'relative')}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <motion.button
            whileTap={{ scale: 0.94 }}
            onClick={toggleAutoRefresh}
            className={`inline-flex h-9 items-center gap-1.5 rounded-lg px-3 font-bold transition focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
              prefs.autoRefresh
                ? 'bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow dark:shadow-glow-dark'
                : 'bg-slate-100 text-slate-500 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700'
            }`}
            aria-pressed={prefs.autoRefresh}
            title="Toggle simulated live polling"
          >
            <Icon name={prefs.autoRefresh ? 'refresh' : 'pause'} size={14} />
            {prefs.autoRefresh ? 'Auto-refresh' : 'Paused'}
          </motion.button>

          {/* Settings button */}
          <motion.button
            whileTap={{ scale: 0.94 }}
            whileHover={{ scale: 1.06 }}
            onClick={() => setSettingsOpen((v) => !v)}
            className={`relative flex h-9 w-9 items-center justify-center rounded-xl transition focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
              settingsOpen
                ? 'bg-indigo-600 text-white shadow dark:shadow-glow-dark'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
            }`}
            aria-label="Open preferences"
            aria-expanded={settingsOpen}
            title="Preferences"
          >
            <Icon name="settings" size={17} />
            {(prefs.compactMode || !prefs.showAnimations) && (
              <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-amber-500 ring-2 ring-white dark:ring-slate-950" aria-hidden="true" />
            )}
          </motion.button>

          {/* Theme toggle */}
          <motion.button
            whileTap={{ scale: 0.94 }}
            whileHover={{ scale: 1.06 }}
            onClick={toggleTheme}
            className="relative flex h-9 w-16 items-center rounded-full bg-slate-200 p-1 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-slate-800"
            role="switch"
            aria-checked={isDark}
            aria-label={`Switch to ${isDark ? 'light' : 'dark'} theme`}
            title="Toggle light / dark theme"
          >
            <motion.span
              layout
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              className={`flex h-7 w-7 items-center justify-center rounded-full text-sm shadow-md ${
                isDark
                  ? 'ml-auto bg-gradient-to-br from-indigo-500 to-violet-600'
                  : 'bg-gradient-to-br from-amber-300 to-orange-400'
              }`}
            >
              <AnimatePresence mode="wait" initial={false}>
                <motion.span
                  key={isDark ? 'dark' : 'light'}
                  initial={{ rotate: -90, opacity: 0, scale: 0.6 }}
                  animate={{ rotate: 0, opacity: 1, scale: 1 }}
                  exit={{ rotate: 90, opacity: 0, scale: 0.6 }}
                  transition={{ duration: 0.18 }}
                  className="leading-none"
                >
                  <Icon name={isDark ? 'moon' : 'sun'} size={14} />
                </motion.span>
              </AnimatePresence>
            </motion.span>
          </motion.button>
        </div>
      </div>

      {/* Settings modal */}
      <AnimatePresence>
        {settingsOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-start justify-center bg-slate-900/40 p-4 pt-16 backdrop-blur-sm"
            onClick={() => setSettingsOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -16 }}
              transition={{ type: 'spring', stiffness: 320, damping: 28 }}
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-modal="true"
              aria-label="Preferences"
              className="w-full max-w-lg overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900"
            >
              <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 dark:border-slate-700">
                <div>
                  <h2 className="font-display text-base font-extrabold text-slate-800 dark:text-slate-100">
                    Preferences
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Tune the dashboard experience
                  </p>
                </div>
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setSettingsOpen(false)}
                  className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                  aria-label="Close preferences"
                >
                  <Icon name="x" size={18} />
                </motion.button>
              </div>

              <div className="scrollbar-thin max-h-[65vh] space-y-4 overflow-y-auto p-5">
                <div className="flex flex-col gap-2">
                  <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    Behavior
                  </p>
                  <SettingToggle
                    label="Compact mode"
                    description="Tighter spacing across cards"
                    icon="layout-grid"
                    active={prefs.compactMode}
                    onClick={toggleCompact}
                  />
                  <SettingToggle
                    label="Animations"
                    description="Framer Motion entrance effects"
                    icon="sparkles"
                    active={prefs.showAnimations}
                    onClick={toggleAnimations}
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    Refresh & notifications
                  </p>
                  <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-900">
                    <div className="flex items-center gap-3">
                      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400" aria-hidden="true">
                        <Icon name="refresh" size={16} />
                      </span>
                      <div>
                        <p className="text-sm font-bold text-slate-800 dark:text-slate-100">Refresh interval</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Simulated polling frequency</p>
                      </div>
                    </div>
                    <select
                      value={prefs.refreshInterval}
                      onChange={(e) => setRefreshInterval(Number(e.target.value))}
                      className="cursor-pointer rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5 text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200"
                      aria-label="Refresh interval"
                    >
                      {[15, 30, 45, 60].map((sec) => (
                        <option key={sec} value={sec}>
                          {sec}s
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-900">
                    <div className="flex items-center gap-3">
                      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400" aria-hidden="true">
                        <Icon name="clock" size={16} />
                      </span>
                      <div>
                        <p className="text-sm font-bold text-slate-800 dark:text-slate-100">Toast duration</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Auto-dismiss after</p>
                      </div>
                    </div>
                    <select
                      value={prefs.toastDuration}
                      onChange={(e) => setToastDuration(Number(e.target.value))}
                      className="cursor-pointer rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5 text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200"
                      aria-label="Toast duration"
                    >
                      {[2000, 4000, 6000, 10000].map((ms) => (
                        <option key={ms} value={ms}>
                          {ms / 1000}s
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <button
                  onClick={resetPreferences}
                  className="w-full rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-xs font-bold text-rose-600 transition hover:bg-rose-100 focus:outline-none focus:ring-2 focus:ring-rose-500 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-400 dark:hover:bg-rose-500/20"
                >
                  Reset all preferences to defaults
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
