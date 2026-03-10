export interface WallConfig {
  // Background
  bgType: 'solid' | 'gradient';
  bgColor: string;
  bgGradientFrom: string;
  bgGradientTo: string;
  bgGradientAngle: number;

  // Card
  cardBg: string;
  cardBorderRadius: number;
  cardShadow: 'none' | 'sm' | 'md' | 'lg';

  // Text
  headerFont: string;
  bodyFont: string;
  headerColor: string;
  bodyColor: string;
  headerSize: number; // rem multiplier: 1 = default

  // Stars
  starColor: string;

  // Accent (top border on cards, rating badge)
  accentColor: string;

  // Layout
  columns: 1 | 2 | 3;
  maxWidth: number; // px

  // Header
  showLogo: boolean;
  showRatingBadge: boolean;
  headerText: string; // e.g. "What our customers are saying"

  // Footer
  showPoweredBy: boolean;
}

export const DEFAULT_WALL_CONFIG: WallConfig = {
  bgType: 'gradient',
  bgColor: '#f0f4ff',
  bgGradientFrom: '#f0f4ff',
  bgGradientTo: '#f0fdf4',
  bgGradientAngle: 145,

  cardBg: '#ffffff',
  cardBorderRadius: 12,
  cardShadow: 'md',

  headerFont: 'Inter, system-ui, sans-serif',
  bodyFont: 'Inter, system-ui, sans-serif',
  headerColor: '#1e293b',
  bodyColor: '#334155',
  headerSize: 1,

  starColor: '#f59e0b',

  accentColor: '#6366f1',

  columns: 3,
  maxWidth: 1000,

  showLogo: true,
  showRatingBadge: true,
  headerText: 'What our customers are saying',

  showPoweredBy: true,
};

export function mergeWallConfig(saved: Partial<WallConfig> | null | undefined): WallConfig {
  return { ...DEFAULT_WALL_CONFIG, ...(saved ?? {}) };
}
