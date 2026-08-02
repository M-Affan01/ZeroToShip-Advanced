/**
 * Dashboard.jsx - Campus Hub Marketplace Gallery (Modern UI)
 * EXTERNAL STATIC - CSS Grid gallery rendering mock state cards for
 * equipment availability, cafe menus, and transit lines.
 * Framer Motion powered: staggered entrances, hover lifts, animated sections.
 */

import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '../context/AppContext.jsx';
import { getFilteredData } from '../selectors.js';
import Icon from './Icon.jsx';
import OverviewStats from './OverviewStats.jsx';
import {
  EquipmentLogic,
  CafeLogic,
  TransitLogic,
  StatusLogic,
  FormattingLogic,
  SortingLogic,
  FilterLogic,
} from '../logic/index.js';

const CATEGORIES = [
  { id: 'all', label: 'All', icon: 'layout-grid' },
  { id: 'equipment', label: 'Equipment', icon: 'laptop' },
  { id: 'cafe', label: 'Cafe', icon: 'coffee' },
  { id: 'transit', label: 'Transit', icon: 'bus' },
];

const CAPACITY_BAR_COLORS = {
  low: 'bg-green-500',
  medium: 'bg-yellow-500',
  high: 'bg-orange-500',
  full: 'bg-red-500',
};

const SORT_OPTIONS = {
  equipment: [
    { value: 'status', label: 'Status' },
    { value: 'name', label: 'Name' },
    { value: 'location', label: 'Location' },
  ],
  cafe: [
    { value: 'price', label: 'Price' },
    { value: 'name', label: 'Name' },
    { value: 'availability', label: 'Availability' },
  ],
  transit: [
    { value: 'delay', label: 'Delay' },
    { value: 'capacity', label: 'Capacity' },
    { value: 'name', label: 'Name' },
  ],
};

const EQUIPMENT_STATUS_OPTIONS = [
  { value: 'available', label: 'Available', icon: 'check-circle' },
  { value: 'in-use', label: 'In Use', icon: 'wrench' },
  { value: 'maintenance', label: 'Maintenance', icon: 'alert-triangle' },
  { value: 'reserved', label: 'Reserved', icon: 'pin' },
];

const CAFE_CATEGORY_OPTIONS = [
  { value: 'breakfast', label: 'Breakfast', icon: 'sunrise' },
  { value: 'lunch', label: 'Lunch', icon: 'utensils' },
  { value: 'beverage', label: 'Beverage', icon: 'coffee' },
  { value: 'snack', label: 'Snack', icon: 'popcorn' },
  { value: 'special', label: 'Special', icon: 'star' },
];

const TRANSIT_TYPE_OPTIONS = [
  { value: 'bus', label: 'Bus', icon: 'bus' },
  { value: 'train', label: 'Train', icon: 'train' },
  { value: 'shuttle', label: 'Shuttle', icon: 'shuttle' },
];

const DIETARY_OPTIONS = [
  { value: 'vegetarian', label: 'Vegetarian', icon: 'leaf' },
  { value: 'vegan', label: 'Vegan', icon: 'leaf' },
  { value: 'gluten-free', label: 'Gluten Free', icon: 'ban' },
];

/* Shared animation variants */
const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
};

const cardVariants = {
  hidden: { opacity: 0, y: 24, scale: 0.97 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: 'spring', stiffness: 260, damping: 22 },
  },
  exit: { opacity: 0, y: -12, scale: 0.97, transition: { duration: 0.18 } },
};

const sectionVariants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
  exit: { opacity: 0, y: -10, transition: { duration: 0.2 } },
};

/* ------------------------------------------------------------------ */
/* Card components                                                     */
/* ------------------------------------------------------------------ */

