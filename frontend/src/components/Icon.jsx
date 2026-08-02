/**
 * Icon.jsx - Central icon registry powered by lucide-react.
 * Semantic keys map to real SVG icons (no emoji). Logic modules return keys,
 * components render them via <Icon name="..." />.
 */

import React from 'react';
import {
  CircleCheck,
  CircleX,
  TriangleAlert,
  Info,
  Bell,
  RefreshCw,
  Wrench,
  MapPin,
  CircleHelp,
  Circle,
  Sunrise,
  Sun,
  Coffee,
  Popcorn,
  Star,
  Utensils,
  Bus,
  TrainFront,
  CarFront,
  GraduationCap,
  Search,
  Send,
  LoaderCircle,
  Trash2,
  Zap,
  Leaf,
  Ban,
  Moon,
  Pause,
  LayoutGrid,
  Radio,
  Clock,
  Sparkles,
  X,
  Bot,
  Siren,
  ShieldCheck,
  ArrowUp,
  ArrowDown,
  SlidersHorizontal,
  List,
  Settings,
  Menu,
  Laptop,
  Projector,
  Camera,
  Speaker,
  Package,
  Music,
  Home,
  Route,
} from 'lucide-react';

const ICONS = {
  'check-circle': CircleCheck,
  'x-circle': CircleX,
  'alert-triangle': TriangleAlert,
  siren: Siren,
  info: Info,
  bell: Bell,
  'shield-check': ShieldCheck,
  refresh: RefreshCw,
  wrench: Wrench,
  pin: MapPin,
  'map-pin': MapPin,
  help: CircleHelp,
  dot: Circle,
  sunrise: Sunrise,
  sun: Sun,
  coffee: Coffee,
  popcorn: Popcorn,
  star: Star,
  utensils: Utensils,
  bus: Bus,
  train: TrainFront,
  shuttle: CarFront,
  car: CarFront,
  laptop: Laptop,
  projector: Projector,
  camera: Camera,
  audio: Speaker,
  speaker: Speaker,
  music: Music,
  other: Package,
  package: Package,
  bot: Bot,
  'graduation-cap': GraduationCap,
  search: Search,
  send: Send,
  'send-up': ArrowUp,
  'arrow-up': ArrowUp,
  'arrow-down': ArrowDown,
  'sliders-horizontal': SlidersHorizontal,
  settings: Settings,
  menu: Menu,
  list: List,
  loader: LoaderCircle,
  trash: Trash2,
  zap: Zap,
  leaf: Leaf,
  ban: Ban,
  moon: Moon,
  pause: Pause,
  'layout-grid': LayoutGrid,
  radio: Radio,
  clock: Clock,
  sparkles: Sparkles,
  x: X,
  home: Home,
  route: Route,
};

export default function Icon({ name, className = '', size = 16, strokeWidth = 2, ...rest }) {
  const Component = ICONS[name] || CircleHelp;
  return (
    <Component
      className={className}
      size={size}
      strokeWidth={strokeWidth}
      aria-hidden="true"
      {...rest}
    />
  );
}

export { ICONS };
