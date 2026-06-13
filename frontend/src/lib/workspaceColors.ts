import type { WorkspaceColor } from '@/types/workspace';

export const WORKSPACE_COLORS: Record<WorkspaceColor, string> = {
  RED: '#e0525f',
  ORANGE: '#e0894e',
  AMBER: '#e5a329',
  YELLOW: '#f5cc52',
  GREEN: '#6dcc6f',
  TEAL: '#3fa394',
  BLUE: '#4b8fc7',
  SKY: '#6cb6e3',
  INDIGO: '#6b6fd4',
  VIOLET: '#9579d4',
  PINK: '#d977a8',
  ROSE: '#e55973',
  GRAY: '#a8a8a8',
};

export const WORKSPACE_COLOR_NAMES = Object.keys(WORKSPACE_COLORS) as WorkspaceColor[];

const FALLBACK = '#853664';

export function colorHex(color?: WorkspaceColor | null): string {
  return color ? WORKSPACE_COLORS[color] : FALLBACK;
}

export function colorTint(color: WorkspaceColor | null | undefined, percent: number): string {
  return `color-mix(in srgb, ${colorHex(color)} ${percent}%, transparent)`;
}
