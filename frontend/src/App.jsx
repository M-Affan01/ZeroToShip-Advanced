/**
 * App.jsx - Application shell (Real-world layout)
 * Fixed left sidebar navigation + top header + scrollable content area.
 * Dashboard view shows the gallery (chatbot available via floating button),
 * AI Assistant view is a dedicated full-width page.
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from './components/Sidebar.jsx';
import Header from './components/Header.jsx';
import Dashboard from './components/Dashboard.jsx';
import AIAssistant from './components/AIAssistant.jsx';
import ToastContainer from './components/ToastContainer.jsx';
import CardDetailModal from './components/CardDetailModal.jsx';
import ChatWidget from './components/ChatWidget.jsx';
import Icon from './components/Icon.jsx';
import { useApp } from './context/AppContext.jsx';

const AmbientBlob = ({ className, duration = 14, delay = 0 }) => (
  <motion.div
    aria-hidden="true"
    className={`pointer-events-none absolute rounded-full blur-3xl ${className}`}
    animate={{ x: [0, 40, -20, 0], y: [0, -30, 20, 0], scale: [1, 1.15, 0.95, 1] }}
    transition={{ repeat: Infinity, duration, delay, ease: 'easeInOut' }}
  />
);

const DashboardHero = () => (
  <motion.div
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.45, ease: 'easeOut' }}
    className="mb-4 flex items-center justify-between gap-4 rounded-2xl bg-gradient-to-r from-indigo-600 via-blue-600 to-violet-600 p-5 text-white shadow-lg shadow-indigo-200 md:p-6 dark:shadow-glow-dark"
  >
    <div className="flex items-center gap-4">
      <div
        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-sm"
        aria-hidden="true"
      >
        <Icon name="layout-grid" size={22} />
      </div>
      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-200">Campus Hub</p>
        <h1 className="font-display text-xl font-extrabold md:text-2xl">Live Campus Directory</h1>
        <p className="text-sm text-indigo-100">Equipment, dining &amp; transit — updated in real time</p>
      </div>
    </div>
  </motion.div>
);

const AssistantHero = () => (
  <motion.div
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.45, ease: 'easeOut' }}
    className="mb-4 flex items-center gap-3 rounded-2xl border border-slate-200/70 bg-white/70 p-4 shadow-card backdrop-blur-xl dark:border-slate-800/70 dark:bg-slate-950/60"
  >
    <div
      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 text-white shadow-lg dark:shadow-glow-dark"
      aria-hidden="true"
    >
      <Icon name="bot" size={22} />
    </div>
    <div>
      <h1 className="font-display text-lg font-extrabold text-slate-800 dark:text-slate-100">AI Campus Assistant</h1>
      <p className="text-sm text-slate-500 dark:text-slate-400">Instant answers about equipment, dining &amp; transit</p>
    </div>
  </motion.div>
);

export default function App() {
  const { state } = useApp();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const isAssistant = state.ui.activeView === 'assistant';

  return (
    <div className="relative min-h-screen overflow-x-hidden">
      {/* Ambient background */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <AmbientBlob className="left-[-10%] top-[-10%] h-96 w-96 bg-indigo-400/20 dark:bg-indigo-600/25" />
        <AmbientBlob className="right-[-8%] top-[20%] h-80 w-80 bg-sky-400/20 dark:bg-sky-600/25" duration={18} delay={2} />
        <AmbientBlob className="bottom-[-15%] left-[30%] h-96 w-96 bg-rose-400/15 dark:bg-rose-600/20" duration={16} delay={4} />
      </div>

      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>

      <div className="flex min-h-screen">
        {/* Left navigation sidebar */}
        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        {/* Main column */}
        <div className="flex min-w-0 flex-1 flex-col lg:pl-64">
          <Header onMenuClick={() => setSidebarOpen(true)} />

          <main id="main-content" className="mx-auto w-full max-w-7xl flex-1 px-4 py-5 md:px-6">
            <AnimatePresence mode="wait">
              {isAssistant ? (
                <motion.section
                  key="assistant-page"
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.35, ease: 'easeOut' }}
                  className="flex flex-col"
                >
                  <AssistantHero />
                  <div className="mx-auto flex min-h-[70vh] w-full max-w-4xl flex-col lg:h-[calc(100vh-13rem)]">
                    <AIAssistant />
                  </div>
                </motion.section>
              ) : (
                <motion.section
                  key="dashboard-page"
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.35, ease: 'easeOut' }}
                  className="flex flex-col"
                >
                  <DashboardHero />

                  <div className="flex flex-col">
                    {/* Dashboard gallery */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.45, ease: 'easeOut' }}
                      className="flex flex-col rounded-2xl border border-slate-200/70 bg-white/70 p-4 shadow-card backdrop-blur-xl md:p-5 dark:border-slate-800/70 dark:bg-slate-950/60 dark:shadow-glow-dark"
                    >
                      <Dashboard />
                    </motion.div>
                  </div>
                </motion.section>
              )}
            </AnimatePresence>
          </main>

          <footer className="border-t border-slate-200/70 py-4 text-center text-xs text-slate-400 dark:border-slate-800/70 dark:text-slate-500">
            Sentinel-Sync · Campus Hub Dashboard — Phase 4 static mock build · All data is simulated
          </footer>
        </div>
      </div>

      <CardDetailModal />
      <ToastContainer />
      <ChatWidget />
    </div>
  );
}