const StatusBadge = ({ className, icon, label }) => (
  <span
    className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-semibold ${className}`}
  >
    <Icon name={icon} size={13} />
    {label}
  </span>
);

const CardImage = ({ src, icon, gradient = 'from-indigo-500 to-blue-600' }) => {
  const [failed, setFailed] = useState(false);
  const show = typeof src === 'string' && src.length > 0 && !failed;
  return (
    <div className="absolute inset-0 h-full w-full overflow-hidden bg-slate-100">
      {show ? (
        <img
          src={src}
          alt=""
          loading="lazy"
          onError={() => setFailed(true)}
          className="h-full w-full object-cover transition duration-500 group-hover:scale-110"
        />
      ) : (
        <div
          className={`flex h-full w-full items-center justify-center bg-gradient-to-br ${gradient} text-white`}
          role="img"
          aria-hidden="true"
        >
          <Icon name={icon} size={48} />
        </div>
      )}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
    </div>
  );
};

const CardShell = ({ item, onCardClick, viewMode = 'grid', children }) => (
  <motion.article
    role="button"
    tabIndex={0}
    onClick={() => onCardClick(item.id)}
    onKeyDown={(e) => {
      if (e.key === 'Enter' || e.key === ' ') onCardClick(item.id);
    }}
    whileHover={{ y: -6 }}
    whileTap={{ scale: 0.985 }}
    transition={{ type: 'spring', stiffness: 300, damping: 20 }}
    className={`group relative flex h-full cursor-pointer overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card transition-shadow hover:shadow-card-hover focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-900 dark:hover:border-indigo-500/50 dark:hover:shadow-glow-dark ${
      viewMode === 'list' ? 'flex-row items-stretch' : 'flex-col'
    }`}
  >
    {children}
  </motion.article>
);

const EquipmentCard = ({ item, onCardClick, viewMode = 'grid' }) => {
  const status = StatusLogic.getEquipmentStatusInfo(item.status);
  const isList = viewMode === 'list';
  const imageBlock = (
    <div className={isList ? 'relative w-36 shrink-0 sm:w-44' : 'relative h-36 md:h-44 lg:h-48'}>
      <CardImage
        src={item.imageUrl}
        icon={EquipmentLogic.getStatusIcon(item.status)}
        gradient="from-sky-500 to-blue-700"
      />
      <span className="absolute left-2.5 top-2.5 rounded-lg bg-black/60 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-white backdrop-blur-sm">
        {FormattingLogic.formatEquipmentCategory(item.category)}
      </span>
      <span className="absolute right-2.5 top-2.5 flex items-center gap-1 rounded-lg bg-white/90 px-2 py-1 text-[10px] font-bold text-slate-700 backdrop-blur-sm dark:bg-slate-800/90 dark:text-slate-200">
        <Icon name={status.icon} size={12} />
        {status.label}
      </span>
    </div>
  );
  const contentBlock = (
    <div className={`flex flex-1 flex-col gap-2 ${isList ? 'p-4' : 'p-4 md:p-5'}`}>
      <h3 className="font-display text-sm font-bold text-slate-800 md:text-base dark:text-slate-100">{item.name}</h3>
      <p className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
        <Icon name="map-pin" size={13} />
        {FormattingLogic.formatLocation(item.location)}
      </p>
      <div className="mt-auto flex items-center justify-between pt-2">
        <StatusBadge className={status.color} icon={status.icon} label={status.label} />
        <span className="text-[10px] text-slate-400 dark:text-slate-500">
          {FormattingLogic.getRelativeTime(new Date(item.lastUpdated))}
        </span>
      </div>
    </div>
  );
  return (
    <CardShell item={item} onCardClick={onCardClick} viewMode={viewMode}>
      {imageBlock}
      {contentBlock}
    </CardShell>
  );
};

const CafeCard = ({ item, onCardClick, viewMode = 'grid' }) => {
  const availability = StatusLogic.getAvailabilityStatusInfo(item.available);
  const isList = viewMode === 'list';
  const imageBlock = (
    <div className={isList ? 'relative w-36 shrink-0 sm:w-44' : 'relative h-36 md:h-44 lg:h-48'}>
      <CardImage
        src={item.imageUrl}
        icon={CafeLogic.getCategoryIcon(item.category)}
        gradient="from-rose-400 to-orange-500"
      />
      <span className="absolute left-2.5 top-2.5 rounded-lg bg-black/60 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-white backdrop-blur-sm">
        {FormattingLogic.formatCafeCategory(item.category)}
      </span>
      <span className="absolute bottom-2.5 right-2.5 rounded-xl bg-white/95 px-2.5 py-1 text-sm font-extrabold text-emerald-700 shadow-lg backdrop-blur-sm dark:bg-slate-800/95 dark:text-emerald-400">
        {CafeLogic.formatPrice(item.price)}
      </span>
    </div>
  );
  const contentBlock = (
    <div className={`flex flex-1 flex-col gap-2 ${isList ? 'p-4' : 'p-4 md:p-5'}`}>
      <h3 className="font-display text-sm font-bold text-slate-800 md:text-base dark:text-slate-100">{item.name}</h3>
      <p className="text-xs leading-relaxed text-slate-500 dark:text-slate-400">{item.description}</p>
      {item.dietary.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {CafeLogic.getDietaryBadges(item.dietary).map((badge) => (
            <span
              key={badge}
              className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 ring-1 ring-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:ring-emerald-500/30"
            >
              {badge}
            </span>
          ))}
        </div>
      )}
      <div className="mt-auto flex items-center justify-between pt-2">
        <StatusBadge className={availability.color} icon={availability.icon} label={availability.label} />
        {item.category === 'special' && (
          <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-amber-400 to-orange-400 px-2 py-0.5 text-[10px] font-bold text-white shadow">
            <Icon name="star" size={11} /> Daily Special
          </span>
        )}
      </div>
    </div>
  );
  return (
    <CardShell item={item} onCardClick={onCardClick} viewMode={viewMode}>
      {imageBlock}
      {contentBlock}
    </CardShell>
  );
};

const TransitCard = ({ item, onCardClick, viewMode = 'grid' }) => {
  const delay = StatusLogic.getDelayStatusInfo(item.delay);
  const capacity = StatusLogic.getCapacityStatusInfo(item.capacity);
  const isList = viewMode === 'list';
  const imageBlock = (
    <div className={isList ? 'relative w-40 shrink-0 sm:w-52' : 'relative h-32 md:h-36'}>
      <CardImage
        src={item.imageUrl}
        icon={TransitLogic.getTransitIcon(item.type)}
        gradient="from-indigo-500 to-blue-600"
      />
      <div className="absolute inset-0 flex items-end bg-gradient-to-t from-slate-900/80 via-slate-900/30 to-transparent p-3">
        <div className="flex items-center gap-2">
          <span aria-hidden="true" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/15 backdrop-blur-sm">
            <Icon name={TransitLogic.getTransitIcon(item.type)} size={20} />
          </span>
          <div>
            <h3 className="font-display text-sm font-bold leading-tight text-white">{item.name}</h3>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-200">
              {item.direction}
            </p>
          </div>
        </div>
        <span
          className={`ml-auto flex items-center gap-1 rounded-lg bg-black/50 px-2 py-1 text-[10px] font-bold text-white backdrop-blur-sm ${delay.color}`}
        >
          <Icon name={delay.icon} size={12} /> {delay.label}
        </span>
      </div>
    </div>
  );
  const contentBlock = (
    <div className={`flex flex-1 flex-col gap-3 ${isList ? 'p-4' : 'p-4 md:p-5'}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Next Arrival</p>
          <p className="font-display text-lg font-extrabold text-slate-800 dark:text-slate-100">
            {TransitLogic.formatETA(TransitLogic.calculateETA(item.nextArrival, item.delay))}
          </p>
        </div>
        <span className={`inline-flex items-center gap-1 rounded-full bg-slate-50 px-2.5 py-1 text-xs font-bold dark:bg-slate-800 ${capacity.color}`}>
          <Icon name={capacity.icon} size={12} fill="currentColor" /> {item.capacity}%
        </span>
      </div>
      <div>
        <div className="mb-1 flex items-center justify-between text-[11px]">
          <span className="font-semibold text-slate-500 dark:text-slate-400">Capacity load</span>
          <span className="text-slate-400 dark:text-slate-500">{TransitLogic.getCapacityLevel(item.capacity)}</span>
        </div>
        <motion.div className="h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
          <motion.div
            className={`h-full rounded-full ${CAPACITY_BAR_COLORS[TransitLogic.getCapacityLevel(item.capacity)]}`}
            initial={{ width: 0 }}
            whileInView={{ width: `${item.capacity}%` }}
            viewport={{ once: true }}
            transition={{ duration: 0.9, ease: 'easeOut' }}
          />
        </motion.div>
      </div>
      <p className="truncate text-xs text-slate-500 dark:text-slate-400">
        <Icon name="route" size={12} className="mr-1 inline" /> {item.route.join(' → ')}
      </p>
      {item.alerts && item.alerts.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-1 rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1.5 text-[11px] font-semibold text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-400"
        >
          <Icon name="alert-triangle" size={13} />
          {item.alerts[0]}
        </motion.div>
      )}
    </div>
  );
  return (
    <CardShell item={item} onCardClick={onCardClick} viewMode={viewMode}>
      {imageBlock}
      {contentBlock}
    </CardShell>
  );
};

