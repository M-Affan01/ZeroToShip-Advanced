/**
 * CardDetailModal.jsx - Detail view for the active marketplace card (EV-007).
 * Framer Motion powered animated modal dialog.
 */

import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '../context/AppContext.jsx';
import Icon from './Icon.jsx';
import {
  EquipmentLogic,
  CafeLogic,
  TransitLogic,
  StatusLogic,
  FormattingLogic,
} from '../logic/index.js';

const findItem = (state, id) => {
  if (!id) return null;
  const { equipment, cafe, transit } = state.data;
  return (
    equipment.find((item) => item.id === id) ||
    cafe.find((item) => item.id === id) ||
    transit.find((item) => item.id === id) ||
    null
  );
};

const DetailRow = ({ label, children }) => (
  <div className="flex items-start justify-between gap-4 border-b border-slate-100 py-2 text-sm last:border-0 dark:border-slate-700">
    <dt className="font-semibold text-slate-500 dark:text-slate-400">{label}</dt>
    <dd className="text-right text-slate-800 dark:text-slate-200">{children}</dd>
  </div>
);

export default function CardDetailModal() {
  const { state, toggleCardModal, setActiveCard } = useApp();
  const item = useMemo(() => findItem(state, state.ui.activeCardId), [state]);

  if (!item) return null;

  const close = () => {
    setActiveCard(null);
    toggleCardModal();
  };

  let body = null;
  let categoryLabel = '';

  if ('status' in item) {
    const status = StatusLogic.getEquipmentStatusInfo(item.status);
    categoryLabel = FormattingLogic.formatEquipmentCategory(item.category);
    body = (
      <>
        <DetailRow label="Category">{categoryLabel}</DetailRow>
        <DetailRow label="Status">
          <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-bold ${status.color}`}>
            <Icon name={status.icon} size={13} /> {status.label}
          </span>
        </DetailRow>
        <DetailRow label="Location">{FormattingLogic.formatLocation(item.location)}</DetailRow>
        <DetailRow label="Last updated">
          {FormattingLogic.formatDate(item.lastUpdated, 'full')}
        </DetailRow>
      </>
    );
  } else if ('price' in item) {
    const availability = StatusLogic.getAvailabilityStatusInfo(item.available);
    categoryLabel = FormattingLogic.formatCafeCategory(item.category);
    body = (
      <>
        <DetailRow label="Category">{categoryLabel}</DetailRow>
        <DetailRow label="Price">
          <span className="font-display text-lg font-extrabold text-emerald-700 dark:text-emerald-400">
            {CafeLogic.formatPrice(item.price)}
          </span>
        </DetailRow>
        <DetailRow label="Description">{item.description}</DetailRow>
        <DetailRow label="Availability">
          <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-bold ${availability.color}`}>
            <Icon name={availability.icon} size={13} /> {availability.label}
          </span>
        </DetailRow>
        <DetailRow label="Dietary">
          {item.dietary.length > 0 ? CafeLogic.getDietaryBadges(item.dietary).join(', ') : 'None'}
        </DetailRow>
      </>
    );
  } else {
    const delay = StatusLogic.getDelayStatusInfo(item.delay);
    const capacity = StatusLogic.getCapacityStatusInfo(item.capacity);
    categoryLabel = FormattingLogic.formatTransitType(item.type);
    body = (
      <>
        <DetailRow label="Type">{categoryLabel}</DetailRow>
        <DetailRow label="Direction">{FormattingLogic.capitalizeWords(item.direction)}</DetailRow>
        <DetailRow label="Delay">
          <span className={`inline-flex items-center gap-1 font-bold ${delay.color}`}>
            <Icon name={delay.icon} size={14} /> {delay.label}
          </span>
        </DetailRow>
        <DetailRow label="Capacity">
          <span className={`inline-flex items-center gap-1 font-bold ${capacity.color}`}>
            <Icon name={capacity.icon} size={13} fill="currentColor" /> {item.capacity}%
          </span>
        </DetailRow>
        <DetailRow label="Route">{item.route.join(' → ')}</DetailRow>
        {item.alerts && item.alerts.length > 0 && (
          <DetailRow label="Alerts">
            <span className="font-bold text-amber-600">{item.alerts[0]}</span>
          </DetailRow>
        )}
      </>
    );
  }

  return (
    <AnimatePresence>
      {state.ui.isCardModalOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm"
          onClick={close}
          role="presentation"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 16 }}
            transition={{ type: 'spring', stiffness: 300, damping: 26 }}
            className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-slate-900 dark:shadow-glow-dark"
            role="dialog"
            aria-modal="true"
            aria-labelledby="detail-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative h-44 bg-slate-100 dark:bg-slate-800">
              {typeof item.imageUrl === 'string' && item.imageUrl.startsWith('data:') ? (
                <img src={item.imageUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                <img
                  src={item.imageUrl}
                  alt=""
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.nextElementSibling?.classList.remove('hidden');
                  }}
                  className="h-full w-full object-cover"
                />
              )}
              <div className="hidden h-full w-full items-center justify-center bg-gradient-to-br from-indigo-500 to-blue-600 text-6xl text-white">
                {categoryLabel.split(' ')[0]}
              </div>
              <button
                onClick={close}
                className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-black/50 text-white transition hover:bg-black/70 focus:outline-none focus:ring-2 focus:ring-white"
                aria-label="Close detail view"
              >
                <Icon name="x" size={16} />
              </button>
              <span className="absolute left-3 top-3 rounded-lg bg-black/60 px-2 py-1 text-[11px] font-bold text-white backdrop-blur-sm">
                {categoryLabel}
              </span>
            </div>
            <div className="p-5">
              <h2 id="detail-title" className="mb-3 font-display text-lg font-extrabold text-slate-800 dark:text-slate-100">
                {item.name}
              </h2>
              <dl>{body}</dl>
              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                onClick={close}
                className="mt-4 w-full rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 py-2.5 text-sm font-bold text-white shadow-lg shadow-indigo-200 transition hover:from-indigo-700 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                Close
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
