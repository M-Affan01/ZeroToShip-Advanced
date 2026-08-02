/**
 * ToastContainer.jsx - Global toast notification overlay (Modern UI)
 * FST section 3.3: Top-right fixed overlay, 4 variants, Framer Motion
 * slide-in + exit, auto-dismiss, max 3 visible, queued overflow.
 */

import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '../context/AppContext.jsx';
import { ToastLogic } from '../logic/index.js';
import Icon from './Icon.jsx';

const BORDER_COLORS = {
  success: 'border-green-500',
  error: 'border-red-500',
  warning: 'border-yellow-500',
  info: 'border-blue-500',
};

const PROGRESS_COLORS = {
  success: 'bg-green-500',
  error: 'bg-red-500',
  warning: 'bg-yellow-500',
  info: 'bg-blue-500',
};

const ToastItem = ({ toast, duration, onDismiss }) => {
  const contentColor = ToastLogic.getToastColor(toast.type);
  const icon = ToastLogic.getToastIcon(toast.type);
  const borderColor = BORDER_COLORS[toast.type] || 'border-slate-500';
  const progressColor = PROGRESS_COLORS[toast.type] || 'bg-slate-500';

  return (
    <motion.div
      layout
      role="status"
      aria-live="polite"
      initial={{ opacity: 0, x: 60, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 60, scale: 0.9 }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      className={`pointer-events-auto flex w-full max-w-xs items-start gap-2 overflow-hidden rounded-xl border-l-4 ${borderColor} bg-white/95 shadow-card ring-1 ring-slate-200 backdrop-blur-sm dark:bg-slate-900/95 dark:ring-slate-700`}
    >
      <div className={`w-full p-3 ${contentColor}`}>
        <div className="flex items-start gap-2">
          <motion.span
            aria-hidden="true"
            className="mt-0.5"
            animate={{ rotate: [0, 12, -12, 0] }}
            transition={{ duration: 0.6 }}
          >
            <Icon name={icon} size={18} />
          </motion.span>
          <div className="min-w-0 flex-1">
            <p className="font-display text-sm font-bold dark:text-slate-100">{toast.title}</p>
            <p className="text-xs opacity-80">{toast.message}</p>
          </div>
          <button
            onClick={onDismiss}
            className="rounded p-0.5 text-xs opacity-60 transition hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-slate-400"
            aria-label={`Dismiss notification: ${toast.title}`}
          >
            <Icon name="x" size={14} />
          </button>
        </div>
        <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
          <motion.div
            className={`h-full rounded-full ${progressColor}`}
            initial={{ width: '100%' }}
            animate={{ width: '0%' }}
            transition={{ duration: Math.max(duration, 500) / 1000, ease: 'linear' }}
          />
        </div>
      </div>
    </motion.div>
  );
};

export default function ToastContainer() {
  const { state, dismissToast, pauseToasts, resumeToasts, clearAllToasts } = useApp();
  const { activeToasts, queue, isPaused } = state.toasts;
  const duration = state.preferences.toastDuration;

  const activeIds = activeToasts.map((t) => t.id).join(',');

  useEffect(() => {
    if (isPaused) return;
    const timers = activeToasts.map((toast) =>
      setTimeout(() => dismissToast(toast.id), toast.duration || duration)
    );
    return () => timers.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeIds, duration, isPaused]);

  if (activeToasts.length === 0) return null;

  return (
    <div
      className="pointer-events-none fixed left-1/2 top-3 z-50 flex w-full max-w-sm -translate-x-1/2 flex-col items-center gap-2 px-4 sm:left-auto sm:right-4 sm:translate-x-0 sm:items-end"
      aria-label="Notifications"
    >
      <div className="pointer-events-auto flex items-center gap-1.5">
        <motion.button
          whileTap={{ scale: 0.92 }}
          onClick={() => (isPaused ? resumeToasts() : pauseToasts())}
          className={`flex h-7 w-7 items-center justify-center rounded-lg shadow-card transition-colors focus:outline-none focus:ring-2 focus:ring-slate-400 ${
            isPaused
              ? 'bg-amber-500 text-white hover:bg-amber-600'
              : 'bg-slate-800/80 text-white backdrop-blur-sm hover:bg-slate-700'
          }`}
          aria-label={isPaused ? 'Resume notifications' : 'Pause notifications'}
          title={isPaused ? 'Resume notifications' : 'Pause notifications'}
        >
          {isPaused ? <Icon name="zap" size={13} /> : <Icon name="pause" size={13} />}
        </motion.button>
        <motion.button
          whileTap={{ scale: 0.92 }}
          onClick={clearAllToasts}
          className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-800/80 text-white shadow-card backdrop-blur-sm transition-colors hover:bg-rose-600 focus:outline-none focus:ring-2 focus:ring-slate-400"
          aria-label="Clear all notifications"
          title="Clear all"
        >
          <Icon name="trash" size={13} />
        </motion.button>
      </div>
      <AnimatePresence>
        {isPaused && (
          <motion.p
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="pointer-events-none rounded-full bg-amber-500/90 px-2.5 py-0.5 text-[10px] font-bold text-white shadow"
          >
            Notifications paused
          </motion.p>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {activeToasts.map((toast) => (
          <ToastItem
            key={toast.id}
            toast={toast}
            duration={toast.duration || duration}
            onDismiss={() => dismissToast(toast.id)}
          />
        ))}
      </AnimatePresence>
      <AnimatePresence>
        {queue.length > 0 && (
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="pointer-events-none rounded-full bg-slate-800/80 px-3 py-1 text-[10px] font-bold text-white backdrop-blur-sm"
          >
            +{queue.length} notification{queue.length > 1 ? 's' : ''} queued
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}