/* ------------------------------------------------------------------ */
/* Section heading + grid                                              */
/* ------------------------------------------------------------------ */

const GallerySection = ({ title, subtitle, icon, accent, count, children }) => (
  <motion.section
    variants={sectionVariants}
    initial="hidden"
    animate="show"
    exit="exit"
    aria-label={title}
    className="mb-8"
  >
    <div className="mb-3 flex items-end justify-between">
      <div>
        <h2 className="flex items-center gap-2 font-display text-base font-extrabold text-slate-800 md:text-lg dark:text-slate-100">
          <span
            aria-hidden="true"
            className={`flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br ${accent} text-white shadow`}
          >
            <Icon name={icon} size={17} />
          </span>
          {title}
        </h2>
        <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{subtitle}</p>
      </div>
      <motion.span
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        className="rounded-full bg-indigo-100 px-2.5 py-1 text-xs font-bold text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300"
      >
        {count} {count === 1 ? 'item' : 'items'}
      </motion.span>
    </div>
    {children}
  </motion.section>
);

const EmptyState = ({ message }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.97 }}
    animate={{ opacity: 1, scale: 1 }}
    className="flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-slate-300 bg-white/50 py-12 text-center dark:border-slate-700 dark:bg-slate-900/40"
  >
    <motion.span
      className="text-4xl text-slate-300 dark:text-slate-600"
      aria-hidden="true"
      animate={{ y: [0, -6, 0], rotate: [0, 8, 0] }}
      transition={{ repeat: Infinity, duration: 2.2 }}
    >
      <Icon name="search" size={40} />
    </motion.span>
    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{message}</p>
  </motion.div>
);

