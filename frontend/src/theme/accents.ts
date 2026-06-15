export interface AccentPreset {
  name: string;
  value: string;
}

export const ACCENT_PRESETS: AccentPreset[] = [
  { name: 'Rose', value: '#c14d63' },
  { name: 'Coral', value: '#e0894e' },
  { name: 'Amber', value: '#d9a82b' },
  { name: 'Green', value: '#5fa473' },
  { name: 'Teal', value: '#3fa394' },
  { name: 'Blue', value: '#4b8fc7' },
  { name: 'Indigo', value: '#6b6fd4' },
  { name: 'Violet', value: '#9579d4' },
  { name: 'Pink', value: '#d977a8' },
  { name: 'Grey', value: '#626262' },
];

export const DEFAULT_ACCENT = ACCENT_PRESETS[0].value;
