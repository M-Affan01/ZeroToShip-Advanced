/**
 * OverviewStats.jsx - Dashboard overview: summary total cards + lightweight charts.
 * Pure Tailwind / framer-motion (no chart library).
 */

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import Icon from './Icon.jsx';

const EQUIPMENT_STATUSES = [
  { status: 'available', label: 'Available', bar: 'bg-emerald-500' },
  { status: 'in-use', label: 'In Use', bar: 'bg-sky-500' },
  { status: 'maintenance', label: 'Maintenance', bar: 'bg-amber-500' },
  { status: 'reserved', label: 'Reserved', bar: 'bg-violet-500' },
];

const CAFE_CATEGORIES = [
  { category: 'breakfast', label: 'Breakfast', color: '#f43f5e' },
  { category: 'lunch', label: 'Lunch', color: '#f97316' },
  { category: 'beverage', label: 'Beverage', color: '#f59e0b' },
  { category: 'snack', label: 'Snack', color: '#10b981' },
  { category: 'special', label: 'Special', color: '#d946ef' },
];

const SummaryCard = ({ icon, label, value, sub, accent, onClick }) => (
  <motion.button
    type="button"
    onClick={onClick}
    whileHover={onClick ? { y: -2 } : undefined}
    whileTap={onClick ? { scale: 0.98 } : undefined}
    className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3.5 text-left shadow-card transition-shadow hover:shadow-card-hover focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-800 dark:bg-slate-900"
  >
    <span
      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${accent} text-white shadow`}
      aria-hidden="true"
    >
      <Icon name={icon} size={18} />
    </span>
    <span className="min-w-0">
      <span className="block truncate text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500">
        {label}
      </span>
      <span className="block font-display text-lg font-extrabold leading-tight text-slate-800 dark:text-slate-100">
        {value}
      </span>
      <span className="block truncate text-[11px] text-slate-500 dark:text-slate-400">{sub}</span>
    </span>
  </motion.button>
);

const ChartCard = ({ title, icon, children }) => (
  <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-card dark:border-slate-800 dark:bg-slate-900">
    <div className="flex items-center justify-between">
      <h3 className="font-display text-sm font-extrabold text-slate-800 dark:text-slate-100">{title}</h3>
      <Icon name={icon} size={16} className="text-slate-400" aria-hidden="true" />
    </div>
    {children}
  </div>
);

const delayColor = (delay) => {
  if (delay === 0) return 'bg-emerald-500';
  if (delay < 5) return 'bg-yellow-500';
  if (delay < 10) return 'bg-orange-500';
  return 'bg-red-500';
};

export default function OverviewStats({ data, onSelect }) {
  const equipment = data?.equipment || [];
  const cafe = data?.cafe || [];
  const transit = data?.transit || [];
  const faq = data?.faq || [];

  const equipCounts = useMemo(() => {
    const counts = { available: 0, 'in-use': 0, maintenance: 0, reserved: 0 };
    equipment.forEach((item) => {
      if (item.status in counts) counts[item.status] += 1;
    });
    return counts;
  }, [equipment]);

  const cafeCounts = useMemo(() => {
    const counts = {};
    cafe.forEach((item) => {
      counts[item.category] = (counts[item.category] || 0) + 1;
    });
    return counts;
  }, [cafe]);

  const equipTotal = equipment.length || 1;
  const cafeTotal = cafe.length || 1;
  const equipAvailable = equipCounts.available;
  const cafeAvailable = cafe.filter((item) => item.available).length;
  const onTime = transit.filter((item) => item.delay === 0).length;
  const transitTotal = transit.length;
  const totalServices = equipment.length + cafe.length + transit.length;
  const maxDelay = Math.max(...transit.map((item) => item.delay), 1);

  const donutStops = useMemo(() => {
    let acc = 0;
    return CAFE_CATEGORIES.filter((cat) => cafeCounts[cat.category]).map((cat) => {
      const start = (acc / cafeTotal) * 360;
      acc += cafeCounts[cat.category];
      const end = (acc / cafeTotal) * 360;
      return `${cat.color} ${start.toFixed(1)}deg ${end.toFixed(1)}deg`;
    });
  }, [cafeCounts, cafeTotal]);

  const lineLabel = (name) => name.split(' - ')[0];

  return (
    <div className="mb-4 flex flex-col gap-3">
      {/* Summary total cards */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard
          icon="laptop"
          label="Equipment"
          value={`${equipAvailable}/${equipment.length}`}
          sub="units available"
          accent="from-sky-500 to-blue-700"
          onClick={onSelect ? () => onSelect('equipment') : undefined}
        />
        <SummaryCard
          icon="coffee"
          label="Cafe menu"
          value={`${cafeAvailable}/${cafe.length}`}
          sub="items in stock"
          accent="from-rose-400 to-orange-500"
          onClick={onSelect ? () => onSelect('cafe') : undefined}
        />
        <SummaryCard
          icon="bus"
          label="Transit"
          value={`${onTime}/${transitTotal}`}
          sub="lines on time"
          accent="from-indigo-500 to-blue-600"
          onClick={onSelect ? () => onSelect('transit') : undefined}
        />
        <SummaryCard
          icon="graduation-cap"
          label="Campus services"
          value={totalServices}
          sub={`${faq.length} FAQs & guides`}
          accent="from-violet-500 to-purple-600"
          onClick={onSelect ? () => onSelect('all') : undefined}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
        {/* Equipment by status */}
        <ChartCard title="Equipment by status" icon="laptop">
          <div className="flex h-3 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
            {EQUIPMENT_STATUSES.filter((s) => equipCounts[s.status] > 0).map((s) => (
              <motion.div
                key={s.status}
                initial={{ width: 0 }}
                animate={{ width: `${(equipCounts[s.status] / equipTotal) * 100}%` }}
                transition={{ duration: 0.7, ease: 'easeOut' }}
                className={`h-full ${s.bar}`}
              />
            ))}
          </div>
          <div className="flex flex-wrap gap-x-3 gap-y-1">
            {EQUIPMENT_STATUSES.filter((s) => equipCounts[s.status] > 0).map((s) => (
              <span
                key={s.status}
                className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-slate-600 dark:text-slate-300"
              >
                <span className={`h-2 w-2 rounded-full ${s.bar}`} aria-hidden="true" />
                {s.label} · {equipCounts[s.status]}
              </span>
            ))}
          </div>
        </ChartCard>

        {/* Cafe menu mix */}
        <ChartCard title="Cafe menu mix" icon="coffee">
          <div className="flex items-center justify-center gap-4">
            <div
              className="relative h-28 w-28 shrink-0 rounded-full"
              style={{ background: donutStops.length ? `conic-gradient(${donutStops.join(', ')})` : '#e2e8f0' }}
              role="img"
              aria-label="Cafe menu distribution"
            >
              <div className="absolute inset-2 flex flex-col items-center justify-center rounded-full bg-white dark:bg-slate-900">
                <span className="font-display text-xl font-extrabold text-slate-800 dark:text-slate-100">
                  {cafe.length}
                </span>
                <span className="text-[10px] font-semibold text-slate-400">items</span>
              </div>
            </div>
            <div className="flex flex-col gap-1">
              {CAFE_CATEGORIES.filter((c) => cafeCounts[c.category]).map((c) => (
                <span
                  key={c.category}
                  className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-slate-600 dark:text-slate-300"
                >
                  <span className="h-2 w-2 rounded-full" style={{ background: c.color }} aria-hidden="true" />
                  {c.label} · {cafeCounts[c.category]}
                </span>
              ))}
            </div>
          </div>
        </ChartCard>

        {/* Transit delays */}
        <ChartCard title="Transit delays" icon="bus">
          {transit.length === 0 ? (
            <p className="text-sm text-slate-400">No transit data.</p>
          ) : (
            <div className="flex h-28 items-end justify-between gap-2 overflow-hidden">
              {transit.map((item) => (
                <div key={item.id} className="flex min-w-0 flex-1 flex-col items-center gap-1">
                  <span className="text-[10px] font-bold tabular-nums text-slate-500 dark:text-slate-400">
                    {item.delay}m
                  </span>
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{
                      height: `${item.delay === 0 ? 4 : Math.max(16, (item.delay / maxDelay) * 60)}px`,
                    }}
                    transition={{ duration: 0.7, ease: 'easeOut' }}
                    className={`w-full max-w-[22px] rounded-t-md ${delayColor(item.delay)}`}
                    title={lineLabel(item.name)}
                  />
                  <span className="w-full truncate text-center text-[10px] font-bold text-slate-500 dark:text-slate-400">
                    {lineLabel(item.name)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </ChartCard>
      </div>
    </div>
  );
}