const FilterChip = ({ label, icon, active, onClick }) => (
  <motion.button
    whileTap={{ scale: 0.95 }}
    onClick={onClick}
    aria-pressed={active}
    className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold transition-colors ${
      active
        ? 'border-indigo-400 bg-indigo-600 text-white shadow'
        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800'
    }`}
  >
    <Icon name={icon} size={12} />
    {label}
  </motion.button>
);

const FilterGroup = ({ title, children }) => (
  <div className="flex flex-col gap-2">
    <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">{title}</h4>
    <div className="flex flex-wrap gap-1.5">{children}</div>
  </div>
);

const RangeField = ({ label, value, min, max, step, suffix, onChange }) => (
  <div className="flex flex-col gap-2">
    <div className="flex items-center justify-between">
      <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">{label}</h4>
      <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
        {value}
        {suffix}
      </span>
    </div>
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-slate-200 accent-indigo-600 dark:bg-slate-700"
      aria-label={label}
    />
  </div>
);

/* ------------------------------------------------------------------ */
/* Dashboard                                                           */
/* ------------------------------------------------------------------ */

export default function Dashboard() {
  const {
    state,
    setSelectedCategory,
    setSearchQuery,
    setActiveCard,
    setViewMode,
    toggleFilterEquipment,
    toggleFilterCafe,
    toggleFilterTransit,
    toggleFilterDietary,
    setPriceRange,
    setDelayThreshold,
    setCapacityThreshold,
    clearFilters,
  } = useApp();
  const [sort, setSort] = useState({
    equipment: SortingLogic.getDefaultSort('equipment'),
    cafe: SortingLogic.getDefaultSort('cafe'),
    transit: SortingLogic.getDefaultSort('transit'),
  });
  const [filtersOpen, setFiltersOpen] = useState(false);

  const filtered = useMemo(() => getFilteredData(state), [state]);

  const sortedEquipment = useMemo(
    () => SortingLogic.sortEquipment(filtered.equipment, sort.equipment.field, sort.equipment.direction),
    [filtered.equipment, sort.equipment]
  );
  const sortedCafe = useMemo(
    () => SortingLogic.sortCafeItems(filtered.cafe, sort.cafe.field, sort.cafe.direction),
    [filtered.cafe, sort.cafe]
  );
  const sortedTransit = useMemo(
    () => SortingLogic.sortTransitLines(filtered.transit, sort.transit.field, sort.transit.direction),
    [filtered.transit, sort.transit]
  );

  const isSearching = state.ui.searchQuery.trim().length > 0;
  const selected = state.ui.selectedCategory;
  const viewMode = state.ui.viewMode;

  const showEquipment = selected === 'all' || selected === 'equipment';
  const showCafe = selected === 'all' || selected === 'cafe';
  const showTransit = selected === 'all' || selected === 'transit';

  const hasAny = sortedEquipment.length > 0 || sortedCafe.length > 0 || sortedTransit.length > 0;

  const filterCount = FilterLogic.getActiveFilterCount({
    equipmentStatus: state.filters.equipmentStatus,
    cafeCategories: state.filters.cafeCategory,
    transitTypes: state.filters.transitType,
    dietary: state.filters.dietaryRestrictions,
    priceRange: state.filters.priceRange,
    maxDelay: state.filters.delayThreshold,
    maxCapacity: state.filters.capacityThreshold,
  });

  const priceBounds = useMemo(() => {
    const prices = state.data.cafe.map((item) => item.price);
    return {
      min: prices.length ? Math.min(...prices) : 0,
      max: prices.length ? Math.max(...prices) : 10,
    };
  }, [state.data.cafe]);

  const delayBounds = useMemo(() => {
    const delays = state.data.transit.map((item) => item.delay);
    return {
      min: delays.length ? Math.min(...delays) : 0,
      max: delays.length ? Math.max(...delays) : 30,
    };
  }, [state.data.transit]);

  const updateSort = (field) =>
    setSort((prev) => ({ ...prev, [selected]: { ...prev[selected], field } }));
  const toggleSortDirection = () =>
    setSort((prev) => ({
      ...prev,
      [selected]: {
        ...prev[selected],
        direction: prev[selected].direction === 'asc' ? 'desc' : 'asc',
      },
    }));

  const grid =
    viewMode === 'list'
      ? 'grid grid-cols-1 gap-4'
      : 'grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3';

  return (
    <div className="flex h-full flex-col">
      {/* Overview (totals + charts) on the Dashboard view */}
      {selected === 'all' && <OverviewStats data={state.data} onSelect={setSelectedCategory} />}

      {/* Filters */}
      <div className="mb-4 flex flex-col gap-3">
        <div className="flex flex-wrap gap-2" role="tablist" aria-label="Category filter">
          {CATEGORIES.map((cat) => {
            const active = selected === cat.id;
            return (
              <motion.button
                key={cat.id}
                role="tab"
                aria-selected={active}
                onClick={() => setSelectedCategory(cat.id)}
                whileTap={{ scale: 0.94 }}
                layout
                className={`relative rounded-full px-3.5 py-1.5 text-sm font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                  active ? 'text-white' : 'text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800'
                }`}
              >
                {active && (
                  <motion.span
                    layoutId="active-tab"
                    className="absolute inset-0 rounded-full bg-gradient-to-r from-indigo-600 to-blue-600 shadow"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
                <span className="relative z-10 inline-flex items-center gap-1.5">
                  <Icon name={cat.icon} size={15} />
                  {cat.label}
                </span>
              </motion.button>
            );
          })}
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <label className="relative flex-1">
            <span className="sr-only">Search campus services</span>
            <span
              aria-hidden="true"
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            >
              <Icon name="search" size={16} />
            </span>
            <input
              type="search"
              value={state.ui.searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search equipment, menu items, routes..."
              className="w-full rounded-xl border border-slate-200 bg-white/80 py-2.5 pl-9 pr-3 text-sm text-slate-700 shadow-card backdrop-blur-sm placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-200 dark:placeholder-slate-500 dark:focus:border-indigo-400"
            />
          </label>
          <AnimatePresence>
            {isSearching && (
              <motion.button
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
                onClick={() => setSearchQuery('')}
                className="inline-flex items-center gap-1 rounded-xl px-3 py-2 text-sm font-semibold text-indigo-600 hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-indigo-400 dark:hover:bg-indigo-500/10"
              >
                <Icon name="x" size={14} /> Clear
              </motion.button>
            )}
          </AnimatePresence>
        </div>

        {/* Toolbar: filters, view mode, sort */}
        <div className="flex flex-wrap items-center gap-2">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setFiltersOpen((v) => !v)}
            aria-expanded={filtersOpen}
            className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold transition-colors ${
              filterCount > 0
                ? 'border-indigo-300 bg-indigo-50 text-indigo-700 dark:border-indigo-500/50 dark:bg-indigo-500/10 dark:text-indigo-300'
                : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800'
            }`}
          >
            <Icon name="sliders-horizontal" size={14} />
            Filters
            {filterCount > 0 && (
              <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-indigo-600 px-1 text-[10px] font-bold text-white">
                {filterCount}
              </span>
            )}
          </motion.button>

          <div
            className="flex overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900"
            role="group"
            aria-label="View mode"
          >
            <button
              onClick={() => setViewMode('grid')}
              aria-pressed={viewMode === 'grid'}
              className={`flex items-center gap-1 px-3 py-2 text-xs font-semibold transition-colors ${
                viewMode === 'grid'
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              <Icon name="layout-grid" size={14} /> Grid
            </button>
            <button
              onClick={() => setViewMode('list')}
              aria-pressed={viewMode === 'list'}
              className={`flex items-center gap-1 px-3 py-2 text-xs font-semibold transition-colors ${
                viewMode === 'list'
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              <Icon name="list" size={14} /> List
            </button>
          </div>

          {selected !== 'all' && (
            <div className="flex items-center overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
              <select
                aria-label="Sort field"
                value={sort[selected].field}
                onChange={(e) => updateSort(e.target.value)}
                className="cursor-pointer border-none bg-transparent py-2 pl-3 pr-1 text-xs font-semibold text-slate-600 focus:outline-none dark:text-slate-300"
              >
                {SORT_OPTIONS[selected].map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <button
                onClick={toggleSortDirection}
                aria-label={sort[selected].direction === 'asc' ? 'Sort ascending' : 'Sort descending'}
                className="flex items-center px-2 py-2 text-slate-500 hover:bg-slate-50 focus:outline-none dark:text-slate-400 dark:hover:bg-slate-800"
              >
                <Icon name={sort[selected].direction === 'asc' ? 'arrow-up' : 'arrow-down'} size={14} />
              </button>
            </div>
          )}

          {filterCount > 0 && (
            <motion.button
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              onClick={clearFilters}
              className="inline-flex items-center gap-1 rounded-xl px-3 py-2 text-xs font-semibold text-slate-500 hover:bg-slate-100 focus:outline-none dark:text-slate-400 dark:hover:bg-slate-800"
            >
              <Icon name="x" size={13} /> Clear all
            </motion.button>
          )}
        </div>

        {/* Collapsible filter panel */}
        <AnimatePresence initial={false}>
          {filtersOpen && (
            <motion.div
              key="filter-panel"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="overflow-hidden"
            >
              <div className="rounded-2xl border border-slate-200 bg-white/70 p-4 shadow-card backdrop-blur-sm dark:border-slate-700 dark:bg-slate-900/70">
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  <FilterGroup title="Equipment Status">
                    {EQUIPMENT_STATUS_OPTIONS.map((opt) => (
                      <FilterChip
                        key={opt.value}
                        label={opt.label}
                        icon={opt.icon}
                        active={state.filters.equipmentStatus?.includes(opt.value) || false}
                        onClick={() => toggleFilterEquipment(opt.value)}
                      />
                    ))}
                  </FilterGroup>
                  <FilterGroup title="Cafe Category">
                    {CAFE_CATEGORY_OPTIONS.map((opt) => (
                      <FilterChip
                        key={opt.value}
                        label={opt.label}
                        icon={opt.icon}
                        active={state.filters.cafeCategory?.includes(opt.value) || false}
                        onClick={() => toggleFilterCafe(opt.value)}
                      />
                    ))}
                  </FilterGroup>
                  <FilterGroup title="Transit Type">
                    {TRANSIT_TYPE_OPTIONS.map((opt) => (
                      <FilterChip
                        key={opt.value}
                        label={opt.label}
                        icon={opt.icon}
                        active={state.filters.transitType?.includes(opt.value) || false}
                        onClick={() => toggleFilterTransit(opt.value)}
                      />
                    ))}
                  </FilterGroup>
                  <FilterGroup title="Dietary Preferences">
                    {DIETARY_OPTIONS.map((opt) => (
                      <FilterChip
                        key={opt.value}
                        label={opt.label}
                        icon={opt.icon}
                        active={state.filters.dietaryRestrictions?.includes(opt.value) || false}
                        onClick={() => toggleFilterDietary(opt.value)}
                      />
                    ))}
                  </FilterGroup>
                  <div className="flex flex-col gap-4">
                    <RangeField
                      label="Max Price"
                      value={state.filters.priceRange?.max ?? priceBounds.max}
                      min={priceBounds.min}
                      max={priceBounds.max}
                      step={1}
                      suffix=" USD"
                      onChange={(v) => setPriceRange({ min: priceBounds.min, max: v })}
                    />
                    <RangeField
                      label="Max Delay"
                      value={state.filters.delayThreshold ?? delayBounds.max}
                      min={delayBounds.min}
                      max={delayBounds.max}
                      step={1}
                      suffix=" min"
                      onChange={(v) => setDelayThreshold(v)}
                    />
                  </div>
                  <div className="flex flex-col gap-4">
                    <RangeField
                      label="Max Capacity"
                      value={state.filters.capacityThreshold ?? 100}
                      min={0}
                      max={100}
                      step={5}
                      suffix="%"
                      onChange={(v) => setCapacityThreshold(v)}
                    />
                    {filterCount > 0 && (
                      <button
                        onClick={clearFilters}
                        className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-bold text-rose-600 transition-colors hover:bg-rose-100 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-400 dark:hover:bg-rose-500/20"
                      >
                        <Icon name="trash" size={13} /> Reset all filters
                      </button>
                    )}
                  </div>
                </div>
              </div>
          </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Gallery */}
      <div className="flex-1">
        <AnimatePresence mode="popLayout">
          {!hasAny ? (
            <motion.div key="empty" variants={sectionVariants} initial="hidden" animate="show" exit="exit">
              <EmptyState
                message={
                  isSearching
                    ? `No results for "${state.ui.searchQuery}". Try a different search.`
                    : 'No items match the current filters.'
                }
              />
            </motion.div>
          ) : (
            <motion.div key="sections" variants={containerVariants} initial="hidden" animate="show">
              {showEquipment && (
                <GallerySection
                  title="Equipment Availability"
                  subtitle="Laptops, projectors, AV gear & more"
                  icon="laptop"
                  accent="from-sky-500 to-blue-700"
                  count={sortedEquipment.length}
                >
                  {sortedEquipment.length === 0 ? (
                    <EmptyState message="No equipment matches your search." />
                  ) : (
                    <motion.div className={grid} variants={containerVariants} initial="hidden" animate="show">
                      <AnimatePresence mode="popLayout">
                        {sortedEquipment.map((item) => (
                          <motion.div
                            key={item.id}
                            layout
                            variants={cardVariants}
                            initial="hidden"
                            animate="show"
                            exit="exit"
                            className="h-full"
                          >
                            <EquipmentCard item={item} onCardClick={setActiveCard} viewMode={viewMode} />
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </motion.div>
                  )}
                </GallerySection>
              )}

              {showCafe && (
                <GallerySection
                  title="Cafe Menu"
                  subtitle="Breakfast, lunch, beverages & today's special"
                  icon="coffee"
                  accent="from-rose-400 to-orange-500"
                  count={sortedCafe.length}
                >
                  {sortedCafe.length === 0 ? (
                    <EmptyState message="No menu items match your search." />
                  ) : (
                    <motion.div className={grid} variants={containerVariants} initial="hidden" animate="show">
                      <AnimatePresence mode="popLayout">
                        {sortedCafe.map((item) => (
                          <motion.div
                            key={item.id}
                            layout
                            variants={cardVariants}
                            initial="hidden"
                            animate="show"
                            exit="exit"
                            className="h-full"
                          >
                            <CafeCard item={item} onCardClick={setActiveCard} viewMode={viewMode} />
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </motion.div>
                  )}
                </GallerySection>
              )}

              {showTransit && (
                <GallerySection
                  title="Transit Lines"
                  subtitle="Buses, trains & shuttles with live delay / capacity"
                  icon="bus"
                  accent="from-indigo-500 to-blue-600"
                  count={sortedTransit.length}
                >
                  {sortedTransit.length === 0 ? (
                    <EmptyState message="No transit lines match your search." />
                  ) : (
                    <motion.div className={grid} variants={containerVariants} initial="hidden" animate="show">
                      <AnimatePresence mode="popLayout">
                        {sortedTransit.map((item) => (
                          <motion.div
                            key={item.id}
                            layout
                            variants={cardVariants}
                            initial="hidden"
                            animate="show"
                            exit="exit"
                            className="h-full"
                          >
                            <TransitCard item={item} onCardClick={setActiveCard} viewMode={viewMode} />
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </motion.div>
                  )}
                </GallerySection>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
