/**
 * AIAssistant.jsx - Campus AI Assistant Panel (Modern UI)
 * EXTERNAL STATIC - Conversational split-screen panel featuring:
 *  - FAQ bot input field with keyword matching (FST section 4.1)
 *  - Framer Motion chat bubbles, typing indicator, suggestion chips
 *  - Mock real-time UI toast notification indicators (live event feed)
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '../context/AppContext.jsx';
import { ChatBotLogic, ValidationLogic, ToastLogic, FormattingLogic } from '../logic/index.js';
import Icon from './Icon.jsx';

const SUGGESTIONS = [
  'How do I check out equipment?',
  'What are the library hours?',
  'Are there vegetarian options at the cafe?',
  'How do I get to the downtown campus?',
];

const bubbleVariants = {
  hidden: { opacity: 0, y: 16, scale: 0.94 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: 'spring', stiffness: 320, damping: 24 },
  },
  exit: { opacity: 0, scale: 0.9, transition: { duration: 0.15 } },
};

const ChatBubble = ({ message }) => {
  const isUser = message.sender === 'user';
  const isSystem = message.sender === 'system';
  return (
    <motion.div
      variants={bubbleVariants}
      initial="hidden"
      animate="show"
      exit="exit"
      layout
      className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'}`}
      aria-label={isUser ? 'Your message' : 'Assistant message'}
    >
      <div
        className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed shadow-sm sm:max-w-[78%] lg:max-w-[70%] ${
          isSystem
            ? 'rounded bg-slate-100 text-center text-xs font-semibold text-slate-500 dark:bg-slate-800 dark:text-slate-400'
            : isUser
            ? 'rounded-br-sm bg-gradient-to-br from-indigo-600 to-blue-600 text-white shadow-lg shadow-indigo-200 dark:shadow-glow-dark'
            : 'rounded-bl-sm bg-white text-slate-700 ring-1 ring-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:ring-slate-700'
        }`}
      >
        <p className="whitespace-pre-wrap break-words">{message.text}</p>
        <p
          className={`mt-1 text-[10px] ${isUser ? 'text-indigo-200' : 'text-slate-400 dark:text-slate-500'}`}
          aria-hidden="true"
        >
          {FormattingLogic.formatDate(message.timestamp, 'time')}
        </p>
      </div>
    </motion.div>
  );
};

const TypingIndicator = () => (
  <motion.div
    variants={bubbleVariants}
    initial="hidden"
    animate="show"
    exit="exit"
    className="flex w-full justify-start"
    aria-label="Assistant is typing"
  >
    <div className="flex items-center gap-1 rounded-2xl rounded-bl-sm bg-white px-4 py-3 ring-1 ring-slate-200 dark:bg-slate-800 dark:ring-slate-700">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="h-2 w-2 rounded-full bg-indigo-400"
          animate={{ y: [0, -5, 0], opacity: [0.4, 1, 0.4] }}
          transition={{ repeat: Infinity, duration: 0.9, delay: i * 0.15 }}
          aria-hidden="true"
        />
      ))}
    </div>
  </motion.div>
);

const ToastIndicator = ({ toast }) => {
  const color = ToastLogic.getToastColor(toast.type);
  const icon = ToastLogic.getToastIcon(toast.type);
  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 24 }}
      className={`flex items-start gap-2 rounded-lg border-l-4 ${color} px-3 py-2 text-xs shadow-sm`}
      role="status"
    >
      <span aria-hidden="true" className="mt-0.5">
        <Icon name={icon} size={14} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate font-bold">{toast.title}</p>
        <p className="truncate text-[11px] opacity-80">{toast.message}</p>
      </div>
      <span className="text-[10px] tabular-nums opacity-60">
        {FormattingLogic.formatDate(toast.timestamp, 'time')}
      </span>
    </motion.div>
  );
};

export default function AIAssistant() {
  const {
    state,
    setChatInput,
    setChatFocus,
    clearChatHistory,
    clearUnread,
    handleSendMessage,
    simulateToast,
    addToast,
    dismissToast,
  } = useApp();

  const { chat, preferences } = state;
  const [showFeed, setShowFeed] = useState(false);
  const [showError, setShowError] = useState(false);
  const scrollRef = useRef(null);
  const inputRef = useRef(null);

  const messages = useMemo(() => chat.messages, [chat.messages]);
  const inputValue = chat.inputValue;
  const validation = useMemo(() => ValidationLogic.validateChatInput(inputValue), [inputValue]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages.length, chat.isTyping]);

  const demoToast = () => {
    const [event] = ToastLogic.generateMockEvents(1);
    addToast(ToastLogic.createToast(event.type, event.title, event.message));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (chat.isTyping) return;
    if (!validation.isValid) {
      setShowError(true);
      return;
    }
    setShowError(false);
    handleSendMessage(inputValue);
  };

  const submitSuggestion = (text) => {
    inputRef.current?.focus();
    handleSendMessage(text);
  };

  const maxChars = 500;

  return (
    <motion.section
      initial={{ opacity: 0, x: 30 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.45, ease: 'easeOut' }}
      aria-label="AI Campus Assistant"
      className="flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white/80 shadow-card backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/80"
    >
      {/* Panel header */}
      <header className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center gap-3">
          <motion.div
            initial={{ rotate: -20, scale: 0.6 }}
            animate={{ rotate: 0, scale: 1 }}
            transition={{ type: 'spring', stiffness: 260, damping: 16 }}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-blue-600 text-white shadow-lg shadow-indigo-200 dark:shadow-glow-dark"
            aria-hidden="true"
          >
            <Icon name="bot" size={20} />
          </motion.div>
          <div>
            <h2 className="font-display text-sm font-extrabold text-slate-800 dark:text-slate-100">AI Campus Assistant</h2>
            <p className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
              <motion.span
                className="h-2 w-2 rounded-full bg-green-500"
                animate={{ opacity: [1, 0.3, 1] }}
                transition={{ repeat: Infinity, duration: 1.8 }}
                aria-hidden="true"
              />
              Online · FAQ knowledge base
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => {
              setShowFeed((v) => !v);
              clearUnread();
            }}
            className={`relative rounded-lg p-2 text-sm transition focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
              showFeed
                ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-300'
                : 'text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
            }`}
            aria-label="Toggle live notification feed"
            title="Live notifications"
          >
            <Icon name="bell" size={18} />
            <AnimatePresence>
              {chat.unreadCount > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white"
                >
                  {chat.unreadCount}
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={clearChatHistory}
            className="rounded-lg p-2 text-sm text-slate-500 transition hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-slate-400 dark:hover:bg-slate-800"
            aria-label="Clear chat history"
            title="Clear conversation"
          >
            <Icon name="trash" size={18} />
          </motion.button>
        </div>
      </header>

      {/* Live notification indicator feed */}
      <AnimatePresence>
        {showFeed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-b border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900"
          >
            <div className="flex max-h-44 flex-col gap-2 overflow-y-auto p-3" role="log" aria-label="Live notification feed">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Live notification indicators
                </p>
                <motion.button
                  whileTap={{ scale: 0.94 }}
                  onClick={demoToast}
                  className="inline-flex items-center gap-1 rounded-lg bg-indigo-600 px-2 py-1 text-[11px] font-bold text-white shadow hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <Icon name="zap" size={12} /> Simulate event
                </motion.button>
              </div>
              {state.toasts.activeToasts.length === 0 && state.toasts.queue.length === 0 ? (
                <p className="py-2 text-center text-xs text-slate-400 dark:text-slate-500">
                  No active notifications. Simulate an event to test placement.
                </p>
              ) : (
                <AnimatePresence initial={false}>
                  {state.toasts.activeToasts.map((toast) => (
                    <div key={toast.id} className="flex items-start gap-2">
                      <ToastIndicator toast={toast} />
                      <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={() => dismissToast(toast.id)}
                        className="mt-0.5 text-[10px] text-slate-400 hover:text-slate-600 focus:outline-none dark:hover:text-slate-200"
                        aria-label={`Dismiss ${toast.title}`}
                      >
                        <Icon name="x" size={14} />
                      </motion.button>
                    </div>
                  ))}
                </AnimatePresence>
              )}
              {state.toasts.queue.length > 0 && (
                <p className="text-center text-[10px] font-semibold text-slate-400 dark:text-slate-500">
                  +{state.toasts.queue.length} queued (max {state.toasts.maxActive} visible)
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat container */}
      <div
        ref={scrollRef}
        className="flex-1 space-y-3 overflow-y-auto px-3 py-4"
        aria-live="polite"
      >
        <AnimatePresence initial={false}>
          {messages.map((message) => (
            <ChatBubble key={message.id} message={message} />
          ))}
          {chat.isTyping && <TypingIndicator key="typing" />}
        </AnimatePresence>
        <AnimatePresence initial={false}>
          {chat.suggestions && chat.suggestions.length > 0 && !chat.isTyping && (
            <motion.div
              key="dynamic-suggestions"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.2 }}
              className="flex flex-wrap gap-1.5 pl-0.5"
            >
              {chat.suggestions.map((suggestion) => (
                <motion.button
                  key={suggestion}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.94 }}
                  onClick={() => submitSuggestion(suggestion)}
                  disabled={chat.isTyping}
                  className="inline-flex items-center gap-1 rounded-full border border-indigo-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-indigo-600 shadow-sm transition hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-50 dark:border-indigo-500/40 dark:bg-slate-800 dark:text-indigo-300 dark:hover:bg-indigo-500/20"
                >
                  <Icon name="sparkles" size={11} />
                  {suggestion}
                </motion.button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Suggestions */}
      <div className="border-t border-slate-200 bg-white px-3 py-2 dark:border-slate-800 dark:bg-slate-900">
        <p className="mb-1.5 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500">
          Quick questions
        </p>
        <div className="flex flex-wrap gap-1.5">
          {SUGGESTIONS.map((suggestion) => (
            <motion.button
              key={suggestion}
              whileTap={{ scale: 0.94 }}
              onClick={() => submitSuggestion(suggestion)}
              disabled={chat.isTyping}
              className="rounded-full border border-indigo-200 bg-indigo-50 px-2.5 py-1 text-[11px] font-semibold text-indigo-700 transition hover:bg-indigo-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-50 dark:border-indigo-500/40 dark:bg-indigo-500/10 dark:text-indigo-300 dark:hover:bg-indigo-500/20"
            >
              {suggestion}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Input area */}
      <form onSubmit={handleSubmit} className="border-t border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-end gap-2">
          <label className="relative flex-1">
            <span className="sr-only">Ask the Campus Assistant</span>
            <textarea
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setChatInput(e.target.value)}
              onFocus={() => {
                setChatFocus(true);
                clearUnread();
              }}
              onBlur={() => setChatFocus(false)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
              rows={1}
              maxLength={maxChars}
              placeholder="Ask about equipment, dining, transit..."
              className="max-h-32 w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-700 placeholder-slate-400 shadow-inner focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:placeholder-slate-500 dark:focus:bg-slate-800 dark:focus:border-indigo-400"
              aria-invalid={!validation.isValid && inputValue.length > 0}
            />
          </label>
          <motion.button
            type="submit"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.9 }}
            disabled={!validation.isValid || chat.isTyping}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-blue-600 text-white shadow-lg shadow-indigo-200 transition hover:from-indigo-700 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-40 dark:shadow-glow-dark"
            aria-label="Send message"
          >
            {chat.isTyping ? (
              <motion.span
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 0.9, ease: 'linear' }}
                className="flex items-center justify-center"
                aria-hidden="true"
              >
                <Icon name="loader" size={18} />
              </motion.span>
            ) : (
              <Icon name="send-up" size={18} />
            )}
          </motion.button>
        </div>
        <div className="mt-1.5 flex items-center justify-between px-1 text-[10px] text-slate-400 dark:text-slate-500">
          <span>
            {showError && validation.errors.length > 0 ? (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="font-bold text-red-500"
              >
                {validation.errors[0]}
              </motion.span>
            ) : (
              <>
                Press <kbd className="rounded bg-slate-100 px-1 dark:bg-slate-700 dark:text-slate-300">Enter</kbd> to send ·{' '}
                {preferences.toastDuration / 1000}s toast auto-dismiss
              </>
            )}
          </span>
          <span className={`tabular-nums ${inputValue.length >= maxChars ? 'font-bold text-red-500' : ''}`}>
            {inputValue.length}/{maxChars}
          </span>
        </div>
      </form>
    </motion.section>
  );
}
