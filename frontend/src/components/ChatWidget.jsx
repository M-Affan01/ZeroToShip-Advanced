/**
 * ChatWidget.jsx - Floating chat button (FAB) that opens/closes the AI Assistant.
 * Always available bottom-right; the panel reuses the shared AIAssistant chat state.
 */

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '../context/AppContext.jsx';
import Icon from './Icon.jsx';
import AIAssistant from './AIAssistant.jsx';

export default function ChatWidget() {
  const { state } = useApp();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <>
      {/* Chat panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.92 }}
            transition={{ type: 'spring', stiffness: 320, damping: 28 }}
            style={{ transformOrigin: 'bottom right' }}
            className="fixed bottom-24 right-4 z-40 flex h-[min(72vh,34rem)] w-[calc(100vw-2rem)] max-w-sm flex-col sm:bottom-28 sm:right-6"
            role="region"
            aria-label="AI Assistant chat"
          >
            <AIAssistant />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating action button */}
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 18, delay: 0.2 }}
        whileTap={{ scale: 0.9 }}
        whileHover={{ scale: 1.06 }}
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label={open ? 'Close AI Assistant' : 'Open AI Assistant'}
        title={open ? 'Close chat' : 'Chat with AI Assistant'}
        className="fixed bottom-4 right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-indigo-600 via-blue-600 to-violet-600 text-white shadow-xl shadow-indigo-300/50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:bottom-6 sm:right-6 dark:shadow-glow-dark dark:focus:ring-offset-slate-950"
      >
        {!open && (
          <motion.span
            className="absolute inset-0 rounded-full bg-indigo-500/40"
            animate={{ scale: [1, 1.35, 1], opacity: [0.6, 0, 0.6] }}
            transition={{ repeat: Infinity, duration: 2.2, ease: 'easeInOut' }}
            aria-hidden="true"
          />
        )}
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={open ? 'close' : 'chat'}
            initial={{ rotate: -90, opacity: 0, scale: 0.5 }}
            animate={{ rotate: 0, opacity: 1, scale: 1 }}
            exit={{ rotate: 90, opacity: 0, scale: 0.5 }}
            transition={{ duration: 0.16 }}
            className="relative flex items-center justify-center"
          >
            <Icon name={open ? 'x' : 'bot'} size={26} />
          </motion.span>
        </AnimatePresence>
        {!open && (
          <span
            className="absolute right-1 top-1 h-3 w-3 rounded-full border-2 border-white bg-green-500 dark:border-slate-950"
            aria-hidden="true"
          />
        )}
      </motion.button>
    </>
  );
}
